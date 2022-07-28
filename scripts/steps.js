import * as formulas from "./formulas.js"

class Box {
    // A box that can contain multiple steps
    // Can be opened by various steps, and the entire proof is in a single superbox
    constructor (introducedBy) {
        this._introducedBy = introducedBy;
        this._steps = [new EmptyStep(this)];
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
            let ahead = this._steps[oldIndex + 1];
            if (ahead instanceof GoalStep && ahead.formula.equals(newStep.formula)) {
                // Look ahead to see if we can autofill to a goal step
                oldStep.elem.remove();
                this._steps.splice(oldIndex, 1);
                this.insertTo(ahead, newStep);
            } else {
                let newEmpty = new EmptyStep(this);
                this._steps.splice(oldIndex + 1, 0, item);
                this._steps[oldIndex] = newStep;
            }
        } else {
            // Goal step
        }
    }

    _resetOnMoveAll () {
        for (const s in this._steps) {
            s.resestOnMove();
        }
        introducedBy.resestOnMove();
    }
    
}

class Step {
    constructor (formula, containedIn) {
        this._formula = formula;
        this._containedIn = containedIn;
        this._line = containedIn.steps.length;
        this._label = this.label;
        this._correspondingElem = this.toElement();
        this._isGE = false;
        this._dependentOn = [];
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
    resestOnMove() {
        this._line = this.calcLine();
        this._label = this.label;
    }

    toElement() {
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
    constructor (formula, containedIn) {
        super(formula, containedIn);
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
    }
}

class AConstStep extends AssStep {
    constructor (formula, containedIn) {
        super(formula, containedIn);
        console.assert(formula instanceof formulas.VariableFormula);
    }

    get label () {
        return "∀I const";
    }
}

class GoalStep extends AdminStep {
    constructor (formula, containedIn) {
        super(formula, containedIn);
        this._isGE = true;
    }

    get label () {
        return "<goal>";
    }
}

class EmptyStep extends AdminStep {
    constructor (containedIn) {
        super(null, containedIn);
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
        super(new formula.AndFormula(source1.formula, source2.formula),containedIn);
        this._source1 = source1;
        this._source2 = source2;
    }

    get label () {
        return "⋀I(" + this._source1.calcLine() + ", " + this._source2.calcLine() + ")";
    }
}

let box = new Box(null);
let testGiven1 = new GivenStep(new formulas.AtomFormula("P"), box);


console.log(testEmpty.toElement());