import {setUnion, boundSetHas} from "./lib.js";

export class BasicFormula {
    // A blank formula, represents an empty for formula input
    // Main purpose is to be inherited

    constructor () {
        this._isPredicate = true;
        this._priority = 20;
    }

    get isPredicate() {
        return this._isPredicate;
    }

    show() { // Returns the string representation
        return "";
    }

    equals(other) { // True if other is equal to this formula by contents
        return false; // Two blank formulas are never equal
    }

    replaceVar(oldVar, newVar, bound) { // Replaces all instances of oldVar with newVar
        return this;
    }

    getVar() {
        return new Set();
    }

    static newElem () {
        let elem = document.createElement("input");
        elem.type = "text";
        elem.setAttribute("tabindex", "0");
        elem.classList.add("expression-input", "formula-elem");
        return elem;
    }
}

export class BasicVarFormula extends BasicFormula {
    // A placeholder for non-predicate entry
    constructor () {
        super();
        this._isPredicate = false;
    }

    static newElem () {
        let elem = document.createElement("input");
        elem.type = "text";
        elem.setAttribute("tabindex", "0");
        elem.classList.add("expression-input", "formula-elem", "var-input", "purple-elem");
        return elem;
    }
}

export class ExpandingVarFormula extends BasicVarFormula {
    constructor() {
        super();
        this._isPredicate = false;
    }
    static newElem () {
        let elem = document.createElement("input");
        elem.type = "text";
        elem.setAttribute("tabindex", "0");
        elem.classList.add("expression-input", "formula-elem", "var-input", "cyan-elem", "expanding-var-input");
        return elem;
    }
}

export class VariableFormula extends BasicFormula {
    // Represents a single variable (e.g. in an exists formula)

    constructor (name) {
        super();
        this._name = name;
        this._isPredicate = false;
    }

    get name() {
        return this._name;
    }

    show() {
        return this._name;
    }

    equals(other) {
        return (other instanceof VariableFormula && other._name === this._name);
    }

    replaceVar(oldVar, newVar, bound) {
        if (this.equals(oldVar) && !(boundSetHas(bound, oldVar))) {
            return newVar;
        } else {
            return this;
        }
        
    }

    getVar() {
        return new Set([this]);
    }

    static newElem () {
        let elem = document.createElement("span");
        elem.classList.add("formula-elem", "yellow-elem");
        elem.setAttribute("tabindex", "0");
        return elem;
    }
}

export class FunctionFormula extends BasicFormula {
    // Represents a function with any number of variables

    constructor (name, variables) {
        // Variables is a list of this functions variables *IN ORDER*
        // As VariableFormula objects
        super();
        this._name = name;
        this._isPredicate = false;
        this._variables = variables;
    }

    addVarAt(index, variable) {
        this._variables.splice(index, 0, variable);
    }

    removeVarAt(index) {
        this._variables.splice(index, 1);
    }

    getVarAt(index) {
        return this._variables[index];
    }

    show() {
        let variableList = "";
        for (const v of this._variables) {
            variableList = variableList + v.show() + ", ";
        }
        variableList = variableList.substring(0, variableList.length - 2);
        return (this._name + "(" + variableList + ")");
    }

