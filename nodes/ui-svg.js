module.exports = function (RED) {
    const svgUtils = require('./svg_utils.js')
    // Optionally have a look at https://github.com/taoqf/node-html-parser
    const { DOMParser, parseHTML } = require('linkedom')

    // Load the svglint library dynamicall, since it is an ES module (instead of a CommonJs library)
    let SVGLint
    import('svglint').then(module => {
        SVGLint = module.default
    }).catch(error => {
        console.error("Cannot import svglint dynamically:", error)
    })

    // Load the diff-dom library dynamicall, since it is an ES module (instead of a CommonJs library)
    let diffDOM
    import('diff-dom').then(module => {
        diffDOM = module.default
    }).catch(error => {
        console.error("Cannot import diff-dom dynamically:", error)
    })

    function UISvgNode (config) {
        RED.nodes.createNode(this, config)

        const node = this

        // which group are we rendering this widget
        const group = RED.nodes.getNode(config.group)

        const base = group.getBase()

        // Load an empty SVG drawing into the virtual DOM
        let emptySvg = '<svg x="0" y="0" height="100" viewBox="0 0 100 100" width="100" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"></svg>'

        // TODO use the setSvg function from the utils?
	node.domParser = new DOMParser()

        node.document = node.domParser.parseFromString(emptySvg, 'image/svg+xml')
        node.svgElement = node.document.querySelector('svg')

        // server-side event handlers
        const evts = {
            onAction: true,
            onInput: function (msg, send, done) {
                if (!Array.isArray(msg.payload)) {
                    node.error(`The payload contains no array`)
                    return
                }

                msg.payload.forEach(payloadItem => {
                    let msg_cloned

                    try {
                        if (!payloadItem.command) {
                            throw new Error(`Each array item in the payload should contain a 'command' property`)
                        }

                        switch(payloadItem.command) {
                            case 'add_element': // Add elements or replace existing elements
                                svgUtils.addElement(node.document, node.svgElement, payloadItem)
                                break
                            case 'add_event':
                                // TODO check whether a callback handler needs to be passed instead of null
                                svgUtils.addEvent(node.svgElement, payloadItem, null)
                                break
                            case 'get_attribute':
                                msg_cloned = RED.util.cloneMessage(msg)
                                msg_cloned.payload = svgUtils.getAttribute(node.svgElement, payloadItem)
                                node.send(msg_cloned)
                                break
                            case 'get_delta':
                                // TODO initialize once 
                                dd = new diffDOM.DiffDOM()


                                nodeToObj(node.
diff = dd.diff(elementA, elementB)
                                break
                            case 'get_svg':
                                msg_cloned = RED.util.cloneMessage(msg)
                                msg_cloned.payload = svgUtils.getSvg(node.svgElement, payloadItem)
                                node.send(msg_cloned)
                                break
                            case 'get_text':
                                msg_cloned = RED.util.cloneMessage(msg)
                                msg_cloned.payload = svgUtils.getText(node.svgElement, payloadItem)
                                node.send(msg_cloned)
                                break
                            case 'get_value':
                                msg_cloned = RED.util.cloneMessage(msg)
                                msg_cloned.payload = svgUtils.getValue(node.svgElement, payloadItem)
                                node.send(msg_cloned)
                                break
                            case 'set_svg':
                                // Repeat the check from the svgUtils here again, because otherwise the linter could run into problems
                                if (!payloadItem.svg) {
                                    throw new Error(`Command '${payload.command}' requires a 'svg' field`)
                                }

                                // The svg can be injected as string or buffer.
                                // Note: Buffer is only known on the NodeJs server side, not inside the lib in the browser
                                if (Buffer.isBuffer(payloadItem.svg)) {
                                    payloadItem.svg = payloadItem.svg.toString() // Default UTF8
                                }

                                SVGLint.lintSource(payloadItem.svg, {
                                   // TODO ... config goes here
                                }).then(linting => {
                                    linting.on('done', () => {
                                        if (linting.valid) {
                                            try {
                                                // Replace the old document (containing the old svg) by the new one
                                                node.document = svgUtils.setSvg(node.domParser, payloadItem)
                                                // Replace the old svg element by the new one
                                                node.svgElement = node.document.querySelector('svg')
                                            } catch(err) {
                                                // Avoid Node-RED crashing due to an exception in a sub process
                                                node.error(err)
                                            }
                                        }
                                        else {
                                           throw new Error(`Invalid svg string`)
                                        }
                                    })
                                }).catch(error => {
                                    throw new Error(`Error linting SVG: ${error}`)
                                })
                                break
                            case 'remove_element':
                                svgUtils.removeElement(node.svgElement, payloadItem)
                                break
                            case 'remove_event':
                                svgUtils.removeEvent(node.svgElement, payloadItem)
                                break
                            case 'set_style':
                                svgUtils.setStyle(node.svgElement, payloadItem)
                                break
                            case 'set_style_attribute':
                                svgUtils.setStyleAttribute(node.svgElement, payloadItem)
                                break
                            case 'set_svg':
                                svgUtils.setSvg(node.svgElement, payloadItem)
                                break
                            case 'set_text':
                                svgUtils.setText(node.svgElement, payloadItem)
                                break
                            case 'set_value':
                                svgUtils.setValue(node.svgElement, payloadItem)
                                break
                            case 'set_viewbox':
                                svgUtils.setViewbox(node.svgElement, payloadItem)
                                break
                            case 'set_attribute':
                                svgUtils.setAttribute(node.svgElement, payloadItem)
                                break
                            case 'remove_attribute':
                                svgUtils.removeAttribute(node.svgElement, payloadItem)
                                break
                            case 'remove_style_attribute':
                                svgUtils.removeStyleAttribute(node.svgElement, payloadItem)
                                break
                            case 'replace_attribute':
                                svgUtils.replaceAttribute(node.svgElement, payloadItem)
                                break
                            case 'trigger_animation':
                                svgUtils.triggerAnimation(node.svgElement, payloadItem)
                                break
                            default:
                                throw new Error(`Unsupported command '${payloadItem.command}'`)
                        }
                    }
                    catch(err) {
                        node.error(err, msg)
                    }
                })

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
