 export function setupButton(buttonElem, funcs) {
    // buttonElem is the button DOM Element to add functionality to
    // 'funcs' is an object holding the functions to setup the buttons with
    // funcs['onClick'] holds the onClick function

    if (funcs['onClick']) {
        buttonElem.addEventListener("click", funcs['onClick']);
    }
}

export function setUnion(setA, setB) {
    const _union = new Set(setA);
  for (const elem of setB) {
    _union.add(elem);
  }
  return _union;
}

export function boundSetHas(set, value) {
    // Checks if value is in a set using value.equals()
    console.assert(set instanceof Set);
    for (const v of set.values()) {
        if (v.equals(value)) {
            return true;
        }
    }
    return false;
}