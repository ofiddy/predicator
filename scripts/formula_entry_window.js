import * as formulas from "./formulas.js";
import { insertAfter } from "./lib.js";

// These are the generic functions for any formula entry window to use

// When a button pressed, inserts the relevant formula to the specified location
export function attemptInsertFormula (event, targetFormula, formulaScope) {
    // formulaScope is the list of formula objects for the html to refer to
    let formulaToInsert = formulas.formulaList[event.target.dataset.formulaClassIndex];
    if (formulaToInsert === null) {
        return false; // "Adding" an atom basically does nothing
    }

    // Get the existing content
    // Remove it from its parent
    // Create the new content
    // Put the old as a child as appropriate
    // Put a new blank as a child where appropriate
    // Put the new content where the old content was
    
    let oldElem = targetFormula;
    let oldIndex = targetFormula.dataset.formulaIndex
    let oldFormula = formulaScope[oldIndex];
    let insertDest = oldElem.parentNode;
    let newElem;
    let newFormula;

    function assignToScope (elem, formula, scope) {
        elem.dataset.formulaIndex = scope.length;
        scope.push(formula);
    }
    let testForm = new formulaToInsert();

    if (testForm instanceof formulas.QuantifierFormula && oldFormula.isPredicate) {
        // All- and Exists- formulas
        let newLhs = formulas.BasicVarFormula.newElem();
        let newLhsFormula = new formulas.BasicVarFormula();
        assignToScope(newLhs, newLhsFormula, formulaScope);

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
        assignToScope(newElem, newFormula, formulaScope);
        newElem.focus();

    } else if ((testForm instanceof formulas.BinaryFormula ||
        testForm instanceof formulas.EqualsFormula ||
        testForm instanceof formulas.NotEqualsFormula) &&
        oldFormula.isPredicate) {
        // Binary Formulas and Equals and NEquals
        let newLhs, newLhsFormula, newRhs, newRhsFormula;
        if (formulaToInsert.prototype instanceof formulas.BinaryFormula) {
            newRhs = formulas.BasicFormula.newElem();
            newRhsFormula = new formulas.BasicFormula();
            assignToScope(newRhs, newRhsFormula, formulaScope);

            newLhs = oldElem;
            newLhsFormula = oldFormula;
        } else {
            // If adding Equals/NEquals, must create variable entries
            newLhs = formulas.BasicVarFormula.newElem();
            newLhsFormula = new formulas.BasicVarFormula();
            assignToScope(newLhs, newLhsFormula, formulaScope);
            if (oldElem.classList.contains("expression-input")) {
                newLhs.value = oldElem.value;
            }
            newRhs = formulas.BasicVarFormula.newElem();
            newRhsFormula = new formulas.BasicVarFormula();
            assignToScope(newRhs, newRhsFormula, formulaScope);
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
        assignToScope(newElem, newFormula, formulaScope);
        newElem.focus();

    } else if ((testForm instanceof formulas.TopFormula || 
        testForm instanceof formulas.BottomFormula) &&
        oldFormula.isPredicate) {
        // Bottom and Top Formulas
        let newElem = formulaToInsert.newElem();
        let newElemFormula = new formulaToInsert();
        assignToScope(newElem, newElemFormula, formulaScope);
        insertDest.replaceChild(newElem, oldElem);
        newElem.focus();

    } else if (testForm instanceof formulas.NotFormula && oldFormula.isPredicate) {
        // Adding a Negation Formula
        let newElem = formulaToInsert.newElem();
        let newElemFormula = new formulaToInsert(oldFormula);
        assignToScope(newElem, newElemFormula, formulaScope);
        insertDest.replaceChild(newElem, oldElem);
        
        newElem.append("(");
        newElem.append(oldElem);
        newElem.append(")");

        newElem.focus();

    } else if ((testForm instanceof formulas.PredicateFormula && oldFormula.isPredicate)
     || (testForm instanceof formulas.FunctionFormula && !oldFormula.isPredicate)) {
        // Predicates and functions
        let nameElem = formulas.BasicVarFormula.newElem();
        let nameElemFormula = new formulas.BasicVarFormula();
        assignToScope(nameElem, nameElemFormula, formulaScope);

        if (oldElem.classList.contains("expression-input")) {
            nameElem.value = oldElem.value;
        }
        
        let varsElem = formulas.ExpandingVarFormula.newElem();
        let varsElemFormula = new formulas.ExpandingVarFormula();
        varsElem.classList.add("first-var");
        // Do not assign to scope: tracked via the parent

        let vars = [varsElemFormula];
        let newElem = formulaToInsert.newElem();
        let newElemFormula = new formulaToInsert("", vars);
        assignToScope(newElem, newElemFormula, formulaScope);
        insertDest.replaceChild(newElem, oldElem);

        newElem.append(nameElem);
        newElem.append("(");
        newElem.append(varsElem);
        newElem.append(")");

        function expandingVarSplit(event) {
            if (event.target.classList.contains("expanding-var-input") &&
            event.key === ",") {
                event.preventDefault();
                attemptAddVariable(event.target, formulaScope);
            }
        }

        function expandingVarBackspace(event) {
            console.log(event.target);
            if (event.target.classList.contains("expanding-var-input") &&
            event.key === "Backspace") {
                if (event.target.value.length === 0 && !event.target.classList.contains("first-var")) {
                    attemptDeleteVariable(event.target, formulaScope);
                }
            }
        }

        newElem.addEventListener("keypress", expandingVarSplit);
        newElem.addEventListener("keydown", expandingVarBackspace);

        newElem.focus();
    }
}

export function attemptDeleteFormula (targetFormula, formulaScope) {
    // Replaces the target formula with a blank formula
    // And removes the associated values from the formula index
    if (targetFormula.classList.contains("expression-input")) {
        return; // Do nothing if try to delete an entry
    }

    let newElem, newElemFormula;
    let oldIndex = targetFormula.dataset.formulaIndex;
    if (formulaScope[oldIndex].isPredicate) {
        newElem = formulas.BasicFormula.newElem();
        newElemFormula = new formulas.BasicFormula();
    } else {
        newElem = formulas.BasicVarFormula.newElem();
        newElemFormula = new formulas.BasicVarFormula;
    }
    
    formulaScope[oldIndex] = newElemFormula;
    newElem.dataset.formulaIndex = oldIndex;

    // Remove all indices of children

    // Replace the old node with the new blank
    targetFormula.parentNode.replaceChild(newElem, targetFormula);
    newElem.focus();
}

function attemptAddVariable (targetElem, formulaScope) {
    // When "," pressed, split the focused ".expanding-var-input" into two
    // PRE: targetElem is an ".expanding-var-input"
    // For Predicates and Functions
    let parentFormula = formulaScope[targetElem.parentNode.dataset.formulaIndex];
    let parentElem = targetElem.parentNode;
    let newElem = formulas.ExpandingVarFormula.newElem();
    let newVar = new formulas.ExpandingVarFormula();

    // Find the index of the selected targetFormula within the variables of the parent
    let varIndex = Array.from(parentElem.children).indexOf(targetElem);

    // Add a new expanding variable formula at that location
    parentFormula.addVarAt(varIndex, newVar);
    insertAfter(newElem, targetElem);
    insertAfter(document.createTextNode(", "), targetElem);
    newElem.focus();
}

function attemptDeleteVariable (targetElem, formulaScope) {
    // When "<-" pressed, remove target Elem and the preceeding comma
    // PRE: targetElem is an ".expanding-var-input" and not the first
    // For Predicates and Functions
    let parentFormula = formulaScope[targetElem.parentNode.dataset.formulaIndex];
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
