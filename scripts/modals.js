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
    window.removeEventListener("keydown", escSettingsModal);
    window.addEventListener("keydown", escKillModal);

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
    window.removeEventListener("keydown", escSettingsModal);
    window.addEventListener("keydown", escKillModal);

    // Resizes entry as typed
    function formulaSizeChange(event) {
        event.target.setAttribute("style", "width: " + (event.target.value.length + 1) + "ch");
    }
    document.getElementById("modal-var-enter-entry").addEventListener("input", formulaSizeChange);

    document.getElementById("modal-imp-int-confirmation").onclick = () => {
        validation(document.getElementById("modal-var-enter-entry").children[0].value);
    };
}

export function valueEnterDialog (title, desc, formula, validation) {
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
    let newElem = formulas.BasicVarFormula.newElem();
    document.getElementById("modal-var-enter-entry").children[0].replaceWith(newElem);
    newElem.assignedFormula = new formulas.BasicVarFormula();
    window.removeEventListener("keydown", escSettingsModal);
    window.addEventListener("keydown", escKillModal);

    // Resizes entry as typed
    function formulaSizeChange(event) {
        event.target.setAttribute("style", "width: " + (event.target.value.length + 1) + "ch");
    }
    document.getElementById("modal-var-enter-entry").addEventListener("input", formulaSizeChange);

    document.getElementById("modal-imp-int-confirmation").onclick = () => {
        validation(document.getElementById("modal-var-enter-entry").children[0]);
    };

    // Inserts a function when ( or ) pressed
    function formulaKeyPress(event) {
        if (event.key === "(" || event.key === ")") {
            event.preventDefault();
            event.stopPropagation();
            attemptInsertFormula(event, document.activeElement, "function");
        }
    }
    // And attempts to delete it when backspacing
    function formulaBackspaceHandle(event) {
        if ((event.key == "Backspace" || event.key == "Delete") ) {
            if (!event.target.classList.contains("expression-input")) {
                event.stopPropagation();
                if (document.activeElement.classList.contains("formula-elem")) {
                    attemptDeleteFormula(document.activeElement);
                }
            }
        }
    }
    document.getElementById("modal-var-enter-entry").addEventListener("keypress", (event) => {formulaKeyPress(event)});
    document.getElementById("modal-var-enter-entry").addEventListener("keydown", (event) => {formulaBackspaceHandle(event)});
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
    window.removeEventListener("keydown", escSettingsModal);
    window.addEventListener("keydown", escKillModal);

    // Sets up every button and the actual formula input functionality
    let lastClickedButton = null;
    let lastClickedFormula = null;
    let entry = document.getElementById("modal-formula-input-entry");
    entry.children[0].assignedFormula = new formulas.BasicFormula();

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
            event.preventDefault();
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
            attemptInsertFormula(event, document.activeElement);
        } else {
            if (lastClickedFormula !== null) {
                attemptInsertFormula(event, lastClickedFormula);
            }
        }
        lastClickedFormula = null;
    }

    function checkThenAttemptDelete(event) {
        event.stopPropagation();
        if (lastClickedFormula === null) {
            if (document.activeElement.classList.contains("formula-elem")) {
                attemptDeleteFormula(document.activeElement);
            }
        } else {
            attemptDeleteFormula(lastClickedFormula);
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
        let readForm = readFormulaFromElements(entry.children[0]);
        if (!readForm) {
            alert("Error detected in expression");
            return;
        }
        validation(readForm);
    }
}

