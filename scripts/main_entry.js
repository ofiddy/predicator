import { bindKeysToButtonlist, attemptInsertFormula, attemptDeleteFormula } from "./formula_entry_window.js"
import * as formulas from "./formulas.js"
import { bindPhysicsButton } from "./lib.js"

let lastClickedButton = null;
let lastClickedFormula = null;

let goalScope = [new formulas.BasicFormula()];
let givenScopes = [[new formulas.BasicFormula()]];

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
    let id = getExpressionFromFormula(event.target);
    if (event.key == "Backspace" || event.key == "Delete") {
        if (!event.target.classList.contains("expression-input")) {
            checkThenAttemptDelete(event);
        }
        if (id !== "goal") {
            checkThenMutateGivens(id, true);
        }
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

// Gets the scope a (element corresponding to a) formula resides in
function getScope(formulaElem) {
    let id = getExpressionFromFormula(formulaElem);
    return (id === "goal" ? goalScope : givenScopes[id]);
}

// Mutate the given list if needed
function checkThenMutateGivens (topLevelExpressionIndex, wasBackspace) {
    let givenList = document.getElementById("given-holder").children;
    let topLevelExpression = givenList[topLevelExpressionIndex];
    let scope = givenScopes[topLevelExpressionIndex];
    let topLevelFormulaElement = topLevelExpression.querySelector(".formula-elem");
    let topLevelFormula = scope[topLevelFormulaElement.dataset.formulaIndex];

    // If the expression is just an empty formula and an element exists below
    // Remove this element
    // Shuffle every other below element upwards
    // Remove from the scope
    if (topLevelFormula.constructor.name === formulas.BasicFormula.name &&
        topLevelFormulaElement.value === "" && wasBackspace) {
        let nextTopLevelExpr = givenList[topLevelExpressionIndex + 1];
        if (nextTopLevelExpr) {
            // Remove from the scope
            givenScopes.splice(topLevelExpressionIndex, 1);

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
        // Then add a new scope
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
            newBasic.dataset.formulaIndex = 0;
            newExpanding.appendChild(newBasic);
            newExp.appendChild(newExpanding);

            document.getElementById("given-holder").append(newExp);
            addAllExpressionListeners(newExp);

            givenScopes.push([new formulas.BasicFormula()]);
        }
    }
}

// Checks that everything is valid then attempts to insert a formula
function checkThenAttemptInsert(event) {
    event.stopPropagation();

    lastClickedButton = event.target;
    if (lastClickedFormula === null) {
        if (document.activeElement.classList.contains("formula-elem")) {
            attemptInsertFormula(event, document.activeElement, getScope(document.activeElement));
            if (getExpressionFromFormula(document.activeElement) !== "goal") {
                checkThenMutateGivens(getExpressionFromFormula(document.activeElement), false);
            }
        }
    } else {
        attemptInsertFormula(event, lastClickedFormula, getScope(lastClickedFormula));
        if (getExpressionFromFormula(document.activeElement) !== "goal") {
            checkThenMutateGivens(getExpressionFromFormula(document.activeElement), false);
        }
    }
    lastClickedFormula = null;
}

// Checks that everything is valid then attempts to delete a formula
function checkThenAttemptDelete(event) {
    event.stopPropagation();
    if (lastClickedFormula === null) {
        if (document.activeElement.classList.contains("formula-elem")) {
            attemptDeleteFormula(document.activeElement, getScope(document.activeElement));
        }
    } else {
        attemptDeleteFormula(lastClickedFormula, getScope(lastClickedFormula));
    }
    lastClickedFormula = null;
}

// Puts the buttons in the main window into the needed list
let buttonList = [];
for (const e of document.getElementById("entry-left-grid").children) {
    buttonList.push(e.children[0]);
    bindPhysicsButton(e.children[0], checkThenAttemptInsert, 
        (event, below) => {
            lastClickedFormula = below;
            checkThenAttemptInsert(event);
    }, (".formula-elem"));
}
formulas.addFormulaData(buttonList);
let bindDict = bindKeysToButtonlist(buttonList);

document.getElementById("goal-holder").querySelector(".expression-input").dataset.formulaIndex = 0;
document.getElementById("given-holder").querySelector(".expression-input").dataset.formulaIndex = 0;

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
