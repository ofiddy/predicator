import { bindKeysToButtonlist, attemptInsertFormula } from "./formula_entry_window.js"
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
    console.log(_bindDict);
    console.log(event.key);
    if (_bindDict[event.key]) {
        _bindDict[event.key].click();
    }
}

function checkThenAttemptInsert (event) {
    // Checks that everything is valid then attempts to insert a formula
    event.stopPropagation();

    lastClickedButton = event.target;
    if (lastClickedFormula === null) {
        return;
    } else {
        attemptInsertFormula(event, lastClickedFormula, scopes["goal"]);
    }
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
    e.addEventListener("keypress", (event) => {formulaButtonShortcut(event, bindDict)});
});

// Clears every selection if background clicked
document.addEventListener("click", () => {
    lastClickedButton = null;
    lastClickedFormula = null;
});
