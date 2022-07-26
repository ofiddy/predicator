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