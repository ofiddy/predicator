import { bindKeysToButtonlist } from "./formula_entry_window.js"

lastClickedButton = null;
lastClickedFormula = null;

// Whenever a button or entry or formula is clicked, change lastClickedElement
export function formulaElementFocus (event) {
    event.stopPropagation();
    lastClickedFormula = event.target;
}

// Defines behaviour when a key is pressed while a formula has focus
function formulaButtonShortcut(event) {
    if (bindDict[event.key]) {
        bindDict[event.key].click();
    }
}

// Does the initial application of event handlers to formula elements
document.querySelectorAll(".formula-elem").forEach((e) => {
    e.addEventListener("click", formulaElementFocus);
    e.addEventListener("keypress", formulaButtonShortcut);
});

// Clears every selection if background clicked
document.addEventListener("click", () => {
    lastClickedButton = null;
    lastClickedFormula = null;
});