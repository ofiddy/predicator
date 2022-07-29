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
/*
let p = new formulas.AtomFormula("P");
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

let pandq = new formulas.AndFormula(p, q);
let pandr = new formulas.AndFormula(p, r);
let qandr = new formulas.AndFormula(q, r);

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

let box = setUpProof([p_imp_all_qx], all_p_imp_qx);
let int = new steps.AllIStep(all_p_imp_qx, box);
box.insertTo(box.lastStep, int);
let imp = new steps.ImpIStep(p_imp_qsk1, int.box);
int.box.insertTo(int.box.lastStep, imp);
imp.box.insertTo(imp.box.steps[1], new steps.ImpEStep(box.firstStep, imp.box.firstStep, imp.box));
imp.box.insertTo(imp.box.lastStep, new steps.AllEStep(x, sk1, imp.box.steps[1], imp.box));*/