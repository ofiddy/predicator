import {setupButton} from "./lib.js"

const tutorialWindow = document.getElementById("proof-tutorial-box");

function setModelBoxContents(modelElement) {
    // Sets the content of the model window to the given model element
    // as given in model_steps
    
    tutorialWindow.textContent = "";
    tutorialWindow.appendChild(modelElement);
}

// Assign the model windows for each step
let orIntStepModel, orElimStepModel,
    andIntStepModel, andElimStepModel,
    notIntStepModel, notElimStepModel,
    impIntStepModel, impElimStepModel,
    iffIntStepModel, iffElimStepModel,
    botIntStepModel, botElimStepModel,
    topIntStepModel, notnotElimStepModel,
    emStepModel, pcStepModel,
    allIntStepModel, allElimStepModel,
    existsIntStepModel, existsElimStepModel,
    eqSymStepModel, eqSubStepModel,
    eqReflexStepModel, allImpElimStepModel;

fetch("../windows/model_steps.html").then(function (response) {
    return response.text();
}).then(function (html) {
    let parser = new DOMParser();
    let models = parser.parseFromString(html, "text/html");

    orIntStepModel = models.getElementById("proof-or-int-model");
    orElimStepModel = models.getElementById("proof-or-elim-model");
    andIntStepModel = models.getElementById("proof-and-int-model");
    andElimStepModel = models.getElementById("proof-and-elim-model");
    notIntStepModel = models.getElementById("proof-not-int-model");
    notElimStepModel = models.getElementById("proof-not-elim-model");
});

// Assign each button for each step
const orIntStepButton = document.getElementById("proof-or-int-button");
const orElimStepButton = document.getElementById("proof-or-elim-button");

// Setup for every button
setupButton(orIntStepButton, {"onClick": () => {
    setModelBoxContents(orIntStepModel);}
});
setupButton(orElimStepButton, {"onClick": () => {
    setModelBoxContents(orElimStepModel);}
});
