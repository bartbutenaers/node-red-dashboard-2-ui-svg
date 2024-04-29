const ALLOWED_EVENTS = ["click", "dblclick", "change", "contextmenu", "mouseover", "mouseout", "mouseup", "mousedown", "focus", "focusin", "focusout", "blur", "keyup", "keydown", "touchstart", "touchend", "change"]
const NAMESPACES = {
  svg: 'http://www.w3.org/2000/svg',
  html: 'http://www.w3.org/1999/xhtml',
  xml: 'http://www.w3.org/XML/1998/namespace',
  xlink: 'http://www.w3.org/1999/xlink',
  xmlns: 'http://www.w3.org/2000/xmlns/' // sic for the final slash...
}

// TODO check whether this works, because this was previously stored in the AngularJs $scope
let clickTimer
let clickTimerTarget
let clickCount

// ===================================================================================================
// INTERNAL (HELPER) FUNCTIONS
// ===================================================================================================

// Determine - based on the attribute name - whether a namespaced value should be set or not.
// See https://stackoverflow.com/questions/52571125/setattributens-xmlns-of-svg-for-a-general-purpose-library
function _setAttribute(element, name, value) {
    let parts = name.split(':')
    let prefix = parts[0]
    let unqualifiedName = parts.slice(1).join(':')
    let namespace = null
    if (prefix === 'xmlns' || unqualifiedName.length && NAMESPACES[prefix]) {
        namespace = NAMESPACES[prefix]
    }
    if (namespace) {
        element.setAttributeNS(namespace, name, String(value))
    } else {
        element.setAttribute(name, String(value))
    }
}

// Determine - based on the attribute name - whether a namespaced value should be get or not.
function _getAttribute(element, name) {
    let parts = name.split(':')
    let prefix = parts[0]
    let unqualifiedName = parts.slice(1).join(':')
    let namespace = null
    if (prefix === 'xmlns' || unqualifiedName.length && NAMESPACES[prefix]) {
        namespace = NAMESPACES[prefix]
    }
    if (namespace) {
        return element.getAttributeNS(namespace, name)
    } else {
        return element.getAttribute(name)
    }
}

function _setStyleAttributes(element, attributes) {
    // Get the existing style string (if available)
    let style = _getAttribute(element, 'style') || ''

    // Convert the (; separated) style string to an object
    let styleObject = {};
    style.split(';').forEach(function(styleAttribute) {
        let [attribute, value] = styleAttribute.split(':')
        if (attribute && value) {
            styleObject[attribute.trim()] = value.trim()
        }
    })

    // Apply the new style attributes to the style object
    for (const [key, value] of Object.entries(attributes)) {
        styleObject[key] = value
    }

    // Convert the object to a (; separated) style string
    style = ''
    for (const [key, value] of Object.entries(styleObject)) {
        style += `${key}:${value};`
    }

    _setAttribute(element, 'style', style)
}

function _checkRequiredFields(payload, fields) {
    fields.forEach(function(field) {
        if (!(field in payload)) {
            throw new Error(`Command '${payload.command}' requires a '${field}' field`)
        }
    })
}

// ===================================================================================================
// EXTERNAL FUNCTIONS
// ===================================================================================================

