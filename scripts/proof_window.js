import {bindPhysicsButton, setDiff} from "./lib.js"
import * as steps from "./steps.js"
import * as formulas from "./formulas.js"
import { setUpModals } from "./modals.js";

let tutorialWindow;
let stepModels;
let stepsList = steps.stepsList;
let buttons;
let lastClickedElement;


function setModelBoxContents(modelElement) {
    // Sets the content of the model window to the given model element
    // as given in model_steps
    
    tutorialWindow.textContent = "";
    tutorialWindow.appendChild(modelElement);
}

function attemptDeleteStep (step) {
    if (!(step instanceof steps.GoalStep || step instanceof steps.AssStep ||
        step instanceof steps.GivenStep || step instanceof steps.EmptyStep)) {
            // Must have an empty step either before or after, or be the last
            let before = step.containedIn.steps[step.containedIn.steps.indexOf(step) - 1];
            let after = step.containedIn.steps[step.containedIn.steps.indexOf(step) + 1];
            if (before instanceof steps.EmptyStep || after instanceof steps.EmptyStep
                || step === step.containedIn.lastStep) {
                step.containedIn.removeStep(step);   
            }
    }
}

function beginPatternEvent(stepId) {
    // Begins the event of selecting sources for a step pattern
    let tutElems = tutorialWindow.querySelector("#proof-tutorial-steps").children;
    let sourceElems = [];
    let destElem;

    // Get the list of source Elems from all tutorial elements
    for (let i = 0; i < tutElems.length - 2; i += 3) {
        sourceElems.push(tutElems[i]);
    }
    destElem = tutElems[tutElems.length - 2];

    let pattern = stepsList[stepId].getPattern(sourceElems, destElem);

    async function advancePatternEvent (event) {
        // Progresses the event if a step clicked on
        // Cancels the event if click off a step or pattern add fails
        try {
            if (event.target.stepObject) {
                let added = pattern.addStep(event.target.stepObject);
                if (!added) {
                    cancelPatternEvent();
                    return;
                }
                if (pattern.fullyMatched) {
                    let newStep = await pattern.attemptFinalise();
                    let dest = pattern.dest;
                    dest.containedIn.insertTo(dest, newStep);
                    cancelPatternEvent();
                }
            } else {
                cancelPatternEvent();
            }
        } catch(err) {
            alert("Error occured: make sure all derivation is possible.");
            cancelPatternEvent();
        }
        
    }

    function cancelPatternEvent() {
        document.removeEventListener("click", advancePatternEvent);
        tutorialWindow.textContent = "";
    }

    document.addEventListener("click", advancePatternEvent);
}

export function setUpProof(givensList, goalFormula) {
    // First does all the behind the scenes setup
    tutorialWindow = document.getElementById("proof-tutorial-box");

    // Import all modals
    setUpModals();

    // Assign the model windows for each step
    stepModels = [];

    fetch("../windows/model_steps.html").then(function (response) {
        return response.text();
    }).then(function (html) {
        let parser = new DOMParser();
        let models = parser.parseFromString(html, "text/html");

        for (let i = 0; i < models.body.children.length; i++) {
            stepModels[i] = models.body.children[i];
        }
    });

    // Adds step models to buttons and binds buttons
    buttons = document.getElementById("proof-button-grid").children;

    for (let i = 0; i < buttons.length; i++) {
        let buttonEvent = {
            "onDragStart": () => {setModelBoxContents(stepModels[i])},
            "onClick": () => {beginPatternEvent(i)},
        }
        bindPhysicsButton(buttons[i], buttonEvent);
    }

    // Binds removing to the document
    document.addEventListener("keydown", (event) => {
        if (event.key === "Delete" && document.activeElement.stepObject) {
            attemptDeleteStep(document.activeElement.stepObject);
        }
    });

    // Then adds the actual proof objects
    // Uses various usually-private attributes of the box for first-time setup
    // Forgive me, javascript gods
    let box = new steps.Box(null, document.getElementById("step-holder"));
    box.elem.innerText = "";
    
    for (let i = 0; i < givensList.length; i++) {
        box.secretPush(new steps.GivenStep(givensList[i], box, i + 1));
    }

    if (givensList.length === 0) {
        box._steps = [new steps.GivenStep(new formulas.BasicFormula(), box, 0)];
    }

    box.secretPush(new steps.EmptyStep(box));
    box.secretPush(new steps.GoalStep(goalFormula, box));
    box.resetOnMoveAll();
    return box;
}

// TEMP FOR TESTIN

/*let p = new formulas.AtomFormula("P");
let q = new formulas.AtomFormula("Q");
let r = new formulas.AtomFormula("R");
let notq = new formulas.NotFormula(q);
let notp = new formulas.NotFormula(p);

let pimpq = new formulas.ImpliesFormula(p, q);
let qimpr = new formulas.ImpliesFormula(q, r);
let pimpr = new formulas.ImpliesFormula(p, r);
let rimpp = new formulas.ImpliesFormula(r, p);
let pimp_qimpr_ = new formulas.ImpliesFormula(p, qimpr);
let rimp_pimp_qimpr__ = new formulas.ImpliesFormula(r, pimp_qimpr_);
let qimp_notp = new formulas.ImpliesFormula(q, notp);
let pimpp = new formulas.ImpliesFormula(p, p);

let pandq = new formulas.AndFormula(p, q);
let pandr = new formulas.AndFormula(p, r);
let qandr = new formulas.AndFormula(q, r);

let porq = new formulas.OrFormula(p, q);

let x = new formulas.VariableFormula("x");
let sk1 = new formulas.VariableFormula("sk1");
let px = new formulas.PredicateFormula("P", [x]);
let qx = new formulas.PredicateFormula("Q", [x]);
let px_and_qx = new formulas.AndFormula(px, qx);
let exi_and = new formulas.ExistsFormula(x, px_and_qx);
let exi_px = new formulas.ExistsFormula(x, px);
let p_imp_qx = new formulas.ImpliesFormula(p, qx);
let qsk1 = new formulas.PredicateFormula("Q", [sk1]);
let p_imp_qsk1 = new formulas.ImpliesFormula(p, qsk1);
let all_p_imp_qx = new formulas.AllFormula(x, p_imp_qx);
let all_qx = new formulas.AllFormula(x, qx);
let p_imp_all_qx = new formulas.ImpliesFormula(p, all_qx);

let box = setUpProof([pimpq, porq], q);
let elim = new steps.OrEStep(q, box.steps[1], box);
box.insertTo(box.steps[2], elim);
elim.boxL.insertTo(elim.boxL.lastStep, new steps.ImpEStep(box.firstStep, elim.boxL.firstStep, elim.boxL));*/

document.body.addEventListener("click", (event) => {
    if (event.target.stepObject) {
        lastClickedElement = event.target;
    };
});