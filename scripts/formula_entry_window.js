import * as formulas from "./formulas.js";
import { insertAfter } from "./lib.js";

// These are the generic functions for any formula entry window to use

// When a button pressed, inserts the relevant formula to the specified location
export function attemptInsertFormula (event, targetFormula) {
    let formulaToInsert = formulas.formulaList[event.target.dataset.formulaClassIndex];
    if (formulaToInsert === null || targetFormula.classList.contains("only-text")) {
        return false; // "Adding" an atom basically does nothing
    }
    console.log("Attempting insert");

    // Get the existing content
    // Remove it from its parent
    // Create the new content
    // Put the old as a child as appropriate
    // Put a new blank as a child where appropriate
    // Put the new content where the old content was
    
    let oldElem = targetFormula;
    let oldFormula = oldElem.assignedFormula;
    let insertDest = oldElem.parentNode;
    let newElem;
    let newFormula;
    let testForm = new formulaToInsert();

    if (testForm instanceof formulas.QuantifierFormula && oldFormula.isPredicate) {
        // All- and Exists- formulas
        let newLhs = formulas.BasicVarFormula.newElem();
        newLhs.classList.add("only-text");
        let newLhsFormula = new formulas.BasicVarFormula();
        newLhs.assignedFormula = newLhsFormula;

        let newRhs = oldElem;
        let newRhsFormula = oldFormula;

        newElem = formulaToInsert.newElem();
        let symbol = newElem.innerText;
        newElem.innerText = "";
        insertDest.replaceChild(newElem, oldElem);
        newElem.append(symbol + " ");
        newElem.append(newLhs);
        newElem.append(" [");
        newElem.append(newRhs);
        newElem.append("]");

        newFormula = new formulaToInsert(newLhsFormula, newRhsFormula);
        newElem.assignedFormula = newFormula;
        newElem.children[0].focus();

    } else if ((testForm instanceof formulas.BinaryFormula ||
        testForm instanceof formulas.EqualsFormula ||
        testForm instanceof formulas.NotEqualsFormula) &&
        oldFormula.isPredicate) {
        // Binary Formulas and Equals and NEquals
        let newLhs, newLhsFormula, newRhs, newRhsFormula;
        if (formulaToInsert.prototype instanceof formulas.BinaryFormula) {
            newRhs = formulas.BasicFormula.newElem();
            newRhsFormula = new formulas.BasicFormula();
            newRhs.assignedFormula = newRhsFormula;

            newLhs = oldElem;
            newLhsFormula = oldFormula;
        } else {
            // If adding Equals/NEquals, must create variable entries
            newLhs = formulas.BasicVarFormula.newElem();
            newLhsFormula = new formulas.BasicVarFormula();
            newLhs.assignedFormula = newLhsFormula;
            if (oldElem.classList.contains("expression-input")) {
                newLhs.value = oldElem.value;
            }
            newRhs = formulas.BasicVarFormula.newElem();
            newRhsFormula = new formulas.BasicVarFormula();
            newRhs.assignedFormula = newRhsFormula;
        }

        newElem = formulaToInsert.newElem();
        let symbol = newElem.innerText;
        newElem.innerText = "";
        insertDest.replaceChild(newElem, oldElem);
        newElem.append(" (");
        newElem.append(newLhs);
        newElem.append(") " + symbol + " (");
        newElem.append(newRhs);
        newElem.append(") ");

        newFormula = new formulaToInsert(newLhsFormula, newRhsFormula);
        newElem.assignedFormula = newFormula;
        newElem.children[0].focus();

    } else if ((testForm instanceof formulas.TopFormula || 
        testForm instanceof formulas.BottomFormula) &&
        oldFormula.isPredicate) {
        // Bottom and Top Formulas
        let newElem = formulaToInsert.newElem();
        let newElemFormula = new formulaToInsert();
        newElem.assignedFormula = newElemFormula;
        insertDest.replaceChild(newElem, oldElem);
        newElem.focus();

    } else if (testForm instanceof formulas.NotFormula && oldFormula.isPredicate) {
        // Adding a Negation Formula
        let newElem = formulaToInsert.newElem();
        let newElemFormula = new formulaToInsert(oldFormula);
        newElem.assignedFormula = newElemFormula;
        insertDest.replaceChild(newElem, oldElem);
        
        newElem.append("(");
        newElem.append(oldElem);
        newElem.append(")");

        newElem.children[0].focus();

    } else if ((testForm instanceof formulas.PredicateFormula && oldFormula.isPredicate)
     || (testForm instanceof formulas.FunctionFormula && !oldFormula.isPredicate)) {
        // Predicates and functions
        let nameElem = formulas.BasicVarFormula.newElem();
        nameElem.classList.add("only-text");
        let nameElemFormula = new formulas.BasicVarFormula();
        nameElem.assignedFormula = nameElemFormula;

        if (oldElem.classList.contains("expression-input")) {
            nameElem.value = oldElem.value;
        }
        
        let varsElem = formulas.ExpandingVarFormula.newElem();
        let varsElemFormula = new formulas.ExpandingVarFormula();
        varsElem.classList.add("first-var");

        let vars = [varsElemFormula];
        let newElem = formulaToInsert.newElem();
        let newElemFormula = new formulaToInsert("", vars);
        newElem.assignedFormula = newElemFormula;

        insertDest.replaceChild(newElem, oldElem);

        newElem.append(nameElem);
        newElem.append("(");
        newElem.append(varsElem);
        newElem.append(")");

        function expandingVarEntry(event) {
            if (event.target.classList.contains("expanding-var-input")) {
                if (event.key === ",") {
                    event.preventDefault();
                    event.stopPropagation();
                    attemptAddVariable(event.target);
                } else if (event.key === ")") {
                    event.preventDefault();
                    event.stopPropagation();
                    attemptAddFunction(event.target);
                }
            }
        }

        function expandingVarBackspace(event) {
            if (event.target.classList.contains("expanding-var-input") &&
            event.key === "Backspace") {
                if (event.target.value.length === 0 && !event.target.classList.contains("first-var")) {
                    attemptDeleteVariable(event.target);
                }
            }
        }

        newElem.addEventListener("keypress", expandingVarEntry);
        newElem.addEventListener("keydown", expandingVarBackspace);

        newElem.focus();

    } else { // Do nothing - either atom button or some kinda error
        oldElem.focus();
    }
}