// Add elements, or replace them if they already exist
function addElement(document, svgElement, payload) {
    _checkRequiredFields(payload, ['type'])

    let parentElements = []
    if (payload.parentSelector) {
        parentElements = svgElement.querySelectorAll(payload.parentSelector);

        if (!parentElements || parentElements.length == 0) {
            throw new Error(`No element matches the specified 'parentSelector' (${payload.parentSelector})`)
        }
    }

    if (parentElements.length > 1 && payload.elementId) {
        throw new Error(`Cannot add a single element (with id ${payload.elementId}) to multiple parent elements`)
    }

    // When no parent selector is specified, the new elements will be added to the root SVG element
    if (parentElements.length == 0) {
        parentElements.push(svgElement)
    }

    // Create a new svg element (of the specified type) to every specified parent SVG element
    parentElements.forEach(function(parentElement){
        let newElement

        if (payload.foreignElement == true) {
            // Foreign elements are html elements, which don't belong to the svg namespace
            newElement = document.createElement(payload.type)
        }
        else {
            newElement = document.createElementNS('http://www.w3.org/2000/svg', payload.type)
        }

        if (payload.id) {
            _setAttribute(newElement, 'id', payload.id)
        }

        if (payload.attributes) {
            for (const [key, value] of Object.entries(payload.attributes)) {
                _setAttribute(newElement, key, value)
            }
        }

        // TODO reuse the code of setStyleAttribute
        if (payload.style) {
            let style = ''
            // Convert the Javascript object to a style formatted string
            // TODO setStyle code sharen
            for (const [key, value] of Object.entries(payload.style)) {
                style += `${key}:${value};`
            }

            _setAttribute(newElement, 'style', style)
        }

        if (payload.text) {
            newElement.textContent = payload.text
        }

        // In the "Events" tabsheet might be a CSS selector that matches this new element. This means that the
        // new element might need to get event handlers automatically.  To make sure we ONLY apply those handlers
        // to this new element, we add the element to a dummy parent which only has one child (i.e. this new element).
        //let dummyParent = document.createElement("div")
        //dummyParent.appendChild(newElement)
        //applyEventHandlers(dummyParent)

        parentElement.appendChild(newElement)
    })
}

function addEvent(svgElement, payload, callbackHandler) {
    // TODO: if js events are imported, we could introduce a 'javascript' property which contains
    // the code to be executed in the handleEvent.
    _checkRequiredFields(payload, ['selector', 'message', 'event'])

    if (!ALLOWED_EVENTS.includes(payload.event)) {
        throw new Error(`The specified 'event' is not supported`)
    }

    let elements = svgElement.querySelectorAll(payload.selector)
    if (!elements || !elements.length) {
        throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`)
    }

    let dataAttribute = `data-event_${payload.event}`

    elements.forEach(function(element) {
        if (!element.hasAttribute(dataAttribute)) {
            element.addEventListener(payload.event, callbackHandler, false)

            // Store all the user data in a "data-event_<event>" element attribute, to have it available in the handleEvent function
            element.setAttribute(dataAttribute, JSON.stringify({
                elementId  : element.id,
                selector   : payload.selector,
                event      : payload.event,
                message    : payload.message
            }))

            element.style.cursor = "pointer"
        }
    })
}

function getAttribute(svgElement, payload) {
    _checkRequiredFields(payload, ['selector', 'attribute'])

    let elements = svgElement.querySelectorAll(payload.selector)
    if (!elements || !elements.length) {
        throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`)
    }

    let values = []
    elements.forEach(function(element){
        values.push(_getAttribute(element, payload.attribute))
    })

    if (values.length === 1) {
        return values[0]
    }
    else {
        return values
    }
}

// Note: this function is only required in the server side
function getSvg(svgElement, payload) {
    // Get the svg string (which might have been modified meanwhile via input messages)
    // TODO dit klopt niet want wat als we verschillende commands hebben...
    return svgElement.toString()
}

// Note: this function is only required in the server side
// Returns the text content for every element that matches the selector.
// For each of those elements it will return a string, containing the (comma separated) text contents
// of all child elements.  For example:
//      <svg id="mySvg" xmlns="http://www.w3.org/2000/svg" width="500" height="500">
//          <text x="10" y="50">Hello,</text>
//          <text x="70" y="50">World!</text>
//     </svg>
// The text content of element 'mySvg' will be 'Hello,World!'.
// In contradiction to the inner html, the text content will not contain the tags of the child elements.
function getText(svgElement, payload) {
    _checkRequiredFields(payload, ['selector'])

    let elements = svgElement.querySelectorAll(payload.selector)
    if (!elements || !elements.length) {
        throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`)
    }

    let textContents = []
    elements.forEach(function(element){
        textContents.push(element.textContent)
    })

    if (textContents.length == 1) {
        return textContents[0]
    }
    else {
        return textContents
    }
}

// Get the value from a foreign (i.e. non-svg) html element.
// A value is available for the following html element types: input, textarea, select, option, button, output
function getValue(svgElement, payload) {
    _checkRequiredFields(payload, ['selector'])

    let elements = svgElement.querySelectorAll(payload.selector)
    if (!elements || !elements.length) {
        throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`)
    }

    let values = []
    elements.forEach(function(element) {
        // Only set the value for html element types which have a value
        if (element.value !== undefined) {
            values.push(element.value)
        }
    })

    if (values.length == 1) {
        return values[0]
    }
    else {
        return values
    }
}

