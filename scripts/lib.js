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