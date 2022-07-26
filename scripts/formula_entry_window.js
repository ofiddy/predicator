import * as formulas from "./formulas.js";

// These are the generic functions for any formula entry window to use

// When a button pressed, inserts the relevant formula to the specified location
export function attemptInsertFormula (event, targetFormula) {
    event.stopPropagation();
    
    if (lastClickedFormula === null) {
        return false; // Cannot apply effect to nothing
    }

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
    
    let oldElem = lastClickedFormula;
    let oldFormula = lastClickedFormula.dataset.formula;
    let newElem;
    let newFormula;

    if (formulaToInsert instanceof formulas.QuantifierFormula) {
        oldElem.parentNode.removeChild(oldElem);
        newElem = document.createElement("span");
        let col = (formulaToInsert instanceof formulas.AllFormula ? "red-elem" : "green-elem");
        newElem.classList.add("formula-elem", col);
        
        // Add existing predicate as the right-hand-side
        let rhs = (oldFormula.isPredicate ? oldFormula : new formulas.BasicFormula());
        let lhs = (oldFormula instanceof formulas.VariableFormula ? oldFormula : new formulas.BasicVarFormula());
        
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
}
