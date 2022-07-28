import {bindPhysicsButton} from "./lib.js"

const tutorialWindow = document.getElementById("proof-tutorial-box");

function setModelBoxContents(modelElement) {
    // Sets the content of the model window to the given model element
    // as given in model_steps
    
    tutorialWindow.textContent = "";
    tutorialWindow.appendChild(modelElement);
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