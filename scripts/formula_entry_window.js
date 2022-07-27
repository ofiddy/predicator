import * as formulas from "./formulas.js";

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
    }
}

export function attemptDeleteFormula (targetFormula, formulaScope) {
    // Replaces the target formula with a blank formula
    // And removes the associated values from the formula index
    if (targetFormula.classList.contains("expression-input")) {
        return; // Do nothing if try to delete an entry
    }

    let newElem = formulas.BasicFormula.newElem();
    let newElemFormula = new formulas.BasicFormula();
    let oldIndex = targetFormula.dataset.formulaIndex;
    formulaScope[oldIndex] = newElemFormula;
    newElem.dataset.formulaIndex = oldIndex;

    // Remove all indices of children

    // Replace the old node with the new blank
    targetFormula.parentNode.replaceChild(newElem, targetFormula);
    newElem.focus();
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
