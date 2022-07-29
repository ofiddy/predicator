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
    box._resetOnMoveAll();
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
let c = new formulas.VariableFormula("c");
let x = new formulas.VariableFormula("x");
let pc = new formulas.PredicateFormula("P", [c]);
let qc = new formulas.PredicateFormula("Q", [c]);
let px = new formulas.PredicateFormula("P", [x]);
let qx = new formulas.PredicateFormula("Q", [x]);
let impc = new formulas.ImpliesFormula(pc, qc);
let impx = new formulas.ImpliesFormula(px, qx);
let all = new formulas.AllFormula(x, impx);
let xeqc = new formulas.EqualsFormula(x, c);

let box = setUpProof([pc, xeqc], qc);
box.insertTo(box.steps[2], new steps.EqualsSymStep(box.steps[1], box));