export function orIntModal (resolve) {
    formulaInputDialog("⋁-Introduction", "Enter Ѱ: ɸ has been selected", resolve);
    let entry = document.getElementById("modal-formula-input-entry");

    // Add the extra decoration
    let hBox = document.createElement("div");
    hBox.classList.add("h-flex-container-modal");
    entry.parentElement.replaceChild(hBox, entry);

    let leftLabel = document.createElement("div");
    leftLabel.id = "modal-or-int-prior-left";
    leftLabel.classList.add("modal-body-text", "modal-or-int-prior", "cyan-elem");
    leftLabel.innerText = "ɸ ⋁ ";
    let rightLabel = document.createElement("div");
    rightLabel.id = "modal-or-int-prior-right";
    rightLabel.classList.add("modal-body-text", "modal-or-int-prior", "cyan-elem");
    rightLabel.innerText = " ⋁ ɸ";

    hBox.appendChild(leftLabel);
    hBox.appendChild(entry);
    hBox.appendChild(rightLabel);
    
    let swapB = document.createElement("button");
    swapB.id = "modal-or-int-swap";
    swapB.classList.add("inheriting-button", "cyan-elem", "modal-body-button");
    swapB.innerText = "Swap";
    document.getElementById("modal-formula-input-confirmation").parentElement.insertBefore(swapB, document.getElementById("modal-formula-input-confirmation"));

    swapB.leftVisible = true;
    swapB.onclick = () => {
        if (swapB.leftVisible) {
            leftLabel.style.display = "none";
            rightLabel.style.display = "block";
            swapB.leftVisible = false;
        } else {
            leftLabel.style.display = "block";
            rightLabel.style.display = "none";
            swapB.leftVisible = true; 
        }
    }
}

export function settingsModal () {
    let modalTop = document.getElementById("modal-toplevel");
    modalTop.innerHTML = "";
    let settingsModal = document.importNode(modalDoc.getElementById("modal-settings"), true);
    modalTop.appendChild(settingsModal);

    // Code to change the style
    let root = document.querySelector(":root").style;
    function changeToLight() {
        root.setProperty("--bg-color", "#FFFFFF");
        root.setProperty("--panel-color", "#D5D7D8");
        root.setProperty("--element-color", "#A6A6A6");

        root.setProperty("--red-theme", "#710D0D");
        root.setProperty("--cyan-theme", "#1055FB");
        root.setProperty("--yellow-theme", "#C68727");
        root.setProperty("--green-theme", "#2E6D37");
        root.setProperty("--orange-theme", "#AA3F16");
        root.setProperty("--purple-theme", "#630C99");
        root.setProperty("--greyblue-theme", "#2B4E87");
        root.setProperty("--white-theme", "#050505");
    }
    document.getElementById("modal-settings-light").onclick = changeToLight;

    function changeToColour() {
        root.setProperty("--bg-color", "#000122");
        root.setProperty("--panel-color", "#05213b");
        root.setProperty("--element-color", "#537EAD");

        root.setProperty("--red-theme", "#EB0D0D");
        root.setProperty("--cyan-theme", "#10C4FB");
        root.setProperty("--yellow-theme", "#EFE11D");
        root.setProperty("--green-theme", "#2EE337");
        root.setProperty("--orange-theme", "#FF802F");
        root.setProperty("--purple-theme", "#CE0FC4");
        root.setProperty("--greyblue-theme", "#4A86E8");
        root.setProperty("--white-theme", "#f0f0f0");
    }
    document.getElementById("modal-settings-colour").onclick = changeToColour;

    function changeToDark() {
        root.setProperty("--bg-color", "#1E1E1E");
        root.setProperty("--panel-color", "#252526");
        root.setProperty("--element-color", "#333333");

        root.setProperty("--red-theme", "#EB0D0D");
        root.setProperty("--cyan-theme", "#10C4FB");
        root.setProperty("--yellow-theme", "#EFE11D");
        root.setProperty("--green-theme", "#2EE337");
        root.setProperty("--orange-theme", "#FF802F");
        root.setProperty("--purple-theme", "#CE0FC4");
        root.setProperty("--greyblue-theme", "#4A86E8");
        root.setProperty("--white-theme", "#f0f0f0");
    }
    document.getElementById("modal-settings-dark").onclick = changeToDark;

    modalTop.onclick = closeModal;
    modalTop.style.display = "flex";
    settingsModal.style.display = "block";
}

export function closeModal () {
    document.getElementById("modal-toplevel").innerHTML = "";
    document.getElementById("modal-toplevel").style.display = "none";
}

function escKillModal (event) {
    if (event.key === "Escape") {
        window.removeEventListener("keydown", escKillModal);
        window.addEventListener("keydown", escSettingsModal);
        document.getElementById("proof-tutorial-box").textContent = "";
        document.onclick = null;
        closeModal();
    }
}

export function escSettingsModal (event) {
    if (event.key === "Escape") {
        settingsModal();
    }
}