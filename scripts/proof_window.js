import {bindPhysicsButton, setDiff} from "./lib.js"
import * as steps from "./steps.js"
import * as formulas from "./formulas.js"

const tutorialWindow = document.getElementById("proof-tutorial-box");

function setModelBoxContents(modelElement) {
    // Sets the content of the model window to the given model element
    // as given in model_steps
    
    tutorialWindow.textContent = "";
    tutorialWindow.appendChild(modelElement);
}

export function setUpProof(givensList, goalFormula) {
    // Uses various usually-private attributes of the box for first-time setup
    // Forgive me, javascript gods
    let box = new steps.Box(null, document.getElementById("step-holder"));
    box.elem.innerText = "";
    
    for (let i = 0; i < givensList.length; i++) {
        box.secretPush(new steps.GivenStep(givensList[i], box, i + 1));
    }
    box.secretPush(new steps.EmptyStep(box));
    box.secretPush(new steps.GoalStep(goalFormula, box));
    box.resetOnMoveAll();
    return box;
}

// Assign the model windows for each step
let stepModels = [];

fetch("../windows/model_steps.html").then(function (response) {
    return response.text();
}).then(function (html) {
    let parser = new DOMParser();
    let models = parser.parseFromString(html, "text/html");

    for (let i = 0; i < models.body.children.length; i++) {
        stepModels[i] = models.body.children[i];
    }
});

// Adds step models to buttons
let buttons = document.getElementById("proof-button-grid").children;
for (let i = 0; i < buttons.length; i++) {
    bindPhysicsButton(buttons[i], () => {setModelBoxContents(stepModels[i])});
}

// TEMP FOR TESTIN
let p = new formulas.AtomFormula("P");
let q = new formulas.AtomFormula("Q");
let r = new formulas.AtomFormula("R");

let pimpq = new formulas.ImpliesFormula(p, q);
let qimpr = new formulas.ImpliesFormula(q, r);
let pimpr = new formulas.ImpliesFormula(p, r);
let rimpp = new formulas.ImpliesFormula(r, p);
let pimp_qimpr_ = new formulas.ImpliesFormula(p, qimpr);
let rimp_pimp_qimpr__ = new formulas.ImpliesFormula(r, pimp_qimpr_);

let pandq = new formulas.AndFormula(p, q);
let pandr = new formulas.AndFormula(p, r);
let qandr = new formulas.AndFormula(q, r);

let box = setUpProof([pandq, pandr], pandr);
box.insertTo(box.steps[2], new steps.AndEStep(box.firstStep, false, box));
box.insertTo(box.steps[3], new steps.AndEStep(box.steps[1], false, box));
box.insertTo(box.steps[4], new steps.AndIStep(box.steps[2], box.steps[3], box));

let imp = new steps.ImpIStep(pimpr, box);
box.insertTo(box.steps[5], imp);