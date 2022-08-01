let modalDoc;

export function setUpModals () {
    fetch("./modals.html").then(function (response) {
        return response.text();
    }).then(function (html) {
        let parser = new DOMParser();
        modalDoc = parser.parseFromString(html, "text/html");
        document.body.append(modalDoc.getElementById("modal-toplevel"));
    });
}

function centerModal (modal) {
    modal.style.left = "50%";
    modal.style.top = "50%";
    modal.style.transform = "translate(-50%, -50%)";
}

export function orIntModalSetup (priorFormula) {
    // Performs the setup for the Or-Introduction modal
    
    //let priorText = priorFormula.show();
    let priorText = "lol";
    document.getElementById("modal-or-int-prior-left").textContent = priorText + " ⋁ ";
    document.getElementById("modal-or-int-prior-right").textContent = " ⋁ " + priorText;

    let leftVisible = true;
    document.getElementById("modal-or-int-swap").addEventListener("click", () => {
        if (leftVisible) {
            document.getElementById("modal-or-int-prior-left").style.display = "none";
            document.getElementById("modal-or-int-prior-right").style.display = "block";
        } else {
            document.getElementById("modal-or-int-prior-left").style.display = "block";
            document.getElementById("modal-or-int-prior-right").style.display = "none";
        }
        leftVisible = !leftVisible;
    });
}

export function andElimDialog (formula, resolve) {
    // Sets up the dialog
    let formulaText = formula.show();
    let modalTop = document.getElementById("modal-toplevel");
    modalTop.innerHTML = "";
    let andElimModal = document.importNode(modalDoc.getElementById("modal-and-elim"), true);
    modalTop.appendChild(andElimModal);

    document.getElementById("modal-and-elim-formula").innerText = formulaText;
    modalTop.style.display = "flex";
    andElimModal.style.display = "block";

    document.getElementById("modal-and-left-button").onclick = () => {resolve("left")};
    document.getElementById("modal-and-right-button").onclick = () => {resolve("right")};
}

export function closeAndElimDialog () {
    document.getElementById("modal-toplevel").innerHTML = "";
    document.getElementById("modal-toplevel").style.display = "none";
}