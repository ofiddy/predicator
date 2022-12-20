import { bindKeysToButtonlist, attemptInsertFormula, attemptDeleteFormula, readFormulaFromElements } from "./formula_entry_window.js"
import * as formulas from "./formulas.js"
import { bindPhysicsButton } from "./lib.js"
import { setUpProof } from "./proof_window.js";
import { escSettingsModal, settingsModal, setUpModals } from "./modals.js";

let lastClickedButton = null;
let lastClickedFormula = null;

const colours = ["red-elem", "orange-elem", "yellow-elem", "green-elem", "cyan-elem", "purple-elem"];
let expressionsAdded = 1;

// Whenever a button or entry or formula is clicked, change lastClickedElement
export function formulaElementFocus (event) {
    event.stopPropagation();
    lastClickedFormula = event.target;
}

// Defines behaviour when a key is pressed while a formula has focus
function formulaKeyPress(event, _bindDict) {
    if (_bindDict[event.key]) {
        _bindDict[event.key].click();
        event.preventDefault();
    } else if (getExpressionFromFormula(event.target) !== "goal") {
        checkThenMutateGivens(getExpressionFromFormula(event.target), false);
    }
}

// Defines behaviour when attempting to remove an element
function formulaBackspaceHandle(event) {
    if ((event.key == "Backspace" || event.key == "Delete") && !event.target.classList.contains("expanding-var-input")) {
        let id = getExpressionFromFormula(event.target);
        if (!event.target.classList.contains("expression-input")) {
            checkThenAttemptDelete(event);
        }
        if (id !== "goal") {
            checkThenMutateGivens(id, true);
        }
    } else if (event.key === " ") {
        event.preventDefault();
        return false;
    }
}

// Defines behaviour to update the state of a formula
function formulaSizeChange(event) {
    event.target.setAttribute("style", "width: " + (event.target.value.length + 1) + "ch");
}

// Gets the expression ("goal" or a number) from a given formulaElem
function getExpressionFromFormula(formulaElem) {
    let nearest = formulaElem.closest(".entry-expression");
    if (nearest.id) {
        return "goal";
    } else {
        return Array.from(nearest.parentNode.children).indexOf(nearest);
    }
}

// Mutate the given list if needed
function checkThenMutateGivens (topLevelExpressionIndex, wasBackspace) {
    let givenList = document.getElementById("given-holder").children;
    let topLevelExpression = givenList[topLevelExpressionIndex];
    let topLevelFormulaElement = topLevelExpression.querySelector(".formula-elem");
    let topLevelFormula = topLevelFormulaElement.assignedFormula;

    // If the expression is just an empty formula and an element exists below
    // Remove this element
    // Shuffle every other below element upwards
    if (topLevelFormula.constructor.name === formulas.BasicFormula.name &&
        topLevelFormulaElement.value === "" && wasBackspace) {
        let nextTopLevelExpr = givenList[topLevelExpressionIndex + 1];
        if (nextTopLevelExpr) {

            // Suffle elements upwards
            for (let i = topLevelExpressionIndex; i < givenList.length; i++) {
                givenList[i].children[0].innerText = i + ":";
            }

            // Remove from DOM
            topLevelExpression.remove();
        }

    } else {
        // If the expression is not empty and there is no expression below,
        // Add an expression below to the HTML
        if (document.getElementById("given-holder").lastElementChild === topLevelExpression && !wasBackspace) {
            // Create the new expression HTML
            let newExp = document.createElement("div");
            newExp.classList.add("expression", "entry-expression", colours[expressionsAdded % 6]);
            expressionsAdded++;

            let newLabel = document.createElement("p");
            newLabel.classList.add("expression-number", "italic");
            newLabel.textContent = (topLevelExpressionIndex + 2) + ":";
            newExp.appendChild(newLabel);

            let newExpanding = document.createElement("div");
            newExpanding.classList.add("expanding-expression-input");
            let newBasic = formulas.BasicFormula.newElem();
            newBasic.assignedFormula = new formulas.BasicFormula();
            newExpanding.appendChild(newBasic);
            newExp.appendChild(newExpanding);

            document.getElementById("given-holder").append(newExp);
            addAllExpressionListeners(newExp);
        }
    }
}

