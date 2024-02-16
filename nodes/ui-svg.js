module.exports = function (RED) {
    const HTMLParser = require('node-html-parser');
    const isSvg = require('is-svg');

    function UISvgNode (config) {
        RED.nodes.createNode(this, config)

        const node = this

        // which group are we rendering this widget
        const group = RED.nodes.getNode(config.group)

        const base = group.getBase()

        // Create a virtual DOM, and load by default an empty svg
        let svgString = '<svg x="0" y="0" height="100" viewBox="0 0 100 100" width="100" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"></svg>'
        node.root = HTMLParser.parse(svgString)

        function executeCommand(msg, payloadItem, send, done) {
            let parentElements, elementId

            if(!payloadItem.command) {
                node.error(`Each array item in the payload should contain a 'command' property`, msg)
            }

            switch(payloadItem.command) {
                case 'add_element': // Add elements or replace existing elements
                    if(!payloadItem.elementType) {
                        node.error(`Command 'add_element' requires an 'elementType'`, msg)
                        return
                    }

                    if(payloadItem.parentSelector) {
                        parentElements = node.root.querySelectorAll(payloadItem.parentSelector);

                        if (!parentElements || parentElements.length == 0) {
                            node.error(`No element matches the specifed 'parentSelector' (${payloadItem.parentSelector})`, msg);
                            return;
                        }
                    }

                    if(payloadItem.selector.startsWith('#')) {
                        // Remove the leading #
                        elementId = payloadItem.selector.slice(1); 
                    }

                    if(parentElements.length > 1 && elementId) {
                        node.error(`Cannot add element (id ${elementId}) to multiple parent elements`, msg);
                        return;
                    }
                
                    // Create a new svg element (of the specified type) to every specified parent SVG element
                    parentElements.forEach(function(parentElement){
                        let newElement;

                        if(payloadItem.foreignElement == true) {
                            // Foreign elements are html elements, which don't belong to the svg namespace
                            newElement = document.createElement(payloadItem.elementType);
                        }
                        else {
                            newElement = document.createElementNS("http://www.w3.org/2000/svg", payloadItem.elementType);
                        }

                        if(elementId) {
                            newElement.setAttribute("id", elementId);
                        }

                        if(payloadItem.elementAttributes) {
                            for (const [key, value] of Object.entries(payloadItem.elementAttributes)) {
                                newElement.setAttribute(key, value);
                            }
                        }

                        if(payloadItem.elementStyleAttributes) {
                            var style = "";
                            // Convert the Javascript object to a style formatted string
                            for (const [key, value] of Object.entries(payloadItem.elementStyleAttributes)) {
                                style += key;
                                style += ":";
                                style += value;
                                style += "; ";
                            }

                            if(style.trim() !== "") {
                               newElement.setAttribute("style", style);
                            }
                        }

                        if(payloadItem.textContent) {
                            setTextContent(newElement, payloadItem.textContent);
                        }

                        // In the "Events" tabsheet might be a CSS selector that matches this new element. This means that the 
                        // new element might need to get event handlers automatically.  To make sure we ONLY apply those handlers 
                        // to this new element, we add the element to a dummy parent which only has one child (i.e. this new element).
                        //var dummyParent = document.createElement("div");
                        //dummyParent.appendChild(newElement);
                        //applyEventHandlers(dummyParent);

                        parentElement.appendChild(newElement);
                    })
                    break;

                case 'get_svg':
                    // Get the svg string (which might have been modified meanwhile via input messages)
                    // TODO dit klopt niet want wat als we verschillende commands hebben...
                    msg.payload = node.root.toString()
                    send(msg)
                    break

                case 'replace_svg':
                    let payload = msg.payload

                    if(!isSvg(payload)) {
                        node.error("The payload contains no svg format", msg)
                        return;
                    }
                    
                    // The svg can be injected as string or buffer.
                    if(Buffer.isBuffer(payload)) {
                        payload = payload.toString() // Default UTF8
                    }

                    if(!node.root.valid(payload)) {
                        node.error("The payload contains an invalid svg", msg)
                        return;
                    }

                    node.root.set_content(msg.payload)
                    break
            }
        }

        // server-side event handlers
        const evts = {
            onAction: true,
            onInput: function (msg, send, done) {
                if(!Array.isArray(msg.payload)) {
                    node.error("The payload contains no array")
                }

                msg.payload.forEach(function(item) {
                    executeCommand(item, send, done)
                }); 

                // store the latest value in our Node-RED datastore
                //base.stores.data.save(node.id, msg)
                // send it to any connected nodes in Node-RED
                
            },
            onSocket: {

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
