import {setUnion} from "./lib.js";

class BasicFormula {
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

    replaceVar(oldVar, newVar) { // Replaces all instances of oldVar with newVar
        return this;
    }

    getVar() {
        return new Set();
    }

}

class VariableFormula extends BasicFormula {
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

    replaceVar(oldVar, newVar) {
        let replacedVar = (this.equals(oldVar) ? newVar._name : this._name);
        return new VariableFormula(replacedVar);
    }

    getVar() {
        return new Set([this]);
    }
}

class FunctionFormula extends BasicFormula {
    // Represents a function with any number of variables

    constructor (name, variables) {
        // Variables is a list of this functions variables *IN ORDER*
        // As VariableFormula objects
        super();
        this._name = name;
        this._isPredicate = false;
        this._variables = variables;
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

    replaceVar(oldVar, newVar) {
        let newVars = [];
        for (let i = 0; i < this._variables.length; i++) {
            newVars[i] = this._variables[i].replaceVar(oldVar, newVar);
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
}

class AtomFormula extends BasicFormula {
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

class BottomFormula extends BasicFormula {
    // Represents a contradiction

    show() {
        return "⊥";
    }

    equals(other) {
        return (other instanceof BottomFormula);
    }
}

class TopFormula extends BasicFormula {
    // Represents a tautology

    show() {
        return "⊤";
    }

    equals(other) {
        return (other instanceof TopFormula);
    }
}

class PredicateFormula extends BasicFormula {
    // Represents a first-order predicate
    
    constructor (name, variables) {
        // variables is a list of VariableFormula-s
        super();
        this._variables = variables;
        this._name = name;
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

    replaceVar(oldVar, newVar) {
        let newVars = [];
        for (let i = 0; i < this._variables.length; i++) {
            newVars[i] = this._variables[i].replaceVar(oldVar, newVar);
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
}

class NotFormula extends BasicFormula {
    // The only unary formula
    constructor(subFormula) {
        super();
        console.assert(subFormula.isPredicate);
        this._contents = subFormula;
        this._priority = 10;
    }

    show() {
        return "¬" + subFormula.show();
    }

    equals(other) {
        return (other instanceof NotFormula && this._contents.equals(other._contents));
    }

    replaceVar(oldVar, newVar) {
        return this._contents.replaceVar(oldVar, newVar);
    }

    getVar() {
        return this._contents.getVar();
    }
}

class BinaryFormula extends BasicFormula {
    // Parent of all binary operators, NOT quantifiers
    constructor(leftChild, rightChild) {
        super();
        this._leftChild = leftChild;
        this._rightChild = rightChild;
    }

    replaceVar(oldVar, newVar) {
        return this._leftChild.replaceVar(oldVar, newVar).concat(this._rightChild.replaceVar(oldVar, newVar));
    }

    getVar() {
        return setUnion(this._leftChild.getVar(), this._rightChild.getVar());
    }

    _show(symbol) {
        let leftShow = this._leftChild.show();
        if (this._leftChild._priority < this._priority) {
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

class AndFormula extends BinaryFormula {
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
}

class OrFormula extends BinaryFormula {
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
}

class ImpliesFormula extends BinaryFormula {
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
}

class IffFormula extends BinaryFormula {
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
}

class EqualsFormula extends PredicateFormula {
    constructor(leftChild, rightChild) {
        super("=", [leftChild, rightChild]);
    }

    show() {
        return this._variables[0].show() + "=" + this._variables[1].show();
    }

    replaceVar(oldVar, newVar) {
        let newVars = [];
        for (let i = 0; i < this._variables.length; i++) {
            newVars[i] = this._variables[i].replaceVar(oldVar, newVar);
        }
        return new EqualsFormula(newVars[0], newVars[1]);
    }
}

let P = new AtomFormula("P");
let Q = new AtomFormula("Q");
let PandQ = new AndFormula(P, Q);
let PorQ = new OrFormula(P, Q);

let a = new VariableFormula("a");
let b = new VariableFormula("b");
let f = new FunctionFormula("f", [a,b]);
let x = new VariableFormula("x");
let eq = new EqualsFormula(a, f);

console.log(eq.replaceVar(b, x).show());
console.log(eq.getVar());
