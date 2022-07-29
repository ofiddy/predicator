import * as formulas from "./formulas.js"
import { setDiff } from "./lib.js";

export class Box {
    // A box that can contain multiple steps
    // Can be opened by various steps, and the entire proof is in a single superbox
    constructor (introducedBy, optionalElem) {
        this._introducedBy = introducedBy;
        this._steps = [];
        this._correspondingElem = (introducedBy ? _toElement() : optionalElem);
    }

    get steps () {
        return this._steps;
    }

    get startNumber () {
        return (this._introducedBy ? this._introducedBy.boxStartNumber() + 1 : 1);
    }

    get elem () {
        return this._correspondingElem;
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
            if (ahead.formula.equals(newStep.formula)) {
                // Look ahead to see if we can autofill to an existing step
                oldStep.elem.remove();
                this._steps.splice(oldIndex, 1);
                if (ahead instanceof GoalStep) {
                    this.insertTo(ahead, newStep);
                }
            } else {
                // If we can't, insert new step and shove along the old
                this._correspondingElem.insertBefore(newStep.elem, oldStep.elem);
                this._steps.splice(oldIndex, 0, newStep);
            }
        } else {
            // Goal step
            this._correspondingElem.insertBefore(newStep.elem, oldStep.elem);
            if (oldStep.formula.equals(newStep.formula)) {
                // If equal, replace the goal step
                this._steps[oldIndex] = newStep;
                oldStep.elem.remove();
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

    secretPush (step) {
        // A "secret" method to be used when setting up a box initially
        // Pushes a step to the box and adds the elem as a child
        this._steps.push(step);
        this._correspondingElem.append(step.elem);
    }

    _resetOnMoveAll () {
        if (this._introducedBy === null) {
            for (let i = 0; i < this._steps.length; i++) {
                this._steps[i].resetOnMove();
            }
            if (this._introducedBy) {
                this._introducedBy.resetOnMove();
            }
        } else {
            this._introducedBy.containedIn._resetOnMoveAll();
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

    _toElement () {
        // Returns and binds the element this box corresponds to
        // Does not occur for the opening box
        let boxElem = document.createElement("div");
        boxElem.classList.add("proof-box");
        boxElem.boxObject = this;
    }
    
}

export class Step {
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
        this._correspondingElem.querySelector(".expression-number").innerText = this._line;
        this._label = this.label;
        this._correspondingElem.querySelector(".expression-origin").innerText = this._label;
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

export class AdminStep extends Step { // Mostly used to identify others
    constructor (...params) {
        super(...params);
    }
}

export class GivenStep extends AdminStep {
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

export class AssStep extends AdminStep {
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

export class EConstStep extends AssStep {
    constructor (formula, containedIn) {
        super(formula, containedIn);
        this._correspondingElem = this.toElement();
    }
}

export class AConstStep extends AssStep {
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

export class GoalStep extends AdminStep {
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

export class EmptyStep extends AdminStep {
    constructor (containedIn) {
        super(null, containedIn);
        this._label = this.label;
        this._isGE = true;
        this._correspondingElem = this.toElement();
        this._correspondingElem.classList.add("italic");
    }

    get formulaText () {
        return "[ Empty ]";
    }

    get label () {
        return "";
    }
}

export class ImmediateStep extends Step {
} // Just for organisation

export class AndIStep extends ImmediateStep {
    constructor (source1, source2, containedIn) {
        super(new formulas.AndFormula(source1.formula, source2.formula), containedIn);
        this._source1 = source1;
        this._source2 = source2;
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    get label () {
        return "⋀I(" + this._source1.calcLine() + ", " + this._source2.calcLine() + ")";
    }
}

export class AndEStep extends ImmediateStep {
    constructor (source, extractingLeft, containedIn) {
        super ((extractingLeft ? source.formula.leftChild : source.formula.rightChild), containedIn);
        this._source = source;
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    get label () {
        return "⋀E(" + this._source.calcLine() + ")";
    }
}

export class ImpEStep extends ImmediateStep {
    constructor (sourceImp, sourceLeft, containedIn) {
        super(sourceImp.formula.rightChild, containedIn);
        this._sourceImp = sourceImp;
        this._sourceLeft = sourceLeft;
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }
    
    get label () {
        return "→E(" + this._sourceImp.calcLine() + ", " + this._sourceLeft.calcLine() + ")";
    }
}

export class OrIStep extends ImmediateStep {
    constructor (source, other, sourceOnLeft, containedIn) {
        super ((sourceOnLeft ? new formulas.OrFormula(source.formula, other) : new formulas.OrFormula(other, source.formula)), containedIn);
        this._source = source;
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    get label () {
        return "⋁I(" + this._source.calcLine() + ")";
    }
}

export class NotEStep extends ImmediateStep {
    constructor (source1, source2, containedIn) {
        super (new formulas.BottomFormula(), containedIn);
        this._source1 = source1;
        this._source2 = source2;
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    get label () {
        return "¬E(" + this._source1.calcLine() + ", " + this._source2.calcLine() + ")";
    }
}

export class NotNotEStep extends ImmediateStep {
    constructor (source, containedIn) {
        super (source.formula.contents.contents, containedIn);
        this._source = source;
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    get label () {
        return "¬¬E(" + this._source.calcLine() + ")";
    }
}

export class BottomIStep extends ImmediateStep {
    // Same as NotEStep, but kept separate because of the need for separate tutorial box
    constructor (source1, source2, containedIn) {
        super (new formulas.BottomFormula(), containedIn);
        this._source1 = source1;
        this._source2 = source2;
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }
    
    get label () {
        return "⊥I(" + this._source1.calcLine() + ", " + this._source2.calcLine() + ")";
    }
}

export class BottomEStep extends ImmediateStep {
    constructor (source, newFormula, containedIn) {
        super (newFormula, containedIn);
        this._source = source;
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    get label () {
        return "⊥E(" + this._source.calcLine() + ")";
    }
}

export class TopIStep extends ImmediateStep {
    constructor (containedIn) {
        super (new formulas.TopFormula(), containedIn);
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    get label () {
        return "⊤I";
    }
}

export class IffIStep extends ImmediateStep {
    constructor (source1, source2, source2Order, containedIn) {
        super ((source2Order ?
            new formulas.IffFormula(source2.formula.leftChild, source2.formula.rightChild) :
            new formulas.IffFormula(source1.formula.leftChild, source1.formula.rightChild)),
            containedIn);
        this._source1 = source1;
        this._source2 = source2;
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    get label () {
        return "↔I(" + this._source1.calcLine() + ", " + this._source2.calcLine() + ")"; 
    }
}

export class IffEStep extends ImmediateStep {
    constructor (sourceImp, sourceMatch, containedIn) {
        super ((sourceImp.formula.leftChild.equals(sourceMatch.formula) ? 
            sourceImp.formula.rightChild : sourceImp.formula.leftChild),
            containedIn);
        this._sourceImp = sourceImp;
        this._sourceMatch = sourceMatch;
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    get label () {
        return "↔E(" + this._sourceImp.calcLine() + ", " + this._sourceMatch.calcLine() + ")"; 
    }
}

export class ExcludedMiddleStep extends ImmediateStep {
    constructor (formula, containedIn, negateLeft) {
        super((negateLeft ? new formulas.OrFormula(new formulas.NotFormula(formula), formula)
            : new formulas.OrFormula(formula, new formulas.NotFormula(formula))),
            containedIn);
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    get label () {
        return "L.E.M."
    }
}

export class ExistsIStep extends ImmediateStep {
    constructor (oldVar, newVar, source, containedIn) {
        super(new formulas.ExistsFormula(newVar, source.formula.replaceVar(oldVar, newVar, new Set())), containedIn);
        this._source = source;
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    get label () {
        return "∃I(" + this._source.calcLine() + ")";
    }
}

export class AllEStep extends ImmediateStep {
    constructor (boundVar, newVar, source, containedIn) {
        super(source.formula.subformula.replaceVar(boundVar, newVar, new Set()), containedIn);
        this._source = source;
        this._label = this.label;
        this._correspondingElem = this.toElement();
    }

    get label () {
        return "∀E(" + this._source.calcLine() + ")";
    }
}

export class AllImpEStep extends ImmediateStep {
    constructor (sourceQuantImp, sourceLeft, containedIn) {
        super(findSourceRight(sourceQuantImp, sourceLeft), containedIn);
        this._sourceQuantImp = sourceQuantImp;
        this._sourceLeft = sourceLeft;
        this._label = this.label;
        this._correspondingElem = this.toElement();

        function findSourceRight (sourceQuantImp, sourceLeft) {
            let allForm = sourceQuantImp.formula;
            let impForm = allForm.subformula;
            let leftForm = sourceLeft.formula;
    
            let newVar = Array.from(setDiff(leftForm.getVar(new Set()), allForm.getVar(new Set())).values())[0];
            let oldVar = allForm.bound;
    
            return impForm.rightChild.replaceVar(oldVar, newVar, new Set());
        }
    }

    get label () {
        return "∀→E(" + this._sourceLeft.calcLine() + ", " + this._sourceQuantImp.calcLine() + ")";
    }
}
