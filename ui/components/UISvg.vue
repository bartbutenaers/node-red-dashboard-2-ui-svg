<template>
    <div className="ui-svg-wrapper">
        <i ref="mdi_icon_placeholder" v-show="false"/>
        <svg ref="svg_drawing" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <!-- SVG content goes here -->
        </svg>
    </div>
</template>

<script>
import { markRaw } from 'vue'
import { mapState } from 'vuex'
import * as svgUtils from '../../nodes/svg_utils.js'

export default {
    name: 'UISvg',
    inject: ['$socket'],
    props: {
        /* do not remove entries from this - Dashboard's Layout Manager's will pass this data to your component */
        id: { type: String, required: true },
        props: { type: Object, default: () => ({}) },
        state: { type: Object, default: () => ({ enabled: false, visible: false }) }
    },
    setup (props) {
        console.info('UISvg setup with:', props)
        console.debug('Vue function loaded correctly', markRaw)
    },
    data () {
        return {
            input: {
                title: 'some text here will base turned into title case.'
            },
            vuetifyStyles: [
                { label: 'Responsive Displays', url: 'https://vuetifyjs.com/en/styles/display/#display' },
                { label: 'Flex', url: 'https://vuetifyjs.com/en/styles/flex/' },
                { label: 'Spacing', url: 'https://vuetifyjs.com/en/styles/spacing/#how-it-works' },
                { label: 'Text & Typography', url: 'https://vuetifyjs.com/en/styles/text-and-typography/#typography' }
            ]
        }
    },
    computed: {
        titleCase () {
            return toTitleCase(this.input.title)
        },
        ...mapState('data', ['messages'])
    },
    mounted () {
        this.$socket.on('widget-load:' + this.id, (msg) => {
            // load the latest message from the Node-RED datastore when this widget is loaded
            // storing it in our vuex store so that we have it saved as we navigate around
            this.$store.commit('data/bind', {
                widgetId: this.id,
                msg
            })
        })

        // The width and height of the svg are set to 100%, to make sure the svg fills the available space in the 
        // parent container.  However the viewbox dimensions are in px (not %), so when the parent container
        // resizes, the viewbox need to be resized also.
        // TODO we should keep the original width and height in px and the original viewbox, and adjust the
        // viewbox based on all that data.  Because now the viewbox will be adjusted here always to show the
        // entire svg, which isn't always what we want.
        this.$refs.svg_drawing.addEventListener('resize', (evt) => {
            // TODO test
            let svgElement = this.$refs.svg_drawing
            let bbox = svgElement.getBBox()
            let viewbox = [bbox.x, bbox.y, bbox.width, bbox.height].join(' ')
            svgElement.setAttribute('viewBox', viewbox)
        })

        this.$socket.on('msg-input:' + this.id, (msg) => {
            let animationElements

            const mdiIcon = (iconName) => {
                let mdiIconPlaceholder = this.$refs.mdi_icon_placeholder
                mdiIconPlaceholder.className = 'mdi ' + iconName
                // See https://stackoverflow.com/questions/69020009/material-design-icon-mdi-inside-svg-graphic
                const styles = window.getComputedStyle(mdiIconPlaceholder, ':before')
                return styles.content.replaceAll('"', "")
            }

            // store the latest message in our client-side vuex store when we receive a new message
            this.$store.commit('data/bind', {
                widgetId: this.id,
                msg
            })

            if (!Array.isArray(msg.payload)) {
                node.error('The payload contains no array')
            }

            // Get a (scoped) reference to the svg tag, i.e. the tag of this particular svg-ui node
            let svgElement = this.$refs.svg_drawing

            msg.payload.forEach((payloadItem) => {
                if (!payloadItem.command) {
                    throw new Error('Each array item in the payload should contain a "command" property')
                }
debugger
                // TODO check if document is required as parameter
                // TODO perhaps catch the errors and show an alert box.  Annoying user experience?  Now users need to look for errors in the console log...
                switch(payloadItem.command) {
                    case 'add_element':
                        // Resolve all the material design icons, specified as {{mdi-xxx}}
                        if (payloadItem.text) {
                            payloadItem.text = payloadItem.text.replace(/\{\{\s*(mdi-.+?)\s*\}\}/g, function(match, iconName) {
                                return mdiIcon(iconName)
                            })
                        }
                        svgUtils.addElement(document, svgElement, payloadItem)
                        break
                    case 'add_event':
                        svgUtils.addEvent(svgElement, payloadItem, this.handleEvent)
                        break
                    case 'remove_element':
                        svgUtils.removeElement(svgElement, payloadItem)
                        break
                    case 'remove_event':
                        svgUtils.removeEvent(svgElement, payloadItem)
                        break
                    case 'set_style':
                        svgUtils.setStyle(svgElement, payloadItem)
                        break
                    case 'set_style_attribute':
                        svgUtils.setStyleAttribute(svgElement, payloadItem)
                        break
                    case 'set_svg':
                        // Pass a dom parser from the browser to the library
                        let domParser = new DOMParser()

                        // When parsing the svg string, a new document is created (not related to the current document of this page)
                        let newDocument = svgUtils.setSvg(domParser, payloadItem)

                        let newSvgElement = newDocument.querySelector('svg')

                        // Import the new svg node into the current document
                        let importedNode = document.importNode(newSvgElement, true)

                        // We cannot simply replace the old svg element node by the new one, because VueJs keeps a reference
                        // to the old element.  Therefore copy all relevant attributes from the new element to the old one. 
                        svgElement.removeAttribute('viewBox')
                        let newViewBox = newSvgElement.getAttribute('viewBox')
                        if (newViewBox) {
                            svgElement.setAttribute('viewBox', newViewBox)
                        }

                        // Also remove all children from the old element and copy the children from the new element to the old one
                        while (svgElement.firstChild) {
                            svgElement.removeChild(svgElement.firstChild)
                        }
                        while (importedNode.firstChild) {
                            svgElement.appendChild(importedNode.firstChild)
                        }

                        // Since the imported node is not appended yet to any element in the current document, it is not really
                        // part of the document.  It only lives in memory, so no need to remove it from the document.  The
                        // garbage collector will take care of that already
                        importedNode = null
                        break
                    case 'set_text':
                        svgUtils.setText(svgElement, payloadItem)
                        break
                    case 'set_value':
                        svgUtils.setValue(svgElement, payloadItem)
                        break
                    case 'set_viewbox':
                        svgUtils.setViewbox(svgElement, payloadItem)
                        break
                    case 'set_attribute':
                        svgUtils.setAttribute(svgElement, payloadItem)
                        break
                    case 'start_animation':
                        animationElements = svgElement.querySelectorAll(payloadItem.selector)
                        if (!animationElements || !animationElements.length) {
                            throw new Error(`No animation elements found for the specified 'selector' (${payloadItem.selector})`)
                        }

                        animationElements.forEach(function(animationElement){
                            animationElement.beginElement()
                        })
                        break
                    case 'stop_animation':
                        animationElements = svgElement.querySelectorAll(payloadItem.selector)
                        if (!animationElements || !animationElements.length) {
                            throw new Error(`No animation elements found for the specified 'selector' (${payloadItem.selector})`)
                        }

                        animationElements.forEach(function(animationElement){
                            animationElement.endElement()
                        })
                        break
                    case 'remove_attribute':
                        svgUtils.removeAttribute(svgElement, payloadItem)
                        break
                    case 'remove_style_attribute':
                        svgUtils.removeStyleAttribute(svgElement, payloadItem)
                        break
                    case 'replace_attribute':
                        svgUtils.replaceAttribute(svgElement, payloadItem)
                        break
                    case 'trigger_animation':
                        svgUtils.triggerAnimation(svgElement, payloadItem)
                        break
                    default:
                        throw new Error('Unknown command')
                }
            })
        })

        // tell Node-RED that we're loading a new instance of this widget
        this.$socket.emit('widget-load', this.id)
    },
    unmounted () {
        /* Make sure, any events you subscribe to on SocketIO are unsubscribed to here */
        this.$socket?.off('widget-load:' + this.id)
        this.$socket?.off('msg-input:' + this.id)
    },
    methods: {
        /*
            widget-action just sends a msg to Node-RED, it does not store the msg state server-side
            alternatively, you can use widget-change, which will also store the msg in the Node's datastore
        */
        send (msg) {
            this.$socket.emit('widget-action', this.id, msg)
        },
        alert (text) {
            alert(text)
        },
        handleEvent(evt, proceedWithoutTimer) {
            // The browser will call this function with only an 'evt' argument (i.e. proceedWithoutTimer is null).
            // When proceedWithoutTimer is true, that means that this function has already been called previously.
            if (!proceedWithoutTimer) {
                // Avoid that the default browser context menu pops up, in case an event handler has been specfied in this node.
                // See https://github.com/bartbutenaers/node-red-contrib-ui-svg/pull/93#issue-855852128
                evt.preventDefault()
                evt.stopPropagation()
            }

            // Get the SVG element for which the event has occured (e.g. which has been clicked).
            // When an event handler is applied to a group, that event handler will be available on all sub-elements of that group.
            // For example for a group click event, the event handler will be called when any sub-element of that group is being clicked.
            // The event will bubble from that sub-element, up through the DOM tree until the group element is reached.
            // As soon as the group element is reached, this event handler will called with following evt parameter values:
            // - evt.target: refers to the sub-element that received the event.
            // - evt.currentTarget: refers to the group element to which the event handler has been attached.
            // The data-event_xxx attributes will be available in the group element, because the event handler has been applied to that group element.
            // That means that evt.currentTarget needs to be used here!!  See https://github.com/bartbutenaers/node-red-contrib-ui-svg/issues/97
            // TODO  in de oude node was dit om een of andere reden  $(evt.currentTarget)[0]
            let element = evt.currentTarget

            if (!element) {
                throw new Error(`No svg element has been found for event ${evt.type}`)
            }

            // When a shape has both a single-click and a double-click event handler, a double click will result in in 2 single click events
            // followed by a double click event.  See https://discourse.nodered.org/t/node-red-contrib-ui-svg-click-and-dblclick-in-same-element/50203/6
            // To prevent the single-clicks from occuring in this case, a timer of 400 msec will be started.
            // If more than 1 click event occurs during that interval, it is considered as a double click.  So the single clicks will be ignored.
            if (evt.type == 'click' && !proceedWithoutTimer) {
                // This is only required if a double click handler has been registered, because otherwise all click events would be (unnecessary) delayed
                if (element.hasAttribute("data-event_dblclick")) {
                    if (clickTimer && clickTimerTarget != evt.target) {
                        clickCount = 0
                        clearTimeout(clickTimer)
                        clickTimerTarget = null
                        clickTimer = null
                    }

                    clickCount++

                    let currentTarget = evt.currentTarget

                    if (!clickTimer) {
                        clickTimerTarget = evt.target
                        clickTimer = setTimeout(function() {
                            if (clickCount < 2) {
                                 // The event.currentTarget will only be available during the event handling, and will become null afterwards
                                // (see https://stackoverflow.com/a/66086044).  So let's restore it here...
                                // Since currentTarget is a readonly property, it needs to be overwritten via following trick:
                                Object.defineProperty(evt, 'currentTarget', {writable: false, value: currentTarget})

                                handleEvent(evt, true)
                            }

                            clickCount = 0
                            clearTimeout($scope.clickTimer)
                            clickTimerTarget = null
                            clickTimer = null
                        }, 400)
                    }

                    return
                }
            }

            let userData = element.getAttribute(`data-event_${evt.type}`)

            if (!userData) {
                throw new Error(`No user data available for this ${evt.type} event`)
            }

            // The user data will contain following properties: elementId, selector, event and message
            userData = JSON.parse(userData)

            // Start from the message specified in the user data (as originally specified in the addEvent function)
            let msg = userData.message

            // Enrich that message with some event related data
            msg.event = {
                element_id: userData.elementId,
                type: evt.type
            }

            if (evt.type === "change") {
                // Get the new value from the target element
                if (event.target.type === "number") {
                    msg.event.value = event.target.valueAsNumber
                }
                else {
                    msg.event.value = event.target.value
                }
            }
            else {
                if (evt.changedTouches) {
                    // For touch events, the coordinates are stored inside the changedTouches field
                    // - touchstart event: list of the touch points that became active with this event (fingers started touching the surface).
                    // - touchmove event: list of the touch points that have changed since the last event.
                    // - touchend event: list of the touch points that have been removed from the surface (fingers no longer touching the surface).
                    let touchEvent = evt.changedTouches[0]

                    msg.event.pageX   = Math.trunc(touchEvent.pageX)
                    msg.event.pageY   = Math.trunc(touchEvent.pageY)
                    msg.event.screenX = Math.trunc(touchEvent.screenX)
                    msg.event.screenY = Math.trunc(touchEvent.screenY)
                    msg.event.clientX = Math.trunc(touchEvent.clientX)
                    msg.event.clientY = Math.trunc(touchEvent.clientY)
                }
                else {
                    msg.event.pageX   = Math.trunc(evt.pageX)
                    msg.event.pageY   = Math.trunc(evt.pageY)
                    msg.event.screenX = Math.trunc(evt.screenX)
                    msg.event.screenY = Math.trunc(evt.screenY)
                    msg.event.clientX = Math.trunc(evt.clientX)
                    msg.event.clientY = Math.trunc(evt.clientY)
                }

                // Get the mouse coordinates, with origin at left top of the SVG drawing
                if (msg.event.pageX !== undefined && msg.event.pageY !== undefined){
                    // Get the root SVG element (by traversal upwards through the svg dom)
                    let rootSvgElement = element.ownerSVGElement

                    // TODO description
                    let point = rootSvgElement.createSVGPoint();
                    point.x = msg.event.pageX
                    point.y = msg.event.pageY
                    point = point.matrixTransform(rootSvgElement.getScreenCTM().inverse())

                    msg.event.svgX = Math.trunc(point.x)
                    msg.event.svgY = Math.trunc(point.y)

                    // Get the SVG element where the event has occured (e.g. which has been clicked)
                    // TODO in the old svg node this was $(evt.target)[0]
                    let svgElement = evt.target

                    if (!svgElement) {
                        throw new Error(`No SVG element has been found for this ${evt.type} event`)
                    }

                    try {
                        // Use getBoundingClientRect instead of getBBox to have an array like [left, bottom, right, top].
                        // See https://discourse.nodered.org/t/contextmenu-location/22780/64?u=bartbutenaers
                        let bbox = svgElement.getBoundingClientRect()

                        msg.event.bbox = [
                            Math.trunc(bbox.left),
                            Math.trunc(bbox.bottom),
                            Math.trunc(bbox.right),
                            Math.trunc(bbox.top)
                        ]
                    }
                    catch(err) {
                        throw new Error(`No bounding client rect has been found for this ${evt.type} event`)
                    }
                }
            }

            this.send(msg);
        }
    }
}
</script>

<style scoped>
/* CSS is auto scoped, but using named classes is still recommended */
.ui-svg-wrapper {
    width: 100%;
    height: 100%;
    padding: 10px;
    margin: 10px;
    border: 1px solid black;
}
</style>
