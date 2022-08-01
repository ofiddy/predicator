import * as formulas from "./formulas.js";
import { attemptDeleteFormula, attemptInsertFormula, bindKeysToButtonlist, readFormulaFromElements } from "./formula_entry_window.js";
import { bindPhysicsButton } from "./lib.js";

let modalDoc;

export function setUpModals () {
    fetch("./modals.html").then(function (response) {
        return response.text();
    }).then(function (html) {
        let parser = new DOMParser();
        modalDoc = parser.parseFromString(html, "text/html");
        document.body.append(modalDoc.getElementById("modal-toplevel"));
    });
}

export function orIntModalSetup (priorFormula) {
    // Performs the setup for the Or-Introduction modal
    
    //let priorText = priorFormula.show();
    let priorText = "lol";
    document.getElementById("modal-or-int-prior-left").textContent = priorText + " ⋁ ";
    document.getElementById("modal-or-int-prior-right").textContent = " ⋁ " + priorText;

    let leftVisible = true;
    document.getElementById("modal-or-int-swap").addEventListener("click", () => {
        if (leftVisible) {
            document.getElementById("modal-or-int-prior-left").style.display = "none";
            document.getElementById("modal-or-int-prior-right").style.display = "block";
        } else {
            document.getElementById("modal-or-int-prior-left").style.display = "block";
            document.getElementById("modal-or-int-prior-right").style.display = "none";
        }
        leftVisible = !leftVisible;
    });
}

export function andElimDialog (formula, resolve) {
    // Sets up the dialog
    let formulaText = formula.show();
    let modalTop = document.getElementById("modal-toplevel");
    modalTop.innerHTML = "";
    let andElimModal = document.importNode(modalDoc.getElementById("modal-and-elim"), true);
    modalTop.appendChild(andElimModal);

    document.getElementById("modal-and-elim-formula").innerText = formulaText;
    modalTop.style.display = "flex";
    andElimModal.style.display = "block";

    document.getElementById("modal-and-left-button").onclick = () => {resolve("left")};
    document.getElementById("modal-and-right-button").onclick = () => {resolve("right")};
}

export function closeAndElimDialog () {
    document.getElementById("modal-toplevel").innerHTML = "";
    document.getElementById("modal-toplevel").style.display = "none";
}

export function varEnterDialog (title, desc, formula, validation) {
    // Sets up the dialog
    let modalTop = document.getElementById("modal-toplevel");
    modalTop.innerHTML = "";
    let varEnterModal = document.importNode(modalDoc.getElementById("modal-var-enter"), true);
    modalTop.appendChild(varEnterModal);

    // Formats the window
    document.getElementById("modal-var-enter-title").innerText = title;
    document.getElementById("modal-var-enter-desc").innerText = desc;
    document.getElementById("modal-var-enter-display").innerText = formula.show();
    modalTop.style.display = "flex";
    varEnterModal.style.display = "block";

    // Resizes entry as typed
    function formulaSizeChange(event) {
        event.target.setAttribute("style", "width: " + (event.target.value.length + 1) + "ch");
    }
    document.getElementById("modal-var-enter-entry").addEventListener("input", formulaSizeChange);

    document.getElementById("modal-imp-int-confirmation").onclick = () => {
        validation(document.getElementById("modal-var-enter-entry").children[0].value);
    };
}

export function formulaInputDialog (title, desc, validation) {
    // Sets up the dialog
    let modalTop = document.getElementById("modal-toplevel");
    modalTop.innerHTML = "";
    let formImpModal = document.importNode(modalDoc.getElementById("modal-formula-input"), true);
    modalTop.appendChild(formImpModal);

    // Formats the window
    document.getElementById("modal-formula-input-title").innerText = title;
    document.getElementById("modal-formula-input-desc").innerText = desc;
    modalTop.style.display = "flex";
    formImpModal.style.display = "flex";

    // Sets up every button and the actual formula input functionality
    let lastClickedButton = null;
    let lastClickedFormula = null;
    let entry = document.getElementById("modal-formula-input-entry");
    entry.querySelector(".expression-input").dataset.formulaIndex = 0;
    let formulaScope = [new formulas.BasicFormula()];

    let buttonList = [];
    for (const e of document.getElementById("modal-formula-input-right-panel").children) {
        if (e.classList.contains("inheriting-button")) {
            buttonList.push(e);
            let buttonEvent = {
                "onClick": checkThenAttemptInsert,
                "onDragEnd": (event, below) => {
                    lastClickedFormula = below;
                    checkThenAttemptInsert(event);
                },
                "dragEndQuery": ".formula-elem",
            }
            bindPhysicsButton(e, buttonEvent);
        }
    }
    formulas.addFormulaData(buttonList);
    let bindDict = bindKeysToButtonlist(buttonList);

    function formulaElementFocus (event) {
        event.stopPropagation();
        lastClickedFormula = event.target;
    }
    entry.addEventListener("click", formulaElementFocus);

    function formulaKeyPress(event, _bindDict) {
        if (_bindDict[event.key]) {
            _bindDict[event.key].click();
        }
    }
    entry.addEventListener("keypress", (event) => {formulaKeyPress(event, bindDict)});

    function formulaBackspaceHandle(event) {
        if ((event.key === "Backspace" || event.key === "Delete") && !event.target.classList.contains("expanding-var-input")) {
            if (!event.target.classList.contains("expression-input")) {
                checkThenAttemptDelete(event);
            }
        } else if (event.key === " ") {
            event.preventDefault();
            return false;
        }
    }
    entry.addEventListener("keydown", formulaBackspaceHandle);

    function formulaSizeChange(event) {
        event.target.setAttribute("style", "width: " + (event.target.value.length + 1) + "ch");
    }
    entry.addEventListener("input", formulaSizeChange);

    function checkThenAttemptInsert(event) {
        event.stopPropagation();

        lastClickedButton = event.target;
        if (document.activeElement.classList.contains("formula-elem")) {
            attemptInsertFormula(event, document.activeElement, formulaScope);
        } else {
            if (lastClickedFormula !== null) {
                attemptInsertFormula(event, lastClickedFormula, formulaScope);
            }
        }
        lastClickedFormula = null;
    }

    function checkThenAttemptDelete(event) {
        event.stopPropagation();
        if (lastClickedFormula === null) {
            if (document.activeElement.classList.contains("formula-elem")) {
                attemptDeleteFormula(document.activeElement, formulaScope);
            }
        } else {
            attemptDeleteFormula(lastClickedFormula, formulaScope);
        }
        lastClickedFormula = null;
    }

    formImpModal.addEventListener("click", () => {
        lastClickedButton = null;
        lastClickedFormula = null;
    });

    document.getElementById("modal-formula-input-confirmation").onclick = function (event) {
        // Translates the entry into the formula object
        // And if valid, progresses
        let readForm = readFormulaFromElements(entry.children[0], formulaScope);
        if (!readForm) {
            alert("Error detected in expression");
            return;
        }
        validation(readForm);
    }
}

export function closeModal () {
    document.getElementById("modal-toplevel").innerHTML = "";
    document.getElementById("modal-toplevel").style.display = "none";
}