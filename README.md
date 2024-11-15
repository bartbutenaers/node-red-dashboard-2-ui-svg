# @bartbutenaers/node-red-dashboard-2-ui-svg

A Node-RED ui node for Dashboard D2, to display a 2-way interactive drawing with scalable vector graphics (SVG).

## Installation

Since this node is in an experimental phase, it is ***not*** available on NPM yet.  So not available in the palette!

Run the following npm command in your Node-RED user directory (typically ~/.node-red), to install this node directly from this Github repo:
```
npm install bartbutenaers/node-red-dashboard-2-ui-svg
```
Note that you need to have Git installed, in order to be able to execute this command.

## Support my Node-RED developments

Please buy my wife a coffee to keep her happy, while I am busy developing Node-RED stuff for you ...

<a href="https://www.buymeacoffee.com/bartbutenaers" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy my wife a coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

## Status of this project

This repository contains an early alpha version.  It still lacks MANY features from the [old svg node](https://github.com/bartbutenaers/node-red-contrib-ui-svg/blob/master/README.md), which I had developed at the time being for the old AngularJs Node-RED dashboard (which is end of life).  This node also will be completely different from the old node (see [here](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/issues/11) why).

Some remarks:
+ Most of these features still needs to be implemented, so there is ***no*** point yet to start registering issues.
+ Due to the lack of free time, there is also ***no*** roadmap or ETA.
+ Take into account that at this moment there will be most probably breaking changes, and ***no*** backwards compatibility will be provided!

:warning: For more info about why this node is currently not actively maintained, see [here](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/issues/12).

## Node usage

The SVG drawing is interactive in two ways:
+ Input messages can be injected into the node, to change the shapes inside the drawing.
+ Output messages will be send by this node, when certain events occur on shapes inside the drawing.

All the example flows below, will be available via the Node-RED *'Import'* menu.  In some of these examples a ***selector*** property in the input message is being used to select one or more elements (via a [CSS selector](https://www.w3schools.com/cssref/css_selectors.asp)).

# Set and get SVG

+ *Set*: In most cases, users will create their drawing using an external SVG drawing editor software.  Once finished, the entire SVG string can be injected into this node to display it in the dashboard.  The current SVG drawing will be completely removed and replaced by the new SVG drawing.
   ```
   "payload": {
      "command": "set_svg",
      "svg": "<circle id='my_circle' cx='250' cy='70' r='50' style='fill:red:'>"
   }
   ```

+ *Get*: It is also possible to get the SVG string from this node, send in an output message.  That SVG string will be the original injected SVG string, inclusive all manipulations executed via input messages.
   ```
   "payload": {
      "command": "get_svg"
   }
   ```

See [example flow](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/blob/master/examples/set%20and%20get%20svg.json):

![svg_set_get](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/e9007e13-4257-4a03-bc16-5c8445d9b16e)

# Get delta

Once a new SVG drawing is created (by adding a new SVG node to the flow or via the `set_svg` command), that drawing can be enhanced via input messages.  Which means there will be a delta between the initial SVG drawing and the current enhanced SVG drawing.  That delta can be fetched for informational purpose:
```
"payload": {
    "command": "get_delta"
}
```

See [example flow](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/blob/master/examples/get%20delta.json):

![svg_get_delta](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/e95382e6-2454-4003-b5df-a06d338236bd)

# Update SVG

When a new SVG drawing has been set and it has been enhanced afterwards via commands in input messages, then there will be a delta between the intial drawing and the current enhanced drawing.  In some use cases it is required to update that initial drawing, but that delta needs to be applied again:
```
"payload": {
   "command": "update_svg",
   "svg": "<text id='my_text' x='50' y='160' style='font: italic 40px serif;'>Hello Node-RED!</text>"
}
```

See [example flow](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/blob/master/examples/update%20svg.json):

![svg_update](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/1b0414b4-696c-4395-9904-61a2a9552058)

Remarks:
+ The difference with the `set_svg` command is that the latter command does not take into account the available delta.
+ Typical use case:
   1. Draw a floorplan using an external software.
   2. Inject the floorplan SVG drawing using a `set_svg` command.
   3. Enhance the floorplan using input messages (e.g. color a sensor red when it is in alert).
   4. Do some changes to the floorplan using the external software.
   5. Inject the updated floorplan using an `update_svg` command.
   6. The updated floorplan will be displayed inclusive the sensor in red.
 + This will only work correctly if the id's of the SVG elements are not changed!

# Adding and removing elements

+ *Add* new elements dynamically to a drawing:
   ```
   "payload": {
      "command": "add_element",
      "type": "ellipse",
      "id": "my_ellipse",
      "attributes": {
         "cx": "150",
         "cy": "80",
         "rx": "80",
         "ry": "30"
      },
      "style": {
         "fill": "purple"
      }
   }
   ```

+ *Remove* existing elements from a drawing:  
   ```
   "payload": {
      "command": "remove_element",
      "selector": "#my_ellipse"
   }
   ```

See [example flow](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/blob/master/examples/creating%20and%20deleting%20elements.json):

![svg_add_remove](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/cf60c069-ec7b-4000-8275-e245d362489e)

# Creating material design icons

Dashboard D2 supports Material Design Icons (see [list](https://pictogrammers.com/library/mdi/) of icons), which are very convenient inside an SVG drawing.  Those can be created by adding a simple text element:
```
"payload": {
   "command": "add_element",
   "id": "#my_icon",
   "type": "text",
   "attributes": {
      "x": "150",
      "y": "120",
      "fill": "red"
   },
   "style": {
      "font-family": "Material Design Icons",
      "font-weight": "bold",
      "font-size": "100px"
   },
   "text": "{{mdi-cctv}}"
}
```

See [example flow](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/blob/master/examples/create%20material%20design%20icon.json):

![svg_mdi_icon](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/a6713663-78c9-46a9-93c6-1ae3efeb6de6)

# Set, get and remove attributes

The attributes of an element can be manipulated via input messages:
+ *Set*: overwrite the value of an existing attribute, or create a new attribute if it doesn't exist yet.
   ```
   "payload": {
      "command": "set_attribute",
      "selector": "#my_path",
      "attribute": "stroke",
      "value": "red"
   }
   ```

+ *Get*: get the value of an attribute.
   ```
   "payload": {
      "command": "get_attribute",
      "selector": "#my_path",
      "attribute": "d"
   }
   ```

+ *Remove*: remove an attribute from an element.
   ```
   "payload": {
      "command": "remove_attribute",
      "selector": "#my_path",
      "attribute": "stroke-width"
   }
   ```

+ *Replace*: replace part of the value of an attribute, based on a regex match.  To be used in case it is too hard to compose the entire attribute value from scratch in a flow.
   ```
   "payload": {
      "command": "replace_attribute",
      "selector": "#my_path",
      "attribute": "d",
      "regex": "M[^ ]+ [^ ]+ Q [^ ]+ ([^ ]+), [^ ]+ [^ ]+ T [^ ]+ [^ ]+",
      "value": "20"
   }
   ```

See [example flow](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/blob/master/examples/set%20and%20get%20and%20remove%20attribute.json):

![svg_attribute](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/ccde828a-3f8a-49c9-9a8a-095ed78aeb46)

# Add, get and remove style

Elements can have a (CSS) style, which consists out of one or more style attributes.
+ *Set*: the value of an existing stye attribute, or create a new style attribute if it doesn't exist yet. --> TODO should become set instead of add!
   ```
   "payload": {
      "command": "set_style_attribute",
      "selector": "#my_rectangle",
      "attribute": "fill",
      "value": "orange"
   }
   ```

+ *Set*: the the entire style, i.e. all available style attributes at once.
   ```
   "payload": {
      "command": "set_style",
      "selector": "#my_rectangle",
      "style": {
         "fill": "red",
         "stroke": "blue"
      }
   }
   ```

+ *Get*: get the value of a style attribute. --> TODO implement

+ *Remove*: remove a style attribute from an element.
   ```
   "payload": {
      "command": "remove_style_attribute",
      "selector": "#my_rectangle",
      "attribute": "stroke"
   }
   ```

See [example flow](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/blob/master/examples/add%20and%20get%20and%20remove%20style.json):

![svg_style](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/7fc17fee-4e37-4f81-ba86-1456a18fb484)

# Set and get text content

Among others, SVG text elements have a text content that can be get or set.

+ *Set* text content of an SVG element:
   ```
   "payload": {
      "command": "set_text",
      "selector": "#my_text",
      "text": "Text content updated"
   }
   ```

+ *Get" text content of an SVG element:
   ```
   "payload": {
      "command": "get_text",
      "selector": "#my_text"
   }
   ```

See [example flow](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/blob/master/examples/set%20and%20get%20text%20content.json):

![svg_text](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/0f416126-6c26-4c93-bf71-93c25e747f1e)

Note that tools like (e.g. Inkscape) create SVG drawings with text elements that have a nested `tspan` element, which contain the text content.  You can set the text content of such a nested `tspan` element via the selector:
```
"payload": {
   "command": "set_text",
   "selector": "#my_text > tspan",
   "text": "Tspan content updated"
}
```

# Add and remove events

Apply events (e.g. click) to elements, to trigger actions (e.g. send output message) when these events occur on those elements.

+ *Add* event to the specified SVG element(s).
   ```
   "payload": {
      "command": "add_event",
      "selector": "#my_circle",
      "message": {
         "topic": "click event triggered",
         "payload": "circle clicked"
      },
      "event": "click"
   }
   ```

+ *Remove* event from the specified SVG element(s).
   ```
   "payload": {
      "command": "remove_event",
      "selector": "#my_circle",
      "event": "click"
   }
   ```

See [example flow](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/blob/master/examples/add%20and%20remove%20event.json):

![svg_events](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/d88ae48c-d260-409d-ae38-f00d642564fe)

# Add, remove, start and stop animations

Animations can be used to change SVG elements (e.g. attribute values) over time from one value to another.

TODO: not possible to add an animation element with a specified id to multiple svg elements.

+ *Add* an animation, as a child element of the SVG element that needs to be animated.  An animation can be created like any other SVG element:
   ```
   "payload": {
      "command": "add_element",
      "type": "animate",
      "id": "my_animation",
      "parentSelector": "#my_circle",
      "attributes": {
         "attributeName": "r",
         "from": "40",
         "to": "10",
         "dur": "3s",
         "repeatCount": "indefinite"
      }
   }
   ```

+ *Remove* an animation.
   ```
   "payload": {
      "command": "remove_element",
      "selector": "#my_animation",
   }
   ```

+ *Start* an animation.
   ```
   "payload": {
      "command": "start_animation",
      "selector": "#my_animation",
   }
   ```

+ *Stop* an animation.
   ```
   "payload": {
      "command": "stop_animation",
      "selector": "#my_animation",
   }
   ```

See [example flow](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/blob/master/examples/animations.json):

![svg_animations](https://github.com/bartbutenaers/node-red-dashboard-2-ui-svg/assets/14224149/d6e15dd6-d86f-4f53-8a1f-84220fc6a4a6)

