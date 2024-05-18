module.exports = function (RED) {
    const svgUtils = require('./svg_utils.js')
    // Optionally have a look at https://github.com/taoqf/node-html-parser
    const { DOMParser, parseHTML } = require('linkedom')

    const ALLOWED_EVENTS = ["click", "dblclick", "change", "contextmenu", "mouseover", "mouseout", "mouseup", "mousedown", "focus", "focusin", "focusout", "blur", "keyup", "keydown", "touchstart", "touchend", "change"]

    // Load the svglint library dynamicall, since it is an ES module (instead of a CommonJs library)
    let SVGLint
    import('svglint').then(module => {
        SVGLint = module.default
    }).catch(error => {
        console.error(`Cannot import the svglint npm package dynamically: ${error}`)
    })

    // Load the diff-dom library dynamicall, since it is an ES module (instead of a CommonJs library)
    let diffDOM
    import('diff-dom').then(module => {
        diffDOM = module.default
    }).catch(error => {
        console.error(`Cannot import diff-dom npm package dynamically: ${error}`)
    })

    function UISvgNode (config) {
        RED.nodes.createNode(this, config)

        const node = this

        node.config = config

        // which group are we rendering this widget
        const group = RED.nodes.getNode(config.group)

        const base = group.getBase()

        let lastReceivedSvgString = node.context().get('last-received-svg-string', config.contextStore)
        if (!lastReceivedSvgString) {
            // Start with an empty svg
            lastReceivedSvgString =  '<svg x="0" y="0" height="100" viewBox="0 0 100 100" width="100" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"></svg>'
            node.context().set('last-received-svg-string', lastReceivedSvgString, config.contextStore)
        }

        let enhancedSvgString = node.context().get('enhanced-svg-string', config.contextStore)
        if (!enhancedSvgString) {
            enhancedSvgString = lastReceivedSvgString
            // Start with the last received svg (without enhancements)
            node.context().set('enhanced-svg-string', enhancedSvgString, config.contextStore)
        }

        // TODO use the setSvg function from the utils?
        node.domParser = new DOMParser()
        node.enhancedDocument = node.domParser.parseFromString(enhancedSvgString, 'image/svg+xml')

        async function validateSvgString(svgString) {
            try {
                // The svglint library is aynchronous, but we will need to call it synchronous.
                // Otherwise we are not able to manipulate the msg, before it is being emitted to the frontend.
                const config = {}
                const linting = await SVGLint.lintSource(svgString, config)
                return new Promise((resolve, reject) => {
                    linting.on('done', () => {
                        // Return whether the svg is valid or not
                        resolve(linting.valid)
                    })
                })
            } catch (error) {
                console.error(error)
            }
        }

        function checkRequiredFields(payload, fields) {
            fields.forEach(function(field) {
                if (!(field in payload)) {
                    throw new Error(`Command '${payloadItem.command}' requires a '${field}' field`)
                }
            })
        }

        // Calculate the difference between the last received svg string, and the enhanced svg string
        function calculateDelta() {
            let lastReceivedSvgString = node.context().get('last-received-svg-string', node.config.contextStore)

            // TODO same code as above, so creat function
            // Convert the last received svg string to an object for comparision
            let lastReceivedSvgStringObj = diffDOM.stringToObj(lastReceivedSvgString)

            // Convert the enhanced svg document to an object for comparison
            let enhancedSvgObj = diffDOM.nodeToObj(node.enhancedDocument.querySelector('svg'))

            node.dd = new diffDOM.DiffDOM({
                // Unlike a browser, in a NodeJs environment there is no document available.
                // Therefore pass the LinkeDom document, to avoid that DiffDom returns following
                // error (when applying a delta to an svg element):
                // "TypeError: options.document.createElement is not a function"
                document: node.enhancedDocument
            })

            let delta = node.dd.diff(lastReceivedSvgStringObj, enhancedSvgObj)

            return delta
        }

        const evts = {
            onAction: true,
            onInput: async function (msg, send, done) {
                if (!Array.isArray(msg.payload)) {
                    node.error(`The payload contains no array`)
                    return
                }

                // Let's try to execute all commands in the message as 1 transaction.
                // If 1 one of those commands fails, all updates (from all commands) needs to be reverted.
                try {
                    for (let payloadItem of msg.payload) {
                        let elements, values, valid

                        // Some commands result in an output msg being send.  These msg will be send independent whether 
                        // other commands fail or not, because these 'get_xxx' commands don't enhance the virtual DOM
                        // (during the transaction) anyway.  But instead from starting a command from scratch, it is
                        // better to override the payload of the original input msg.  But since an input msg can contain
                        // multiple commands, the input msg needs to be cloned before being send...
                        let msg_cloned

                        // Some commands can update the last received svg string.
                        // Note that if an input msg contains multiple commands to change the last received svg string,
                        // then only the last of those svg strings will be stored.  
                        let lastReceivedSvgString

                        if (!payloadItem.command) {
                            throw new Error(`Each array item in the payload should contain a 'command' property`)
                        }

                        let svgElement = node.enhancedDocument.querySelector('svg')

                        switch(payloadItem.command) {
                            case 'add_element': // Add elements or replace existing elements
                                checkRequiredFields(payloadItem, ['type'])
                                svgUtils.addElement(node.enhancedDocument, svgElement, payloadItem)
                                break
                            case 'add_event':
                                // TODO: if js events are imported, we could introduce a 'javascript' property which contains
                                // the code to be executed in the handleEvent.
                                checkRequiredFields(payloadItem, ['selector', 'message', 'event'])

                                if (!ALLOWED_EVENTS.includes(payloadItem.event)) {
                                    throw new Error(`The specified 'event' is not supported`)
                                }

                                // TODO check whether a callback handler needs to be passed instead of null
                                svgUtils.addEvent(svgElement, payloadItem, null)
                                break
                            case 'get_attribute':
                                checkRequiredFields(payloadItem, ['selector', 'attribute'])

                                elements = svgElement.querySelectorAll(payloadItem.selector)
                                if (!elements || !elements.length) {
                                    throw new Error(`No svg elements found for the specified 'selector' (${payloadItem.selector})`)
                                }

                                values = []
                                elements.forEach(function(element) {
                                    let value = svgUtils.getAttribute(element, payloadItem.attribute)
                                    values.push(value)
                                })

                                let attributeValue
                                if (values.length === 1) {
                                    attributeValue = values[0]
                                }
                                else {
                                    attributeValue = values
                                }

                                msg_cloned = RED.util.cloneMessage(msg)
                                msg_cloned.payload = attributeValue
                                node.send(msg_cloned)
                                break
                            case 'get_delta':
                                msg_cloned = RED.util.cloneMessage(msg)
                                msg_cloned.payload = calculateDelta()
                                node.send(msg_cloned)
                                break
                            case 'get_svg':
                                // Note: this function is only required in the server side
                                // Get the svg string (which might have been modified meanwhile via input messages)
                                // TODO dit klopt niet want wat als we verschillende commands hebben...
                                msg_cloned = RED.util.cloneMessage(msg)
                                msg_cloned.payload = svgElement.toString()
                                node.send(msg_cloned)
                                break
                            case 'get_text':
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
                                checkRequiredFields(payloadItem, ['selector'])

                                elements = svgElement.querySelectorAll(payloadItem.selector)
                                if (!elements || !elements.length) {
                                    throw new Error(`No svg elements found for the specified 'selector' (${payloadItem.selector})`)
                                }

                                let textContents = []
                                elements.forEach(function(element){
                                    textContents.push(element.textContent)
                                })

                                let textContent
                                if (textContents.length == 1) {
                                    textContent = textContents[0]
                                }
                                else {
                                    textContent = textContents
                                }

                                msg_cloned = RED.util.cloneMessage(msg)
                                msg_cloned.payload = textContent
                                node.send(msg_cloned)
                                break
                            case 'get_value':
                                // Get the value from a foreign (i.e. non-svg) html element.
                                // A value is available for the following html element types: input, textarea, select, option, button, output
                                checkRequiredFields(payloadItem, ['selector'])

                                elements = svgElement.querySelectorAll(payloadItem.selector)
                                if (!elements || !elements.length) {
                                    throw new Error(`No svg elements found for the specified 'selector' (${payloadItem.selector})`)
                                }

                                values = []
                                elements.forEach(function(element) {
                                    // Only set the value for html element types which have a value
                                    if (element.value !== undefined) {
                                        values.push(element.value)
                                    }
                                })

                                let foreignElementValue
                                if (values.length == 1) {
                                    foreignElementValue = values[0]
                                }
                                else {
                                    foreignElementValue = values
                                }

                                msg_cloned = RED.util.cloneMessage(msg)
                                msg_cloned.payload = foreignElementValue
                                node.send(msg_cloned)
                                break
                            case 'set_svg':
                                checkRequiredFields(payloadItem, ['svg'])

                                // The svg can be injected as string or buffer.
                                // Note: Buffer is only known on the NodeJs server side, not inside the lib in the browser
                                if (Buffer.isBuffer(payloadItem.svg)) {
                                    payloadItem.svg = payloadItem.svg.toString() // Default UTF8
                                }

                                valid = await validateSvgString(payloadItem.svg)
                                if (!valid) {
                                    throw new Error(`Invalid svg string`)
                                }

                                // Replace the old document (containing the old svg) by the new one in the virtual DOM
                                node.enhancedDocument = svgUtils.setSvg(node.domParser, payloadItem)

                                // Temporarily store the newly received svg (without the delta applied)
                                lastReceivedSvgString = payloadItem.svg
                                break
                            case 'remove_element':
                                checkRequiredFields(payloadItem, ['selector'])
                                svgUtils.removeElement(svgElement, payloadItem)
                                break
                            case 'remove_event':
                                checkRequiredFields(payloadItem, ['selector', 'event'])
                                svgUtils.removeEvent(svgElement, payloadItem)
                                break
                            case 'set_style':
                                checkRequiredFields(payloadItem, ['selector', 'style'])
                                svgUtils.setStyle(svgElement, payloadItem)
                                break
                            case 'set_style_attribute':
                                checkRequiredFields(payloadItem, ['selector', 'attribute', 'value'])
                                svgUtils.setStyleAttribute(svgElement, payloadItem)
                                break
                            case 'set_svg':
                                checkRequiredFields(payloadItem, ['svg'])
                                svgUtils.setSvg(svgElement, payloadItem)
                                break
                            case 'set_text':
                                checkRequiredFields(payloadItem, ['selector', 'text'])
                                svgUtils.setText(svgElement, payloadItem)
                                break
                            case 'set_value':
                                checkRequiredFields(payloadItem, ['selector', 'value'])
                                svgUtils.setValue(svgElement, payloadItem)
                                break
                            case 'set_viewbox':
                                checkRequiredFields(payloadItem, ['viewbox'])
                                svgUtils.setViewbox(svgElement, payloadItem)
                                break
                            case 'set_attribute':
                                checkRequiredFields(payloadItem, ['selector', 'attribute', 'value'])
                                svgUtils.setAttribute(svgElement, payloadItem)
                                break
                            case 'remove_attribute':
                                checkRequiredFields(payloadItem, ['selector', 'attribute'])
                                svgUtils.removeAttribute(svgElement, payloadItem)
                                break
                            case 'remove_style_attribute':
                                checkRequiredFields(payloadItem, ['selector', 'attribute'])
                                svgUtils.removeStyleAttribute(svgElement, payloadItem)
                                break
                            case 'replace_attribute':
                                checkRequiredFields(payloadItem, ['selector', 'attribute', 'regex', 'value'])
                                svgUtils.replaceAttribute(svgElement, payloadItem)
                                break
                            case 'trigger_animation':
                                svgUtils.triggerAnimation(svgElement, payloadItem)
                                break
                            case 'update_svg':
                                checkRequiredFields(payloadItem, ['svg'])

                                // The svg can be injected as string or buffer.
                                // Note: Buffer is only known on the NodeJs server side, not inside the lib in the browser
                                if (Buffer.isBuffer(payloadItem.svg)) {
                                    payloadItem.svg = payloadItem.svg.toString() // Default UTF8
                                }

                                valid = await validateSvgString(payloadItem.svg)
                                if (!valid) {
                                    throw new Error(`Invalid svg string`)
                                }

                                // Calculate the delta between the last injected svg and the current enhanced svg
                                let delta = calculateDelta()

                                // Replace the old document (containing the old svg) by the new one in the virtual DOM
                                node.enhancedDocument = svgUtils.setSvg(node.domParser, payloadItem)
                                let newSvgElement = node.enhancedDocument.querySelector('svg')

                                // Apply the delta to the new svg element
                                node.dd.apply(newSvgElement, delta)

                                // Temporarily store the last received svg (with the delta applied)
                                lastReceivedSvgString = node.enhancedDocument.querySelector('svg').toString()

                                // Instead of calculating the delta again on all the clients, the enhanced svg string (containing
                                // the delta) will be send to the clients and set over there
                                payloadItem.command = 'set_svg'
                                payloadItem.svg = lastReceivedSvgString
                                break

                            default:
                                throw new Error(`Unsupported command '${payloadItem.command}'`)
                        }
                    }

                    // All commands have been executed without exception, so let's store the enhanced virtual DOM into the node contet.
                    // TODO: for performance, only do this when the commands have really enhanced the svg.
                    let enhancedSvgString = node.enhancedDocument.querySelector('svg').toString()
                    node.context().set('enhanced-svg-string', enhancedSvgString, config.contextStore)

                    // All commands have been executed without exception, so (when a new svg string has been received temporily)
                    // store it permanent in the node context.
                    if (lastReceivedSvgString) {
                        node.context().set('last-received-svg-string', lastReceivedSvgString, config.contextStore)
                    }
                }
                catch(err) {
                    node.error(err, msg)

                    // One of the commands has failed, so the virtual DOM might have been enhanced partially.
                    // Replace the enhanced document by the original enhanced svg string (which is still stored in the node context).
                    let originalLastSvgString = node.context().get('last-received-svg-string', config.contextStore)
                    let restorePayloadItem = {
                       svg: originalLastSvgString
                    }
                    node.enhancedDocument = svgUtils.setSvg(node.domParser, restorePayloadItem)

                    // Make sure the message is not processed by the frontend 
                    // TODO check whether it can be stopped from being sended to the frontend
                    msg = {}
                }

                // store the latest value in our Node-RED datastore
                //base.stores.data.save(node.id, msg)
                // send it to any connected nodes in Node-RED
            }
        }

        // inform the dashboard UI that we are adding this node
        if (group) {
            group.register(node, config, evts)
        } else {
            node.error('No group configured')
        }
    }

    RED.nodes.registerType('ui-svg', UISvgNode)
}
