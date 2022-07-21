 export function setupButton(buttonElem, funcs) {
    // buttonElem is the button DOM Element to add functionality to
    // 'funcs' is an object holding the functions to setup the buttons with
    // funcs['onClick'] holds the onClick function

    if (funcs['onClick']) {
        buttonElem.addEventListener("click", funcs['onClick']);
    }
}