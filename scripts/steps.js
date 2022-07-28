import * as formulas from "./formulas.js"

class Box {
    // A box that can contain multiple steps
    // Can be opened by various steps, and the entire proof is in a single superbox
    constructor (introducedBy) {
        this._introducedBy = introducedBy;
        this._steps = [];
    }

    get steps () {
        return this._steps;
    }

    get startNumber () {
        return (this._introducedBy ? this._introducedBy.boxStartNumber() + 1 : 1);
    }

    insertTo (oldStep, newStep) {
        // oldStep must be GE, newStep must be NGE
        // Adds newStep in oldStep's position, and moves oldStep if needed
        if (!oldStep.GE || newStep.GE) {
            return false;
        }

        let oldIndex = this._steps.indexOf(oldStep);

        if (oldStep instanceof EmptyStep) {
            // Empty step
            let ahead = this._steps[oldIndex + 1];
            if (ahead instanceof GoalStep && ahead.formula.equals(newStep.formula)) {
                // Look ahead to see if we can autofill to a goal step
                //oldStep.elem.remove();
                this._steps.splice(oldIndex, 1);
                this.insertTo(ahead, newStep);
            } else {
                let newEmpty = new EmptyStep(this);
                this._steps.splice(oldIndex, 0, newEmpty);
                this._steps[oldIndex] = newStep;
            }
        } else {
            // Goal step
            if (oldStep.formula.equals(newStep.formula)) {
                // If equal, replace the goal step and remove any empties
                this._steps[oldIndex] = newStep;
                this._purgeEmpty();
            } else {
                // Move goal step down and insert this step
                this.steps.splice(oldIndex, 0, newStep);
            }
        }
        this._resetOnMoveAll();
    }

    removeStep (oldStep) {
        // removes a NGE step
        // PRE: the step is valid to be removed (not empty, given, is at the edge, etc)
        let oldIndex = this._steps.indexOf(oldStep);

        // If no empty step after, add an empty step before this one
        if (!(this._steps[oldIndex + 1] && this._steps[oldIndex + 1] instanceof EmptyStep)) {
            let newEmpty = new EmptyStep(this);
            this._steps.splice(oldIndex, 0, newEmpty);
        }
        
        // If the last step in the box, re-add a goal step
        if (this._steps[this._steps.length - 1] === oldStep) {
            let newGoal = new GoalStep(oldStep.formula, this);
            this._steps.push(newGoal);
        }

        // Remove this step, wherever it is
        this._steps.splice(this._steps.indexOf(oldStep), 1);

        this._resetOnMoveAll();
    }

    _resetOnMoveAll () {
        for (let i = 0; i < this._steps.length; i++) {
            this._steps[i].resetOnMove();
        }
        if (this._introducedBy) {
            this._introducedBy.resetOnMove();
        }
    }

    _purgeEmpty () {
        for (let i = 0; i < this._steps.length; i++) {
            if (this._steps[i] instanceof EmptyStep) {
                this._steps.splice(i, 1);
                i--;
            }
        }
    }
    
}

class Step {
    constructor (formula, containedIn) {
        this._formula = formula;
        this._containedIn = containedIn;
        this._line = containedIn.steps.length;
        this._label = "N/A";
        this._isGE = false;
    }

    get formula () {
        return this._formula;
    }

    get label () {
        return "N/A";
    }

    get GE () {
        return this._isGE;
    }

    get dependentOn () {
        return this._dependentOn;
    }

    get elem () {
        return this._correspondingElem;
    }

    get formulaText () {
        return this._formula.show();
    }

    // Calculates the line number of this step
    calcLine () {
        return (this._containedIn.steps.indexOf(this) + this._containedIn.startNumber);
    }

    // Recalculates the line number of this step and its label
    // Called when this object moves (e.g. a step added above) 
    resetOnMove () {
        this._line = this.calcLine();
        this._label = this.label;
    }

    toElement () {
        let exprElem = document.createElement("div");
        exprElem.classList.add("expression", "proof-expression");
        exprElem.stepObject = this;

        let numLabel = document.createElement("p");
        numLabel.classList.add("expression-number", "italic");
        numLabel.innerText = this.calcLine();
        exprElem.append(numLabel);

        let formLabel = document.createElement("span");
        formLabel.classList.add("expression-body");
        formLabel.innerText = this.formulaText;
        exprElem.append(formLabel);

        let originLabel = document.createElement("p");
        originLabel.classList.add("expression-origin");
        originLabel.innerText = this.label;
        exprElem.append(originLabel);

        return exprElem;
    }
}

class AdminStep extends Step { // Mostly used to identify others
    constructor (...params) {
        super(...params);
    }
}

class GivenStep extends AdminStep {
    // Line number needs to be immutable: externally set when window created
    constructor (formula, containedIn, line) {
        super(formula, containedIn);
        this._line = line;
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    calcLine () {
        return this._line;
    }

    get label () {
        return "given";
    }
}

class AssStep extends AdminStep {
    constructor (formula, containedIn) {
        super(formula, containedIn);
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    calcLine () {
        return this._containedIn.boxStartNumber();
    }

    get label () {
        return "ass";
    }
}

class EConstStep extends AssStep {
    constructor (formula, containedIn) {
        super(formula, containedIn);
        this._correspondingElem = this.toElement();
    }
}

class AConstStep extends AssStep {
    constructor (formula, containedIn) {
        super(formula, containedIn);
        this._label = this.label;
        console.assert(formula instanceof formulas.VariableFormula);
        this._correspondingElem = this.toElement();
    }

    get label () {
        return "∀I const";
    }
}

class GoalStep extends AdminStep {
    constructor (formula, containedIn) {
        super(formula, containedIn);
        this._isGE = true;
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    get label () {
        return "<goal>";
    }
}

class EmptyStep extends AdminStep {
    constructor (containedIn) {
        super(null, containedIn);
        this._label = this.label;
        this._isGE = true;
        this._correspondingElem = this.toElement();
    }

    get formulaText () {
        return "[ Empty ]";
    }

    get label () {
        return "";
    }
}

class ImmediateStepObject extends Step {
} // Just for organisation

class AndIStep extends ImmediateStepObject {
    constructor (source1, source2, containedIn) {
        super(new formulas.AndFormula(source1.formula, source2.formula),containedIn);
        this._source1 = source1;
        this._source2 = source2;
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    get label () {
        return "⋀I(" + this._source1.calcLine() + ", " + this._source2.calcLine() + ")";
    }
}

class OrIStep extends ImmediateStepObject {
    constructor(source, other, sourceOnLeft, containedIn) {
        super ((sourceOnLeft ? new formulas.OrFormula(source.formula, other) : new formulas.OrFormula(other, source.formula)), containedIn);
        this._source = source;
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    get label () {
        return "⋁I(" + this._source.calcLine() + ")";
    }
}

let box = new Box(null);
let p = new formulas.AtomFormula("P");
let q = new formulas.AtomFormula("Q");
let given1 = new GivenStep(p, box, 1);
let given2 = new GivenStep(q, box, 2);
let empty = new EmptyStep(box);
let goal = new GoalStep(new formulas.OrFormula(p, q), box);
box._steps = [given1, given2, empty, goal];
box._resetOnMoveAll();

let andI = new AndIStep(given1, given2, box);
box.insertTo(empty, andI);
let orI = new OrIStep(given1, q, true, box);
box.insertTo(empty, orI);

box.removeStep(orI);

console.log(box._steps);