export function attemptDeleteFormula (targetFormula) {
    // Replaces the target formula with a blank formula
    // And removes the associated values from the formula index
    if (targetFormula.classList.contains("expression-input")) {
        return; // Do nothing if try to delete an entry
    }

    let newElem, newElemFormula;
    if (targetFormula.assignedFormula.isPredicate) {
        newElem = formulas.BasicFormula.newElem();
        newElemFormula = new formulas.BasicFormula();
    } else {
        let parentElem = targetFormula.parentElement;
        if (!(parentElem.assignedFormula instanceof formulas.EqualsFormula)) {
            // Inside an expanding variable input
            newElem = formulas.ExpandingVarFormula.newElem();
            newElemFormula = new formulas.ExpandingVarFormula;
        } else {
            // Inside a regular input
            newElem = formulas.BasicVarFormula.newElem();
            newElemFormula = new formulas.BasicVarFormula;
        }
    }
    
    newElem.assignedFormula = newElemFormula;

    // Replace the old node with the new blank
    targetFormula.parentNode.replaceChild(newElem, targetFormula);
    newElem.focus();
}

function attemptAddVariable (targetElem) {
    // When "," pressed, split the focused ".expanding-var-input" into two
    // PRE: targetElem is an ".expanding-var-input"
    // For Predicates and Functions
    let parentFormula = targetElem.parentNode.assignedFormula;
    let parentElem = targetElem.parentNode;
    let newElem = formulas.ExpandingVarFormula.newElem();
    let newVar = new formulas.ExpandingVarFormula();
    newElem.assignedFormula = newVar;

    // Find the index of the selected targetFormula within the variables of the parent
    let varIndex = Array.from(parentElem.children).indexOf(targetElem);

    // Add a new expanding variable formula at that location
    parentFormula.addVarAt(varIndex, newVar);
    insertAfter(newElem, targetElem);
    insertAfter(document.createTextNode(", "), targetElem);
    newElem.focus();
}

function attemptAddFunction (targetElem) {
    // Adds a function instead of an expanding variable formula inside a predicate or function
    // PRE: targetElem is an ".expanding-var-input"
    let parentElem = targetElem.parentNode;
    let newElem = formulas.FunctionFormula.newElem();

    let nameElem = formulas.BasicVarFormula.newElem();
    nameElem.classList.add("only-text");
    let nameElemFormula = new formulas.BasicVarFormula();
    nameElem.assignedFormula = nameElemFormula;

    nameElem.value = targetElem.value;

    let varsElem = formulas.ExpandingVarFormula.newElem();
    let varsElemFormula = new formulas.ExpandingVarFormula();
    varsElem.assignedFormula = varsElemFormula;
    varsElem.classList.add("first-var");

    let vars = [varsElemFormula];
    let newElemFormula = new formulas.FunctionFormula("", vars);
    newElem.assignedFormula = newElemFormula;

    parentElem.replaceChild(newElem, targetElem);
    newElem.append(nameElem);
    newElem.append("(");
    newElem.append(varsElem);
    newElem.append(")");

    newElem.focus();
}

function attemptDeleteVariable (targetElem) {
    // When "<-" pressed, remove target Elem and the preceeding comma
    // PRE: targetElem is an ".expanding-var-input" and not the first
    // For Predicates and Functions
    let parentFormula = targetElem.parentNode.assignedFormula;
    let parentElem = targetElem.parentNode;

    // Find the index of the selected targetFormula within the variables of the parent
    let varIndex = Array.from(parentElem.children).indexOf(targetElem);
    let nodeIndex = Array.from(parentElem.childNodes).indexOf(targetElem);

    // Remove from the formula then the DOM
    parentFormula.removeVarAt(varIndex);
    parentElem.childNodes[nodeIndex - 1].remove();
    parentElem.childNodes[nodeIndex - 1].remove();

    // If there is a formula after, focus that, otherwise focus the previous
    if (parentElem.children[varIndex]) {
        parentElem.children[varIndex].focus();
    } else {
        parentElem.children[varIndex - 1].focus();
    }
}

// Maps each key to the effects of a button
export function bindKeysToButtonlist (buttonList) {
    let bindDict = {
        "+": buttonList[0],
        "&": buttonList[1],
        "~": buttonList[2],
        ">": buttonList[4],
        "<": buttonList[5],
        "=": buttonList[6],
        "#": buttonList[7],
        "!": buttonList[8],
        "?": buttonList[9],
        "@": buttonList[10],
        "$": buttonList[11],
        "(": buttonList[12],
        ")": buttonList[13],
    }
    return bindDict;
}

export function readFormulaFromElements (topLevelElement) {
    return topLevelElement.assignedFormula.readFromElements(topLevelElement);
}