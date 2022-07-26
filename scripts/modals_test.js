import {orIntModalSetup} from "./modals.js"

function orIntModalCreate() {
    let modalToplevel = document.getElementById("modal-toplevel");
    modalToplevel.style.display = "block";
    
    let leftPanel = modalToplevel.querySelector("#modal-formula-input-left-panel");
    leftPanel.innerHTML = "";
    leftPanel.appendChild(document.getElementById("modal-or-int-left-panel"));
}

orIntModalSetup();
orIntModalCreate();