// Checks that everything is valid then attempts to insert a formula
function checkThenAttemptInsert(event) {
    event.stopPropagation();

    lastClickedButton = event.target;
    if (document.activeElement.classList.contains("formula-elem")) {
        attemptInsertFormula(event, document.activeElement);
        if (getExpressionFromFormula(document.activeElement) !== "goal") {
            checkThenMutateGivens(getExpressionFromFormula(document.activeElement), false);
        }
    } else {
        if (lastClickedFormula !== null) {
            attemptInsertFormula(event, lastClickedFormula);
            if (getExpressionFromFormula(document.activeElement) !== "goal") {
                checkThenMutateGivens(getExpressionFromFormula(document.activeElement), false);
            }
        }
    }
    lastClickedFormula = null;
}

// Checks that everything is valid then attempts to delete a formula
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

// Puts the buttons in the main window into the needed list
let buttonList = [];
for (const e of document.getElementById("entry-left-grid").children) {
    buttonList.push(e.children[0]);
    let buttonEvent = {
        "onClick": checkThenAttemptInsert,
        "onDragEnd": (event, below) => {
            lastClickedFormula = below;
            checkThenAttemptInsert(event);
        },
        "dragEndQuery" : ".formula-elem",
    }
    bindPhysicsButton(e.children[0], buttonEvent);
}
formulas.addFormulaData(buttonList);
let bindDict = bindKeysToButtonlist(buttonList);

document.getElementById("goal-holder").querySelector(".expression-input").assignedFormula = new formulas.BasicFormula();
document.getElementById("given-holder").querySelector(".expression-input").assignedFormula = new formulas.BasicFormula();

// Does the initial application of event handlers to formula elements
document.querySelectorAll(".expanding-expression-input").forEach(addAllExpressionListeners);

function addAllExpressionListeners (e) {
    e.addEventListener("click", formulaElementFocus);
    e.addEventListener("keydown", formulaBackspaceHandle);
    e.addEventListener("input", formulaSizeChange);
    e.addEventListener("keypress", (event) => {formulaKeyPress(event, bindDict)});
}

// Clears every selection if background clicked
document.addEventListener("click", () => {
    lastClickedButton = null;
    lastClickedFormula = null;
});

setUpModals();
// Settings menu when escape pressed
window.addEventListener("keydown", escSettingsModal);

document.getElementById("entry-confirm-button").onclick = function (event) {
    // Runs through every given and the goal
    // Translates each into their formula objects
    // Then if valid goes to the next screen
    let givenElems = document.getElementById("given-holder").children;
    let givenFormulas = [];

    for (let i = 0; i < givenElems.length; i++) {
        let elem = givenElems[i].children[1].children[0];
        let formula = readFormulaFromElements(elem);
        if (!formula) {
            // Ignore any empty blank formulas
            if (elem.assignedFormula.constructor.name === formulas.BasicFormula.name) {
                continue;
            }
            alert("Error detected in Formula " + (i + 1));
            return;
        } else {
            givenFormulas.push(formula);
        }
    }

    let goalElem = document.getElementById("goal-holder").children[1].children[0];
    let goalFormula = readFormulaFromElements(goalElem);
    if (!goalFormula) {
        alert("Error detected in goal");
        return;
    }

    loadMainWindow(givenFormulas, goalFormula);
}

function loadMainWindow(givenFormulas, goalFormula) {
    // Loads the main proof window, activates its script, gives it the given formulas
    function loadMainWindowHTML(givenFormulas, goalFormula, cover) {
        document.body.innerHTML = "";
        document.body.appendChild(cover);
        // TODO: get all the HTML from main window, plug it in here, set up
        // The boxes and the goal using givenFormulas and goalFormula
        let mainBody = null;
        fetch("./main_proof.html").then(function (response) {
            return response.text();
        }).then(function (html) {
            let parser = new DOMParser();
            mainBody = parser.parseFromString(html, "text/html");
            document.body.innerHTML = mainBody.body.innerHTML;
            document.body.appendChild(cover);

            let script = document.createElement("script");
            script.type = "module";
            script.src = "../scripts/proof_window.js";
            document.body.appendChild(script);
            setUpProof(givenFormulas, goalFormula);
        });
    }

    function animationEndListener (event) {
        loadMainWindowHTML(givenFormulas, goalFormula, event.target);
        event.target.removeEventListener("animationend", animationEndListener);
        event.target.style.animationName = "opaqueToClear";
        event.target.addEventListener("animationend", (event) => {event.target.remove()});
    }

    let cover = document.createElement("div");
    cover.classList.add("doc-cover");
    cover.addEventListener("animationend", animationEndListener);
    document.body.append(cover);
}
