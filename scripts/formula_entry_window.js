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

    // All- and Exists- formulas
    if (formulaToInsert.prototype instanceof formulas.QuantifierFormula && oldFormula.isPredicate) {
        let newLhs = formulas.BasicVarFormula.newElem();
        let newLhsFormula = new formulas.BasicVarFormula();
        assignToScope(newLhs, newLhsFormula, formulaScope);

        let newRhs = oldElem;
        let newRhsFormula = oldFormula;

        newElem = formulaToInsert.newElem();
        console.log(newElem);
        let symbol = newElem.innerText;
        newElem.innerText = "";
        insertDest.replaceChild(newElem, oldElem);
        newElem.append(symbol + " ");
        newElem.append(newLhs);
        newElem.append(" [");
        newElem.append(newRhs);
        newElem.append("]")

        newFormula = new formulaToInsert(newLhsFormula, newRhsFormula);
        formulaScope[oldIndex] = newFormula;
        newElem.dataset.formulaIndex = oldIndex;
        newElem.focus();
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
