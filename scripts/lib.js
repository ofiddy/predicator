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

export function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

export function isModifier(event) {
    // Returns true if the event key is a modifier key
    return event.ctrlKey || event.altKey || event.metaKey || event.shiftKey || (event.key === "AltGraph");
}