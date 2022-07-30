export function setUnion(setA, setB) {
    const _union = new Set(setA);
    for (const elem of setB) {
        _union.add(elem);
    }
    return _union;
}

export function setDiff(setA, setB) {
    // setA - setB
    const _newSet = new Set(setA);
    for (const elemA of _newSet) {
        for (const elemB of setB) {
            if (elemA.equals(elemB)) {
                _newSet.delete(elemA);
            }
        }
    }
    return _newSet;
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

//export function bindPhysicsButton(button, onClickEvent, onDragEvent, dragQuery) {
export function bindPhysicsButton(button, bindEvents) {
    // Binds functionality to a physics button
    // onClickEvent is what happens when it is clicked
    // onDragEvent is what happens when it is dragged to an element with the dragTarget class
    // bindEvents has "onClick", "onDragEnd", "dragEndQuery", "onDragStart" 
    button.onmousedown = function (event) {
        let startX = event.clientX;
        let startY = event.clientY;
        let deltaX = 0;
        let deltaY = 0;
        let prevRotate = 0;
        let scale = "1.3";
        let pxToAppear = 30;

        if (bindEvents["onDragStart"]) {
            bindEvents["onDragStart"](event);
        }

        // Create the button image and prepare for moving
        let buttonImg = button.cloneNode(true);
        button.style.opacity = "50%";
        buttonImg.style.position = "absolute";
        buttonImg.style.zIndex = 1000;
        buttonImg.style.width = getComputedStyle(button).getPropertyValue("width");
        buttonImg.style.transform = "scale(" + scale + ")";
        buttonImg.style.opacity = "0";
        document.body.append(buttonImg);
        buttonImg.ondragstart = function() {
            return false;
        }

        // Move the image under the pointer
        buttonImg.style.left = (event.pageX - (startX - button.getBoundingClientRect().left + 5)) + "px";
        buttonImg.style.top = (event.pageY - (startY - button.getBoundingClientRect().top + 5)) + "px";
        buttonImg.style.transformOrigin = "center";

        // Moves te image when mouse drags, and adds physics simulation
        function moveAt(pageX, pageY) {
            deltaX = pageX - startX;
            deltaY = pageY - startY;
            let newRotate = deltaX / 3;

            buttonImg.style.transform = ("translate(" + deltaX + "px, " + deltaY + "px) rotate(" + 
                (newRotate - prevRotate) + "deg) scale(" + 1.3 + ")");
            prevRotate = newRotate;

            if (Math.abs(deltaX) > pxToAppear || Math.abs(deltaY) > pxToAppear) {
                buttonImg.style.opacity = "0.6";
            }
        }
        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }
        document.addEventListener("mousemove", onMouseMove);

        // Drop the image and remove handlers
        // Click if not moved far
        // Attempt drag function if moved
        buttonImg.onmouseup = function (event) {
            document.removeEventListener("mousemove", onMouseMove);
            button.style.opacity = "100%";
            buttonImg.onmouseup = null;
            buttonImg.remove();

            if (deltaX < 20 && deltaY < 20 && bindEvents["onClick"]) {
                bindEvents["onClick"](event);
            } else if (bindEvents["onDragEnd"]) {
                let elemBelow = document.elementFromPoint(event.clientX, event.clientY);
                let droppableBelow = elemBelow.closest(bindEvents["dragEndQuery"]);

                if (droppableBelow) {
                    bindEvents["onDragEnd"](event, droppableBelow);
                }
            }
        }
    }
    if (bindEvents["onClick"]) {
        button.addEventListener("click", bindEvents["onClick"]);
    }
}