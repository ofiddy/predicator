import { bindKeysToButtonlist, attemptInsertFormula, attemptDeleteFormula } from "./formula_entry_window.js"
import * as formulas from "./formulas.js"

let lastClickedButton = null;
let lastClickedFormula = null;

let scopes = {
    "goal": [new formulas.BasicFormula()],
};

// Whenever a button or entry or formula is clicked, change lastClickedElement
export function formulaElementFocus (event) {
    event.stopPropagation();
    lastClickedFormula = event.target;
}

// Defines behaviour when a key is pressed while a formula has focus
function formulaButtonShortcut(event, _bindDict) {
    if (_bindDict[event.key]) {
        _bindDict[event.key].click();
        event.preventDefault();
    }
}

function formulaBackspaceHandle(event) {
    if (!event.target.classList.contains("expression-input")) {
        if (event.key == "Backspace" || event.key == "Delete") {
            checkThenAttemptDelete(event);
        }
    }
}

function formulaSizeChange(event) {
    event.target.setAttribute("style", "width: "+ (Math.max(event.target.value.length + 1, 3)) + "ch");
}

// Checks that everything is valid then attempts to insert a formula
function checkThenAttemptInsert(event) {
    event.stopPropagation();

    lastClickedButton = event.target;
    if (lastClickedFormula === null) {
        if (document.activeElement.classList.contains("formula-elem")) {
            attemptInsertFormula(event, document.activeElement, scopes["goal"]);
        }
    } else {
        attemptInsertFormula(event, lastClickedFormula, scopes["goal"]);
    }
    lastClickedFormula = null;
}

// Checks that everything is valid then attempts to delete a formula
function checkThenAttemptDelete(event) {
    event.stopPropagation();
    if (lastClickedFormula === null) {
        if (document.activeElement.classList.contains("formula-elem")) {
            attemptDeleteFormula(document.activeElement, scopes["goal"]);
        }
    } else {
        attemptDeleteFormula(lastClickedFormula, scopes["goal"]);
    }
    lastClickedFormula = null;
}

// Puts the buttons in the main window into the needed list
let buttonList = [];
for (const e of document.getElementById("entry-left-panel").children) {
    buttonList.push(e.children[0]);
    e.children[0].addEventListener("click", checkThenAttemptInsert);
}
formulas.addFormulaData(buttonList);
let bindDict = bindKeysToButtonlist(buttonList);

document.getElementById("goal-holder").querySelector(".expression-input").dataset.formulaIndex = 0;

// Does the initial application of event handlers to formula elements
document.querySelectorAll(".expanding-expression-input").forEach((e) => {
    e.addEventListener("click", formulaElementFocus);
    e.addEventListener("keydown", formulaBackspaceHandle);
    e.addEventListener("input", formulaSizeChange);
    e.addEventListener("keypress", (event) => {formulaButtonShortcut(event, bindDict)});
});

// Clears every selection if background clicked
document.addEventListener("click", () => {
    lastClickedButton = null;
    lastClickedFormula = null;
});
