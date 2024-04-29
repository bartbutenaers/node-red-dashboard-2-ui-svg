# @bartbutenaers/node-red-dashboard-2-ui-svg

A Node-RED ui node for Dashboard D2, to display a 2-way interactive drawing with scalable vector graphics (SVG).

## Installation

Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install @bartbutenaers/node-red-dashboard-2-ui-svg
```

## Support my Node-RED developments

Please buy my wife a coffee to keep her happy, while I am busy developing Node-RED stuff for you ...

<a href="https://www.buymeacoffee.com/bartbutenaers" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy my wife a coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

## Status of this project

This repository contains an early alpha version.  It still lacks MANY features from the [old svg node], which I had developed at the time being for the old AngularJs Node-RED dashboard (which is end of life).

This new node won't look in any way to the old svg node.  I understand that people would like to have a simple replacement for their old svg node inside the new dashboard D2.  But that won't be the case for many reasons:

1. Severe lack of free time.  Remember that I am not a software company...
2. VueJs (combined with Vite builds) is a complete different technology compared to AngularJs.
3. Lots of features have sneaked in the old ui node, which I regretted afterwards that I have agreed to implement.  They didn't fit into the overal design, and gave me a lot of maintainance issues afterwards.
4. The old svg node has grown organically over the years to become a little monster.  Some parts should be separated into separate nodes, like e.g. the ability to open the svg in a drawing editor.
5. Replacement of the DrawSvg editor by another one offers layers, for example SVG-Edit.
6.  In the old nodes there were a lot of issues from users that tried to implement workarounds for the lack of a server-side state.  But all these implementations had their own disadvantages.  Hopefully I can solve this kind of troubles by keeping a server-side virtual DOM tree in sync with the DOM trees in the browsers.
7.  Server-side management of animations, to avoid that new clients don't receive active animations.
8.  Cleanup of input/output message formats, to make things (hopefully) easier to get started with.

Most of this still needs to be implemented, so there is no point yet to start registering issues.  And due to the lack of free time, there is also no roadmap or ETA.  Also take into account that at this moment there will be most probably breaking changes, and no backwards compatibility will be added!

Of course contributions are very welcome!  Just make sure to discuss it in advance (by opening an issue), because - as explained above - the new node will ***not*** be a modern lookalike of the old node.  

## Node usage

The SVG drawing is interactive in two ways:
+ Input messages can be injected into the node, to change the shapes inside the drawing.
+ Output messages will be send by this node, when certain events occur on shapes inside the drawing.

All the example flows below, will be available via the Node-RED *'Import'* menu.  In some of these examples a ***selector*** property in the input message is being used to select one or more elements (via a [CSS selector](https://www.w3schools.com/cssref/css_selectors.asp)).

# Set and get SVG

+ *Set*: In most cases, users will create their drawing using an external SVG drawing editor software.  Once finished, the entire SVG string can be injected into this node to display it in the dashboard.
+ *Get*: It is also possible to get the SVG string from this node, send in an output message.  That SVG string will be the original injected SVG string, inclusive all manipulations executed via input messages.

![svg_set_get](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/e9007e13-4257-4a03-bc16-5c8445d9b16e)

# Creating and removing elements

New elements can be added dynamically to a drawing, and existing elements can be removed.  

![svg_add_remove](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/cf60c069-ec7b-4000-8275-e245d362489e)

# Creating material design icons

Dashboard D2 supports Material Design Icons (see [list](https://pictogrammers.com/library/mdi/) of icons), which are also very convenient inside an SVG drawing.

![svg_mdi_icon](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/a6713663-78c9-46a9-93c6-1ae3efeb6de6)

# Set, get and remove attributes

The attributes of an element can be manipulated via input messages:
+ *Set*: overwrite the value of an existing attribute, or create a new attribute if it doesn't exist yet.
+ *Get*: get the value of an attribute.
+ *Remove*: remove an attribute from an element.
+ *Replace*: replace part of the value of an attribute, based on a regex match.  To be used in case it is too hard to compose the entire attribute value from scratch in a flow.

![svg_attribute](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/ccde828a-3f8a-49c9-9a8a-095ed78aeb46)

# Add, get and remove style

Elements can have a (CSS) style, which consists out of one or more style attributes.
+ *Add*: overwrite the value of an existing attribute, or create a new style attribute if it doesn't exist yet. --> TODO should become set instead of add!
+ *Get*: get the value of a style attribute. --> TODO implement
+ *Remove*: remove a style attribute from an element.

![svg_style](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/7fc17fee-4e37-4f81-ba86-1456a18fb484)

# Set and get text content

SVG text elements have a text content that can be get or set:

![svg_text](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/0f416126-6c26-4c93-bf71-93c25e747f1e)

# Add and remove events

Apply events (e.g. click) to elements, to trigger actions (e.g. send output message) when these events occur on those elements:

![svg_events](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/d88ae48c-d260-409d-ae38-f00d642564fe)
