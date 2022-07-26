import * as formulas from "./formulas.js";

// These are the generic functions for any formula entry window to use

// When a button pressed, inserts the relevant formula to the specified location
export function attemptInsertFormula (event, targetFormula) {
    let formulaToInsert = event.target.dataset.formulaClass;
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
    let oldFormula = targetFormula.dataset.formula;
    let insertDest = oldElem.parentNode;
    let newElem;
    let newFormula;

    if (new formulaToInsert() instanceof formulas.QuantifierFormula) {
        insertDest.removeChild(oldElem);

        newElem = (new formulaToInsert() instanceof formulas.AllFormula ? newAllElement() : newExistsElement());
        let symbol = newElem.innerText;
        newElem.innerText = "";
        
        // Add an existing predicate as the right-hand-side
        if (oldFormula.isPredicate) {
            // Create new elems, formula, then sync the two layers
            let newLhs = newBlankVarElement();
            let newLhsFormula = new formulas.BasicVarFormula();
            newLhs.dataset.formula = newLhsFormula;

            newFormula = new formulaToInsert(newLhsFormula, oldFormula);

            newElem.appendChild(newLhs);
            newElem.appendChild(symbol);
            newElem.appendChild(oldFormula);
        }
    }

    newElem.dataset.formula = newFormula
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
}