    equals(other) {
        if (other instanceof FunctionFormula && other._name === this._name && other._variables.length === this._variables.length) {
            for (let i = 0; i < this._variables.length; i++) {
                if (!this._variables[i].equals(other._variables[i])) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }

    replaceVar(oldVar, newVar, bound) {
        let newVars = [];
        for (let i = 0; i < this._variables.length; i++) {
            newVars[i] = this._variables[i].replaceVar(oldVar, newVar, bound);
        }
        return new FunctionFormula(this._name, newVars);
    }

    getVar() {
        let newVars = new Set();
        for (const v of this._variables) {
            newVars = setUnion(newVars, v.getVar());
        }
        return newVars;
    }

    static newElem () {
        let elem = document.createElement("span");
        elem.classList.add("formula-elem", "purple-elem");
        elem.innerText = "";
        elem.setAttribute("tabindex", "0");
        return elem;
    }
}

export class AtomFormula extends BasicFormula {
    // Represents a single atom (e.g. P, Q, Gordon)

    constructor (name) {
        super();
        this._name = name;
    }

    show() {
        return this._name;
    }

    equals(other) {
        return (other instanceof AtomFormula && other._name === this._name);
    }
}

export class BottomFormula extends BasicFormula {
    // Represents a contradiction

    show() {
        return "⊥";
    }

    equals(other) {
        return (other instanceof BottomFormula);
    }

    static newElem () {
        let elem = document.createElement("span");
        elem.classList.add("formula-elem", "cyan-elem");
        elem.innerText = "⊥";
        elem.setAttribute("tabindex", "0");
        return elem;
    }
}

export class TopFormula extends BasicFormula {
    // Represents a tautology

    show() {
        return "⊤";
    }

    equals(other) {
        return (other instanceof TopFormula);
    }

    static newElem () {
        let elem = document.createElement("span");
        elem.classList.add("formula-elem", "yellow-elem");
        elem.innerText = "⊤";
        elem.setAttribute("tabindex", "0");
        return elem;
    }
}

export class PredicateFormula extends BasicFormula {
    // Represents a first-order predicate
    
    constructor (name, variables) {
        // variables is a list of VariableFormula-s
        super();
        this._variables = variables;
        this._name = name;
    }

    addVarAt(index, variable) {
        this._variables.splice(index, 0, variable);
    }

    removeVarAt(index) {
        this._variables.splice(index, 1);
    }

    getVarAt(index) {
        return this._variables[index];
    }

    show() {
        let variableList = "";
        for (const v of this._variables) {
            variableList = variableList + v.show() + ", ";
        }
        variableList = variableList.substring(0, variableList.length - 2);
        return (this._name + "(" + variableList + ")");
    }

    equals(other) {
        if (other instanceof PredicateFormula && other._name === this._name && other._variables.length === this._variables.length) {
            for (let i = 0; i < this._variables.length; i++) {
                if (!this._variables[i].equals(other._variables[i])) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }

    replaceVar(oldVar, newVar, bound) {
        let newVars = [];
        for (let i = 0; i < this._variables.length; i++) {
            newVars[i] = this._variables[i].replaceVar(oldVar, newVar, bound);
        }
        return new PredicateFormula(this._name, newVars);
    }

    getVar() {
        let newVars = new Set();
        for (const v of this._variables) {
            newVars = setUnion(newVars, v.getVar());
        }
        return newVars;
    }

    static newElem () {
        let elem = document.createElement("span");
        elem.classList.add("formula-elem", "orange-elem");
        elem.innerText = "";
        elem.setAttribute("tabindex", "0");
        return elem;
    }
}

export class NotFormula extends BasicFormula {
    // The only unary formula
    constructor(subFormula) {
        super();
        this._contents = subFormula;
        this._priority = 10;
    }

    show() {
        return "¬" + subFormula.show();
    }

    equals(other) {
        return (other instanceof NotFormula && this._contents.equals(other._contents));
    }

    replaceVar(oldVar, newVar, bound) {
        return this._contents.replaceVar(oldVar, newVar, bound);
    }

    getVar() {
        return this._contents.getVar();
    }

    static newElem () {
        let elem = document.createElement("span");
        elem.classList.add("formula-elem", "red-elem");
        elem.innerText = "¬";
        elem.setAttribute("tabindex", "0");
        return elem;
    }
}

export class BinaryFormula extends BasicFormula {
    // Parent of all binary operators, NOT quantifiers
    constructor(leftChild, rightChild) {
        super();
        this._leftChild = leftChild;
        this._rightChild = rightChild;
    }

    replaceVar(oldVar, newVar, bound) {
        return this._leftChild.replaceVar(oldVar, newVar, bound).concat(this._rightChild.replaceVar(oldVar, newVar, bound));
    }

    getVar() {
        return setUnion(this._leftChild.getVar(), this._rightChild.getVar());
    }

    _show(symbol) {
        let leftShow = this._leftChild.show();
        if (this._leftChild._priority <= this._priority) {
            leftShow = "(" + leftShow + ")";
        }

        let rightShow = this._rightChild.show();
        if (this._rightChild._priority < this._priority) {
            rightShow = "(" + rightShow + ")";
        }

        return leftShow + symbol + rightShow;
    }

    _childrenEqual(other) {
        console.assert(other instanceof BinaryFormula);
        return (this._leftChild.equals(other._leftChild) && this._rightChild.equals(other._rightChild));
    }
}

export class AndFormula extends BinaryFormula {
    constructor(leftChild, rightChild) {
        super(leftChild, rightChild);
        this._priority = 4;
    }

    show() {
        return this._show("⋀");
    }

    equals(other) {
        return (other instanceof AndFormula && this._childrenEqual(other));
    }

    static newElem () {
        let elem = document.createElement("span");
        elem.classList.add("formula-elem", "yellow-elem");
        elem.innerText = "⋀";
        elem.setAttribute("tabindex", "0");
        return elem;
    }
}

export class OrFormula extends BinaryFormula {
    constructor(leftChild, rightChild) {
        super(leftChild, rightChild);
        this._priority = 3;
    }

    show() {
        return this._show("⋁");
    }

    equals(other) {
        return (other instanceof OrFormula && this._childrenEqual(other));
    }

    static newElem () {
        let elem = document.createElement("span");
        elem.classList.add("formula-elem", "cyan-elem");
        elem.innerText = "⋁";
        elem.setAttribute("tabindex", "0");
        return elem;
    }
}

export class ImpliesFormula extends BinaryFormula {
    constructor(leftChild, rightChild) {
        super(leftChild, rightChild);
        this._priority = 2;
    }

    show() {
        return this._show("→");
    }

    equals(other) {
        return (other instanceof ImpliesFormula && this._childrenEqual(other));
    }

    static newElem () {
        let elem = document.createElement("span");
        elem.classList.add("formula-elem", "orange-elem");
        elem.innerText = "→";
        elem.setAttribute("tabindex", "0");
        return elem;
    }
}

export class IffFormula extends BinaryFormula {
    constructor(leftChild, rightChild) {
        super(leftChild, rightChild);
        this._priority = 1;
    }

    show() {
        return this._show("↔");
    }

    equals(other) {
        return (other instanceof IffFormula && this._childrenEqual(other));
    }

    static newElem () {
        let elem = document.createElement("span");
        elem.classList.add("formula-elem", "purple-elem");
        elem.innerText = "↔";
        elem.setAttribute("tabindex", "0");
        return elem;
    }
}

export class EqualsFormula extends PredicateFormula {
    constructor(leftChild, rightChild) {
        super("=", [leftChild, rightChild]);
    }

    show() {
        return this._variables[0].show() + "=" + this._variables[1].show();
    }

    replaceVar(oldVar, newVar, bound) {
        let newVars = [];
        for (let i = 0; i < this._variables.length; i++) {
            newVars[i] = this._variables[i].replaceVar(oldVar, newVar, bound);
        }
        return new EqualsFormula(newVars[0], newVars[1]);
    }

    static newElem () {
        let elem = document.createElement("span");
        elem.classList.add("formula-elem", "greyblue-elem");
        elem.innerText = "=";
        elem.setAttribute("tabindex", "0");
        return elem;
    }
}

export class NotEqualsFormula extends NotFormula {
    constructor(leftChild, rightChild) {
        super(new EqualsFormula(leftChild, rightChild));
        this._leftChild = leftChild;
        this._rightChild = rightChild;
    }

    show() {
        return this._leftChild.show() + "≠" + this._rightChild.show();
    }

    static newElem () {
        let elem = document.createElement("span");
        elem.classList.add("formula-elem", "white-elem");
        elem.innerText = "≠";
        elem.setAttribute("tabindex", "0");
        return elem;
    }
}

export class QuantifierFormula extends BasicFormula {
    constructor(bound, subformula) {
        super();
        this._bound = bound;
        this._subformula = subformula;
    }

    _show(symbol) {
        return symbol + this._bound.show() + "[" + this._subformula.show() + "]";
    }

    getVar() {
        let varSet = this._subformula.getVar();
        varSet.add(this._bound);
        return varSet;
    }
}

export class AllFormula extends QuantifierFormula {
    constructor(bound, subformula) {
        super(bound, subformula);
    }

    show() {
        return this._show("∀");
    }

    replaceVar(oldVar, newVar, bound) {
        // Adds the variable quantified to the list of bound variables
        let newBound = setUnion(new Set(), bound);
        newBound.add(this._bound);
        return new AllFormula(this._bound, this._subformula.replaceVar(oldVar, newVar, newBound));
    }

    equals(other) {
        return (other instanceof AllFormula && this._bound.equals(other._bound) && this._subformula.equals(other._subformula));
    }

    static newElem () {
        let elem = document.createElement("span");
        elem.classList.add("formula-elem", "red-elem");
        elem.innerText = "∀";
        elem.setAttribute("tabindex", "0");
        return elem;
    }
}

export class ExistsFormula extends QuantifierFormula {
    constructor(bound, subformula) {
        super(bound, subformula);
    }

    show() {
        return this._show("∃");
    }

    replaceVar(oldVar, newVar, bound) {
        // Adds the variable quantified to the list of bound variables
        let newBound = setUnion(new Set(), bound);
        newBound.add(this._bound);
        return new ExistsFormula(this._bound, this._subformula.replaceVar(oldVar, newVar, newBound));
    }

    equals(other) {
        return (other instanceof ExistsFormula && this._bound.equals(other._bound) && this._subformula.equals(other._subformula));
    }

    static newElem () {
        let elem = document.createElement("span");
        elem.classList.add("formula-elem", "green-elem");
        elem.innerText = "∃";
        elem.setAttribute("tabindex", "0");
        return elem;
    }
}

// List of formulas in same order as they are in the proof entry windows
export let formulaList = [OrFormula, AndFormula, NotFormula, AtomFormula, ImpliesFormula, IffFormula, EqualsFormula,
                    NotEqualsFormula, BottomFormula, TopFormula, AllFormula, ExistsFormula, PredicateFormula, FunctionFormula];

export function addFormulaData(buttonList) {
    // Takes a list of buttons in order
    // and associates with each the proper Formula class
    console.assert(buttonList.length === 14);
    for (let i = 0; i < 14; i++) {
        buttonList[i].dataset.formulaClassIndex = i;
    }
}
