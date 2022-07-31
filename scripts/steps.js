import * as formulas from "./formulas.js"
import { setDiff } from "./lib.js";

export class Box {
    // A box that can contain multiple steps
    // Can be opened by various steps, and the entire proof is in a single superbox
    constructor (introducedBy, optionalElem) {
        this._introducedBy = introducedBy;
        this._steps = [];
        this._correspondingElem = (introducedBy ? this._toElement() : optionalElem);
    }

    get steps () {
        return this._steps;
    }

    get startNumber () {
        return (this._introducedBy ? this._introducedBy.boxStartNumber(this) + 1 : 1);
    }

    get elem () {
        return this._correspondingElem;
    }

    get firstStep () {
        return this._steps[0];
    }

    get lastStep () {
        return this._steps[this._steps.length - 1];
    }

    get depth () {
        return (this._introducedBy ? this._introducedBy.containedIn.depth + 1 : 0);
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
                    oldStep.elem.remove();
                    this.insertTo(ahead, newStep);
                }
            } else {
                // If we can't, insert new step and shove along the old
                this._correspondingElem.insertBefore(newStep.elem, oldStep.elem);
                this._steps.splice(oldIndex, 0, newStep);
                newStep.boxSetUp()
            }
        } else {
            // Goal step
            this._correspondingElem.insertBefore(newStep.elem, oldStep.elem);
            // If equal, replace the goal step and purge all empties
            // And if its a goal step, it should be equal
            this._steps[oldIndex] = newStep;
            oldStep.elem.remove();
            this._purgeEmpty();
            newStep.boxSetUp()
        }
        this.resetOnMoveAll();
    }

    removeStep (oldStep) {
        // removes a NGE step
        // PRE: the step is valid to be removed (not empty, given, is at the edge, etc)
        let oldIndex = this._steps.indexOf(oldStep);

        // If no empty step after, add an empty step before this one
        if (!(this._steps[oldIndex + 1] && this._steps[oldIndex + 1] instanceof EmptyStep)) {
            let newEmpty = new EmptyStep(this);
            this._steps.splice(oldIndex, 0, newEmpty);
            this._correspondingElem.insertBefore(newEmpty.elem, oldStep.elem);
        }
        
        // If the last step in the box, re-add a goal step
        if (this._steps[this._steps.length - 1] === oldStep) {
            let newGoal = new GoalStep(oldStep.formula, this);
            this._correspondingElem.insertBefore(newGoal.elem, oldStep.elem);
            this._steps.push(newGoal);
        }

        // Remove this step, wherever it is
        this._steps.splice(this._steps.indexOf(oldStep), 1);
        oldStep.elem.remove();
        // And if its a box step, remove the boxes
        oldStep.boxRemove();

        this.resetOnMoveAll();
    }

    secretPush (step) {
        // A "secret" method to be used when setting up a box initially
        // Pushes a step to the box and adds the elem as a child
        this._steps.push(step);
        this._correspondingElem.append(step.elem);
    }

    secretPrepend (step) {
        // As above, but adds to the start of the box instead
        this._steps.splice(0, 0, step);
        this._correspondingElem.prepend(step.elem);
    }

    resetOnMoveAll () {
        if (this._introducedBy) {
            this._introducedBy.containedIn.resetOnMoveAll();
        } else {
            this.resetContents(); // Only the top box should do this
        }
    }

    resetContents () {
        for (let i = 0; i < this._steps.length; i++) {
            this._steps[i].resetOnMove();
        }
    }
    

    _purgeEmpty () {
        for (let i = 0; i < this._steps.length; i++) {
            if (this._steps[i] instanceof EmptyStep) {
                this._steps[i].elem.remove();
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
        return boxElem;
    }
    
}

// Basic pattern matching framework for step UI input
export class StepPatternMatch {
    constructor() {
        this._sources = [];
        this._dest = null;
        this._destIsGoal = false;
    }

    get sources () {
        return this._sources;
    }

    get dest () {
        return this._dest;
    }

    get fullyMatched () {
        return (this._sources.filter(Boolean).length === this._sourceElems.length && this._dest);
    }

    get destIsGoal () {
        return this._destIsGoal;
    }

    setSourceRules (patternRules, patternElems) {
        this._sourceRules = patternRules;
        this._sourceElems = patternElems;
        for (const e of patternElems) {
            e.className = "proof-model-step";
            e.innerText = "> Source Step ()";
        }
    }

    setDestRule (destRule, destElem) {
        this._destRule = destRule;
        this._destElem = destElem;
        this._destElem.className = "proof-model-step";
        this._destElem.innerText = "> Destination Step ()";
    }

    setFinalRule (finalRule) {
        this._finalRule = finalRule;
    }

    addStep (step) {
        if (this._destRule(step)) {
            if (this._dest) {
                alert("Can only select one destination step");
                return false;
            }
            this._dest = step;
            this._destElem.innerText = "> Dest Step (" + step.calcLine() + ")";
            this._destElem.classList.add("green-elem");
            this._destIsGoal = (this._dest instanceof GoalStep);
            return true;
        }

        for (let i = 0; i < this._sourceRules.length; i++) {
            console.log("checking rule " + i);
            if (this._sourceRules[i](step) && !this._sources[i]) {
                console.log("made rule " + i);
                this._sources[i] = step;
                this._sourceElems[i].innerText = "> Source Step (" + step.calcLine() + ")";
                this._sourceElems[i].classList.add("green-elem");
                return true;
            }
        }
        alert("Invalid source step selected");
        return false;
    }

    attemptFinalise () {
        if (this._sources.length === this._sourceRules.length && this._dest) {
            return this._finalRule();
        }
        return;
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

    get containedIn () {
        return this._containedIn;
    }

    get elem () {
        return this._correspondingElem;
    }

    get formulaText () {
        return this._formula.show();
    }

    // Calculates the line number of this step
    calcLine () {
        let prevElem = this._containedIn.steps[this._containedIn.steps.indexOf(this) - 1]; 
        return (prevElem.calcLine() + 1);
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
        exprElem.tabIndex = 0;

        let numLabel = document.createElement("p");
        numLabel.classList.add("expression-number", "italic");
        numLabel.innerText = "";
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

    boxSetUp () { // Placeholder for steps requiring a box
        return;
    }

    boxRemove () { // And removing the above
        return;
    }

    _finalSetUp () {
        this._label = this.label;
        this._correspondingElem = this.toElement();
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
        this._finalSetUp();
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
        this._finalSetUp();
    }

    calcLine () {
        return this._containedIn.startNumber;
    }

    get label () {
        return "ass";
    }
}

export class AConstStep extends AssStep {
    constructor (formula, containedIn) {
        super(formula, containedIn);
        this._finalSetUp();
    }

    get label () {
        return "∀I const";
    }
}

export class GoalStep extends AdminStep {
    constructor (formula, containedIn) {
        super(formula, containedIn);
        this._isGE = true;
        this._finalSetUp();
    }

    get label () {
        return "<goal>";
    }
}

export class EmptyStep extends AdminStep {
    constructor (containedIn) {
        super(null, containedIn);
        this._isGE = true;
        this._finalSetUp();
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
        this._finalSetUp();
    }

    get label () {
        return "⋀I(" + this._source1.calcLine() + ", " + this._source2.calcLine() + ")";
    }

    static getPattern (patternElems, destElem) {
        let pattern = new StepPatternMatch();
        let matchFirst = function (step) {
            // Matches the first source
            // Goal selected -> matches left or matches right
            if (step.GE) {
                return false;
            }
            return (!pattern.destIsGoal || (pattern.dest.formula.leftChild.equals(step.formula) || pattern.dest.formula.rightChild.equals(step.formula)));
        }

        let matchSecond = function (step) {
            // Goal selected -> matches the one that sources[0] doesnt match
            if (step.GE || !pattern.sources[0]) {
                return false;
            }
            if (pattern.destIsGoal) {
                if (pattern.dest.formula.leftChild.equals(pattern.sources[0].formula)) {
                    return pattern.dest.formula.rightChild.equals(step.formula);
                } else {
                    return pattern.dest.formula.leftChild.equals(step.formula);
                }
            } else {
                return true;
            }
        }

        let matchDest = function (step) {
            // Empty OR (First selected -> Matches one && right selected -> matches other)
            if (!step.GE) {
                return false;
            }
            if (step instanceof EmptyStep) {
                return true;
            } else if (step.formula instanceof formulas.AndFormula) {
                if (pattern.sources[0]) {
                    if (pattern.sources[0].formula.equals(step.formula.leftChild)) {
                        // First source matches the left child
                        if (pattern.sources[1] && !pattern.sources[1].formula.equals(step.formula.rightChild)) {
                            return false;
                        }
                    } else {
                        // First source matches the right child
                        if (pattern.sources[1] && !pattern.sources[1].formula.equals(step.formula.leftChild)) {
                            return false;
                        }
                    }
                }
                return true;
            }
            return false;
        }

        let finalRule = function () {
            if (pattern.destIsGoal && pattern.sources[0].formula.equals(pattern.dest.formula.rightChild)) {
                // If first source matches the right child of a selected goal
                return new AndIStep(pattern.sources[1], pattern.sources[0], pattern.dest.containedIn);
            }
            return new AndIStep(pattern.sources[0], pattern.sources[1], pattern.dest.containedIn);
        }

        pattern.setSourceRules([matchFirst, matchSecond], patternElems);
        pattern.setDestRule(matchDest, destElem);
        pattern.setFinalRule(finalRule);
        return pattern;
    }
}

export class AndEStep extends ImmediateStep {
    constructor (source, extractingLeft, containedIn) {
        super ((extractingLeft ? source.formula.leftChild : source.formula.rightChild), containedIn);
        this._source = source;
        this._finalSetUp();
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
        this._finalSetUp();
    }
    
    get label () {
        return "→E(" + this._sourceImp.calcLine() + ", " + this._sourceLeft.calcLine() + ")";
    }

    static getPattern (patternElems, destElem) {
        let pattern = new StepPatternMatch();
        let matchImp = function (step) {
            // Matching the implication source step
            // (left selected -> has same left) and (goal selected -> has same right)
            if (step.GE || !(step.formula instanceof formulas.ImpliesFormula)) {
                return false;
            }
            return (!pattern.sources[1] || pattern.sources[1].formula.equals(step.formula.leftChild))
                 && (!pattern.destIsGoal || pattern.dest.formula.equals(step.formula.rightChild)); 
        }

        let matchLeft = function (step) {
            // Matching the left-hand side step
            // (imp selected -> is same as imp left)
            if (step.GE) {
                return false;
            }
            return (!pattern.sources[0] || pattern.sources[0].formula.leftChild.equals(step.formula));
        }

        let matchDest = function (step) {
            // Matching the dest step
            // Empty OR (imp selected -> is same as imp right)
            if (!step.GE) {
                return false;
            }
            return (step instanceof EmptyStep || (!pattern.sources[0] || pattern.sources[0].formula.rightChild.equals(step.formula)))
        }

        pattern.setSourceRules([matchImp, matchLeft], patternElems);
        pattern.setDestRule(matchDest, destElem);
        pattern.setFinalRule(() => {
            return new ImpEStep(pattern.sources[0], pattern.sources[1], pattern.dest.containedIn);
        });
        return pattern;
    }
}

export class OrIStep extends ImmediateStep {
    constructor (source, other, sourceOnLeft, containedIn) {
        super ((sourceOnLeft ? new formulas.OrFormula(source.formula, other) : new formulas.OrFormula(other, source.formula)), containedIn);
        this._source = source;
        this._finalSetUp();
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
        this._finalSetUp();
    }

    get label () {
        return "¬E(" + this._source1.calcLine() + ", " + this._source2.calcLine() + ")";
    }

    static getPattern (patternElems, destElem) {
        let pattern = new StepPatternMatch();
        let matchFirst = function (step) {
            return (!step.GE);
        }
        let matchSecond = function (step) {
            // (first is not -> first contents is this) or (this is not -> this contents is first)
            if (step.GE) {
                return false;
            }
            return ((!(pattern.sources[0].formula instanceof formulas.NotFormula) || pattern.sources[0].formula.contents.equals(step.formula))
            || (!(step.formula instanceof formulas.NotFormula) || step.formula.contents.equals(pattern.sources[0].formula)));
        }

        let matchDest = function (step) {
            // Empty or Bottom
            return (step.GE && (step instanceof EmptyStep || step.formula.equals(new formulas.BottomFormula())));
        }

        pattern.setSourceRules([matchFirst, matchSecond], patternElems);
        pattern.setDestRule(matchDest, destElem);
        pattern.setFinalRule(() => {
            return new NotEStep(pattern.sources[0], pattern.sources[1], pattern.dest.containedIn);
        });
        return pattern;
    }
}

export class NotNotEStep extends ImmediateStep {
    constructor (source, containedIn) {
        super (source.formula.contents.contents, containedIn);
        this._source = source;
        this._finalSetUp();
    }

    get label () {
        return "¬¬E(" + this._source.calcLine() + ")";
    }

    static getPattern (patternElems, destElem) {
        let pattern = new StepPatternMatch();
        let matchSource = function (step) {
            // Matching the source step
            // (goal selected -> internal formula is equal)
            if (step.GE || !(step.formula instanceof formulas.NotFormula)
                || !(step.formula.contents instanceof formulas.NotFormula)) {
                return false;
            }  
            let internal = step.formula.contents.contents;
            return (!pattern.destIsGoal || pattern.dest.formula.equals(internal));
        }

        let matchDest = function (step) {
            // Matching the dest step
            // (source selected -> internal formula is equal)
            if (!step.GE) {
                return false;
            }
            return (step instanceof EmptyStep || (!pattern.sources[0] || pattern.sources[0].formula.contents.contents.equals(step.formula)));
        }

        pattern.setSourceRules([matchSource], patternElems);
        pattern.setDestRule(matchDest, destElem);
        pattern.setFinalRule(() => {
            return new NotNotEStep(pattern.sources[0], pattern.dest.containedIn);
        });
        return pattern;
    }
}

export class BottomIStep extends ImmediateStep {
    // Same as NotEStep, but kept separate because of the need for separate tutorial box
    constructor (source1, source2, containedIn) {
        super (new formulas.BottomFormula(), containedIn);
        this._source1 = source1;
        this._source2 = source2;
        this._finalSetUp();
    }
    
    get label () {
        return "⊥I(" + this._source1.calcLine() + ", " + this._source2.calcLine() + ")";
    }

    static getPattern (patternElems, destElem) {
        let pattern = NotEStep.getPattern(patternElems, destElem);
        pattern.setFinalRule(() => {
            return new BottomIStep(pattern.sources[0], pattern.sources[1], pattern.dest.containedIn);
        });
        return pattern;
    }
}

export class BottomEStep extends ImmediateStep {
    constructor (source, newFormula, containedIn) {
        super (newFormula, containedIn);
        this._source = source;
        this._finalSetUp();
    }

    get label () {
        return "⊥E(" + this._source.calcLine() + ")";
    }
}

export class TopIStep extends ImmediateStep {
    constructor (containedIn) {
        super (new formulas.TopFormula(), containedIn);
        this._finalSetUp();
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
        this._finalSetUp();
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
        this._finalSetUp();
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
            this._finalSetUp();
    }

    get label () {
        return "L.E.M."
    }
}

export class ExistsIStep extends ImmediateStep {
    constructor (oldVar, newVar, source, containedIn) {
        super(new formulas.ExistsFormula(newVar, source.formula.replaceVar(oldVar, newVar, new Set())), containedIn);
        this._source = source;
        this._finalSetUp();
    }

    get label () {
        return "∃I(" + this._source.calcLine() + ")";
    }
}

export class AllEStep extends ImmediateStep {
    constructor (boundVar, newVar, source, containedIn) {
        super(source.formula.subformula.replaceVar(boundVar, newVar, new Set()), containedIn);
        this._source = source;
        this._finalSetUp();
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
        this._finalSetUp();

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

export class EqualsSubStep extends ImmediateStep {
    constructor (sourceEquals, sourceFree, containedIn, replaceRightWithLeft) {
        super(replaceRightWithLeft ? sourceFree.formula.replaceVar(sourceEquals.formula.rightVar, sourceEquals.formula.leftVar, new Set()) : 
        sourceFree.formula.replaceVar(sourceEquals.formula.leftVar, sourceEquals.formula.rightVar, new Set()), containedIn);
        this._sourceEquals = sourceEquals;
        this._sourceFree = sourceFree;
        this._finalSetUp();
    }

    get label () {
        return "=sub(" + this._sourceFree.calcLine() + ", " + this._sourceEquals.calcLine() + ")";
    }
}

export class EqualsReflexStep extends ImmediateStep {
    constructor (varFormula, containedIn) {
        super(new formulas.EqualsFormula(varFormula, varFormula), containedIn);
        this._finalSetUp();
    }

    get label () {
        return "reflexivity"
    }
}

export class EqualsSymStep extends ImmediateStep {
    constructor (source, containedIn) {
        super(new formulas.EqualsFormula(source.formula.rightVar, source.formula.leftVar), containedIn);
        this._source = source;
        this._finalSetUp();
    }

    get label () {
        return "=sym(" + this._source.calcLine() + ")";
    }
}

export class BoxStep extends Step {
    // Steps that introduce a single box before themselves
    constructor (formula, containedIn) {
        super (formula, containedIn);
        this._box = new Box(this);
    }

    get box () {
        return this._box;
    }

    calcLine () {
        if (this._box.lastStep) {
            this._box.resetContents();
            return this._box.lastStep.calcLine() + 1;
        } else {
            return 0; // Placeholder
        }
    }

    boxStartNumber () {
        let prevElem = this._containedIn.steps[this._containedIn.steps.indexOf(this) - 1];
        return (prevElem ? prevElem.calcLine() : 0);
    }

    boxSetUp (steps) {
        // Has to be done manually because of the weird dependeces of getting
        // the corresponding element. Should be done ONCE after this elem added
        if (steps[0]._formula.equals(steps[steps.length - 1]._formula)) {
            this._box.secretPush(steps[0]); // For very quick boxes
        } else {
            for (const s of steps) {
                this._box.secretPush(s);
            }
        }

        this._containedIn.elem.insertBefore(this._box.elem, this._correspondingElem);
        this._box.resetOnMoveAll();
    }

    boxRemove () {
        this._box.elem.remove();
    }
}

export class ImpIStep extends BoxStep {
    constructor (formula, containedIn) {
        super (formula, containedIn);
        this._finalSetUp();
    }

    get label () {
        if (this._box.steps.length > 0) {
            return "→I(" + this._box.firstStep.calcLine() + ", " + this._box.lastStep.calcLine() + ")";
        } else {
            return 0; // Placeholder
        }
    }

    boxSetUp () {
        super.boxSetUp([
            new AssStep(this._formula.leftChild, this._box),
            new EmptyStep(this._box),
            new GoalStep(this._formula.rightChild, this._box)
        ]);
    }
}

export class NotIStep extends BoxStep {
    constructor (formula, containedIn) {
        // formula is a NotFormula already
        super (formula, containedIn);
        this._finalSetUp();
    }

    get label () {
        if (this._box.steps.length > 0) {
            return "¬I(" + this._box.firstStep.calcLine() + ", " + this._box.lastStep.calcLine() + ")";
        } else {
            return 0; // Placeholder
        }
    }

    boxSetUp () {
        super.boxSetUp([
            new AssStep(this._formula.contents, this._box),
            new EmptyStep(this._box),
            new GoalStep(new formulas.BottomFormula(), this._box)
        ]);
    }
}

export class PCStep extends BoxStep {
    constructor (formula, containedIn) {
        super (formula, containedIn);
        this._finalSetUp();
    }

    get label () {
        if (this._box.steps.length > 0) {
            return "PC(" + this._box.firstStep.calcLine() + ", " + this._box.lastStep.calcLine() + ")";
        } else {
            return 0; // Placeholder
        }
    }

    boxSetUp () {
        super.boxSetUp([
            new AssStep(new formulas.NotFormula(this._formula), this._box),
            new EmptyStep(this._box),
            new GoalStep(new formulas.BottomFormula(), this._box),
        ]);
    }
}

export class ExistsEStep extends BoxStep {
    constructor (source, targetFormula, containedIn) {
        super (targetFormula, containedIn);
        this._source = source;
        this._finalSetUp();
    }

    get label () {
        if (this._box.steps.length > 0) {
            return "∃E(" + this._source.calcLine() + ", " + this._box.firstStep.calcLine() + ", " + this._box.lastStep.calcLine() + ")";
        } else {
            return 0; // Placeholder
        }
    }

    boxSetUp () {
        let newVar = new formulas.VariableFormula("sk" + this._box.depth);
        let oldVar = this._source.formula.bound;
        let newFormula = this._source.formula.subformula.replaceVar(oldVar, newVar, new Set());
        super.boxSetUp([
            new AssStep(newFormula, this._box),
            new EmptyStep(this._box),
            new GoalStep(this._formula, this._box)
        ]);
    }
}

export class AllIStep extends BoxStep {
    constructor (formula, containedIn) {
        super (formula, containedIn);
        this._finalSetUp();
    }

    get label () {
        if (this._box.steps.length > 0) {
            return "∀I(" + this._box.firstStep.calcLine() + ", " + this._box.lastStep.calcLine() + ")";
        } else {
            return 0; // Placeholder
        }
    }

    boxSetUp () {
        let newVar = new formulas.VariableFormula("sk" + this._box.depth);
        let boundVar = this._formula.bound;
        let newFormula = this._formula.subformula.replaceVar(boundVar, newVar, new Set());
        super.boxSetUp([
            new AConstStep(newVar, this._box),
            new EmptyStep(this._box),
            new GoalStep(newFormula, this._box)
        ]);
    }
}

export class OrEStep extends Step {
    // Only step that introduces two boxes
    constructor (formula, source, containedIn) {
        super(formula, containedIn);
        this._source = source;
        this._boxL = new Box(this);
        this._boxR = new Box(this);
        
        this._parentElem = document.createElement("div");
        this._parentElem.classList.add("dual-proof-box");
        this._parentElem.appendChild(this._boxL.elem);
        this._parentElem.appendChild(this._boxR.elem);
        this._finalSetUp();
    }

    get boxL () {
        return this._boxL;
    }

    get boxR () {
        return this._boxR;
    }

    get label () {
        if (this._boxR.steps.length <= 0) {
            return 0; // Placeholder
        }

        return (
            "⋁E(" + this._source.calcLine() + ", " + 
            this._boxL.firstStep.calcLine() + " - " + this._boxL.lastStep.calcLine() + ", " + 
            this._boxR.firstStep.calcLine() + " - " + this._boxR.lastStep.calcLine() + ")");
    }

    boxStartNumber (box) {
        if (box === this._boxL) {
            let prevElem = this._containedIn.steps[this._containedIn.steps.indexOf(this) - 1];
            return (prevElem ? prevElem.calcLine() : 0);
        } else {
            return (this._boxL.lastStep ? this._boxL.lastStep.calcLine() : 0);
        }
    }

    calcLine () {
        if (this._boxR.lastStep) {
            this._boxL.resetContents();
            this._boxR.resetContents();
            return this._boxR.lastStep.calcLine() + 1;
        }
        return 0; // Placeholder
    }

    boxSetUp () {
        // The insertTo is a shortcut to very short boxes where needed
        this._boxL.secretPush(new EmptyStep(this._boxL));
        this._boxL.secretPush(new GoalStep(this._formula, this._boxL));
        this._boxL.insertTo(this._boxL.firstStep, new AssStep(this._source.formula.leftChild, this._boxL));

        this._boxR.secretPush(new EmptyStep(this._boxR));
        this._boxR.secretPush(new GoalStep(this._formula, this._boxR));
        this._boxR.insertTo(this._boxR.firstStep, new AssStep(this._source.formula.rightChild, this._boxR));

        this._containedIn.elem.insertBefore(this._parentElem, this._correspondingElem);
        this._boxL.resetOnMoveAll();
        this._boxR.resetOnMoveAll();
    }

    boxRemove () {
        this._parentElem.remove();
    }
}

export const stepsList = [
    OrIStep, OrEStep, AndIStep, AndEStep, NotIStep, NotEStep,
    ImpIStep, ImpEStep, IffIStep, IffEStep, BottomIStep, BottomEStep,
    TopIStep, NotNotEStep, ExcludedMiddleStep, PCStep, AllIStep, AllEStep,
    ExistsIStep, ExistsEStep, EqualsSymStep, EqualsSubStep, EqualsReflexStep, AllImpEStep
];