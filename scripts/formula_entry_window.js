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
    let newElem;
    let newFormula;

    if (formulaToInsert instanceof formulas.QuantifierFormula) {
        oldElem.parentNode.removeChild(oldElem);

        newElem = (formulaToInsert instanceof formulas.AllFormula ? newAllElement() : newExistsElement());
        
        // Add an existing predicate as the right-hand-side
        let rhs = (oldFormula.isPredicate ? oldFormula : new formulas.BasicFormula());
        let lhs = (oldFormula instanceof formulas.VariableFormula ? oldFormula : new formulas.BasicVarFormula());
        
    }
}

// These functions generate elements corresponding to each formula
// and do NO other work behind the scenes
function newBlankElement () {
    let elem = document.createElement("input");
    elem.type = "text";
    elem.classList.add("expression-input", "formula-elem", "cyan-elem");
    return elem;
}

function newBlankVarElement() {
    let elem = document.createElement("input");
    elem.type = "text";
    elem.classList.add("expression-input", "formula-elem", "var-input", "purple-elem");
    return elem;
}

function newOrElement () {
    let elem = document.createElement("span");
    elem.classList.add("formula-elem", "cyan-elem");
    elem.innerText = "⋁";
    return elem;
}

function newAndElement () {
    let elem = document.createElement("span");
    elem.classList.add("formula-elem", "yellow-elem");
    elem.innerText = "⋀";
    return elem;
}

function newNotElement () {
    let elem = document.createElement("span");
    elem.classList.add("formula-elem", "red-elem");
    elem.innerText = "¬";
    return elem;
}

function newImpliesElement () {
    let elem = document.createElement("span");
    elem.classList.add("formula-elem", "orange-elem");
    elem.innerText = "→";
    return elem;
}

function newIffElement () {
    let elem = document.createElement("span");
    elem.classList.add("formula-elem", "purple-elem");
    elem.innerText = "↔";
    return elem;
}

function newEqualsElement () {
    let elem = document.createElement("span");
    elem.classList.add("formula-elem", "greyblue-elem");
    elem.innerText = "=";
    return elem;
}

function newNotEqualsElement () {
    let elem = document.createElement("span");
    elem.classList.add("formula-elem", "white-elem");
    elem.innerText = "≠";
    return elem;
}

function newBotElement () {
    let elem = document.createElement("span");
    elem.classList.add("formula-elem", "cyan-elem");
    elem.innerText = "⊥";
    return elem;
}

function newTopElement () {
    let elem = document.createElement("span");
    elem.classList.add("formula-elem", "yellow-elem");
    elem.innerText = "⊤";
    return elem;
}

function newAllElement () {
    let elem = document.createElement("span");
    elem.classList.add("formula-elem", "red-elem");
    elem.innerText = "∀";
    return elem;
}

function newExistsElement () {
    let elem = document.createElement("span");
    elem.classList.add("formula-elem", "green-elem");
    elem.innerText = "∃";
    return elem;
}

function newPredicateElement () {
    let elem = document.createElement("span");
    elem.classList.add("formula-elem", "orange-elem");
    elem.innerText = "(";
    return elem;
}

function newFunctionElement () {
    let elem = document.createElement("span");
    elem.classList.add("formula-elem", "purple-elem");
    elem.innerText = "(";
    return elem;
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