function removeElement(svgElement, payload) {
    _checkRequiredFields(payload, ['selector'])

    let elements = svgElement.querySelectorAll(payload.selector)
    if (!elements || !elements.length) {
        throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`)
    }

    elements.forEach(function(element){
        element.remove()
    })
}

function removeEvent(svgElement, payload, callbackHandler) {
    _checkRequiredFields(payload, ['selector', 'event'])

    let elements = svgElement.querySelectorAll(payload.selector)
    if (!elements || !elements.length) {
        throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`)
    }

    let dataAttribute = `data-event_${payload.event}`

    elements.forEach(function(element) {
        if (element.hasAttribute(dataAttribute)) {
            element.removeEventListener(payload.event, callbackHandler, false)

            // TODO the 'event' could contain an array to loop, or an empty array (or null) means all events
            // Remove all the user data in a "data-<event>" element attribute
            element.removeAttribute(dataAttribute)

            element.style.cursor = ''
        }
    })
}

function setStyle(svgElement, payload) {
    _checkRequiredFields(payload, ['selector', 'style'])

    let elements = svgElement.querySelectorAll(payload.selector)
    if (!elements || !elements.length) {
        throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`)
    }

    elements.forEach(function(element){
        if (payload.attribute) {
            element.style[payload.attribute] = payload.style;
        }
        else {
            if (typeof(payload.style) == 'object') {
                for (const property in payload.style) {
                    element.style[property] = payload.style[property]
                }
            } else if (payload.style == 'string') {
                element.style.cssText = payload.style
            }
            else {
                throw new Error(`command 'set_style' requires a string or object 'style'`)
            }
        }
    })
}

function setSvg(domParser, payload) {
    _checkRequiredFields(payload, ['svg'])

    // Make sure there is an svg root element, because the dom parser below won't add it automatically
    if (!payload.svg.trim().startsWith('<svg')) {
        payload.svg = `<svg>${payload.svg}</svg>`
    }

    // The svg element should have an xmlns attribute, before passing the string to the dom parser!!!
    // Otherwise the created document will contain all svg child elements, but they won't be visible in the browser.
    const xmlnsPattern = /<svg[^>]*xmlns="http:\/\/www.w3.org\/2000\/svg"/
    if (!xmlnsPattern.test(payload.svg)) {
        payload.svg = payload.svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    // When parsing the string, a new document instance will be created
    let document = domParser.parseFromString(payload.svg, 'image/svg+xml')

    // No exception is thrown in case of invalid svg, so let's find out if there has been a problem
    // See https://www.sitelint.com/blog/check-if-a-string-is-valid-html-using-javascript
    // TODO check whether documentElement is required and also whether this works with linkedom
    let parseError = document.documentElement.querySelector('parsererror')
    if (parseError !== null /* TODO?? && parseError.nodeType === Node.ELEMENT_NODE*/) {
        // TODO get the error text from the parseError instance
        // TODO check whether <svg></svg> is required
        throw new Error(`The 'svg' contains invalid svg`)
    }

    let svgElement = document.querySelector('svg')

    // No matter which dimensions are being injected , we will always let it fill the available space.
    // Otherwise users end up with a lot of troubles, so let's keep it simple...
    _setAttribute(svgElement, 'width', '100%')
    _setAttribute(svgElement, 'heigth', '100%')

    return document
}

function setText(svgElement, payload) {
    _checkRequiredFields(payload, ['selector', 'text'])

// TODO in de oude node stond code om de unicode van een fontawesome icoon op te halen
// Misschien best met de nieuwe iconen werken!!!!!!!!!!!!!!!!!
// Wel niet zeker hoe we dat op de server side moeten doen, want daar bestaan die icons niet
    let elements = svgElement.querySelectorAll(payload.selector)
    if (!elements || !elements.length) {
        throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`)
    }

    elements.forEach(function(element){
        element.textContent = payload.text
    })
}

