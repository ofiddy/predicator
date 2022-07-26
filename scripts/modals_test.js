import {orIntModalSetup} from "./modals.js"

function orIntModalCreate() {
    let modalToplevel = document.getElementById("modal-toplevel");
    modalToplevel.style.display = "block";
    
    let leftPanel = modalToplevel.querySelector("#modal-formula-input-left-panel");
    leftPanel.innerHTML = "";
    leftPanel.appendChild(document.getElementById("modal-or-int-left-panel"));
}

function andElimModalCreate() {
    let modalToplevel = document.getElementById("modal-toplevel");
    modalToplevel.style.display = "block";
    
    modalToplevel.innerHTML = "";
    modalToplevel.appendChild(document.getElementById("modal-and-elim"));
    modalToplevel.querySelector("#modal-and-elim").style.display = "block";
}

function impIntModalCreate() {
    let modalToplevel = document.getElementById("modal-toplevel");
    modalToplevel.style.display = "block";
    
    let leftPanel = modalToplevel.querySelector("#modal-formula-input-left-panel");
    leftPanel.innerHTML = "";
    leftPanel.appendChild(document.getElementById("modal-imp-int-left-panel"));
}

function varEnterModalCreate() {
    let modalToplevel = document.getElementById("modal-toplevel");
    modalToplevel.style.display = "block";
    
    modalToplevel.innerHTML = "";
    modalToplevel.appendChild(document.getElementById("modal-var-enter"));
    modalToplevel.querySelector("#modal-var-enter").style.display = "block";
}

orIntModalSetup();
//impIntModalCreate();
//orIntModalCreate();
//andElimModalCreate();
//varEnterModalCreate();