// Set the value of a foreign (i.e. non-svg) html element.
// A value is available for the following html element types: input, textarea, select, option, button, output
function setValue(svgElement, payload) {
    _checkRequiredFields(payload, ['selector', 'value'])

    let elements = svgElement.querySelectorAll(payload.selector)
    if (!elements || !elements.length) {
        throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`)
    }

    elements.forEach(function(element) {
        // Only set the value for html element types which have a value
        if (element.value !== undefined) {
            element.value = payload.value
        }
    })
}

function setViewBox(svgElement, payload) {
    _checkRequiredFields(payload, ['viewbox'])
    _setAttribute(svgElement, 'viewbox', payload.viewbox)
}

function setAttribute(svgElement, payload) {
    _checkRequiredFields(payload, ['selector', 'attribute', 'value'])

    let elements = svgElement.querySelectorAll(payload.selector)
    if (!elements || !elements.length) {
        throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`)
    }

    elements.forEach(function(element){
        _setAttribute(element, payload.attribute, payload.value)
    })
}

function setStyleAttribute(svgElement, payload) {
    _checkRequiredFields(payload, ['selector', 'attribute', 'value'])

    let elements = svgElement.querySelectorAll(payload.selector)
    if (!elements || !elements.length) {
        throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`)
    }

    // Convert the attribute and value to an object
    let attributes = {}
    attributes[payload.attribute] = payload.value

    elements.forEach(function(element) {
        _setStyleAttributes(element, attributes)
    })
}

function removeAttribute(svgElement, payload) {
    _checkRequiredFields(payload, ['selector', 'attribute'])

    let elements = svgElement.querySelectorAll(payload.selector)
    if (!elements || !elements.length) {
        throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`)
    }

    elements.forEach(function(element){
        element.removeAttribute(payload.attribute);
    })
}

function removeStyleAttribute(svgElement, payload) {
    _checkRequiredFields(payload, ['selector', 'attribute'])

    let elements = svgElement.querySelectorAll(payload.selector)
    if (!elements || !elements.length) {
        throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`)
    }

    elements.forEach(function(element){
        // Get the existing style string (if available)
        let style = _getAttribute(element, 'style') || ''

        // Convert the (; separated) style string to an object
        let styleObject = {};
        style.split(';').forEach(function(styleAttribute) {
            let [attribute, value] = styleAttribute.split(':')
            // Ignore the specified style attribute
            if (attribute && attribute !== payload.attribute && value) {
                styleObject[attribute.trim()] = value.trim()
            }
        })

        // Convert the object to a (; separated) style string
        style = ''
        for (const [key, value] of Object.entries(styleObject)) {
            style += `${key}:${value};`
        }

        _setAttribute(element, 'style', style)
    })
}

function replaceAttribute(svgElement, payload) {
    _checkRequiredFields(payload, ['selector', 'attribute', 'regex', 'value'])

    let elements = svgElement.querySelectorAll(payload.selector)
    if (!elements || !elements.length) {
        throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`)
    }

    let regex = new RegExp(payload.regex);

    elements.forEach(function(element){
        if (element.hasAttribute(payload.attribute)) {
            let value = element.getAttribute(payload.attribute)

            // Replace the part of the string that matches the group in parentheses (...)
            value = value.replace(regex, function(match, group1) {
                return match.replace(group1, payload.value)
            })

            _setAttribute(element, payload.attribute, value)
        }
    })
}

function triggerAnimation(svgElement, payload) {
    // TODO
}

module.exports = {
    addElement,
    addEvent,
    getAttribute,
    getSvg,
    getText,
    getValue,
    removeAttribute,
    removeStyleAttribute,
    removeElement,
    removeEvent,
    replaceAttribute,
    setStyle,
    setStyleAttribute,
    setSvg,
    setText,
    setValue,
    setAttribute,
    triggerAnimation
}
