(function() {
  "use strict";
  try {
    if (typeof document != "undefined") {
      var elementStyle = document.createElement("style");
      elementStyle.appendChild(document.createTextNode("/* CSS is auto scoped, but using named classes is still recommended */\n.ui-svg-wrapper[data-v-dfd731c1] {\n    width: 100%;\n    height: 100%;\n    padding: 10px;\n    margin: 10px;\n    border: 1px solid black;\n}"));
      document.head.appendChild(elementStyle);
    }
  } catch (e) {
    console.error("vite-plugin-css-injected-by-js", e);
  }
})();
(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("vue"), require("vuex")) : typeof define === "function" && define.amd ? define(["exports", "vue", "vuex"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global["ui-svg"] = {}, global.Vue, global.vuex));
})(this, function(exports2, vue, vuex) {
  "use strict";
  const NAMESPACES = {
    svg: "http://www.w3.org/2000/svg",
    html: "http://www.w3.org/1999/xhtml",
    xml: "http://www.w3.org/XML/1998/namespace",
    xlink: "http://www.w3.org/1999/xlink",
    xmlns: "http://www.w3.org/2000/xmlns/"
    // sic for the final slash...
  };
  function _setAttribute(element, name, value) {
    let parts = name.split(":");
    let prefix = parts[0];
    let unqualifiedName = parts.slice(1).join(":");
    let namespace = null;
    if (prefix === "xmlns" || unqualifiedName.length && NAMESPACES[prefix]) {
      namespace = NAMESPACES[prefix];
    }
    if (namespace) {
      element.setAttributeNS(namespace, name, String(value));
    } else {
      element.setAttribute(name, String(value));
    }
  }
  function _getAttribute(element, name) {
    let parts = name.split(":");
    let prefix = parts[0];
    let unqualifiedName = parts.slice(1).join(":");
    let namespace = null;
    if (prefix === "xmlns" || unqualifiedName.length && NAMESPACES[prefix]) {
      namespace = NAMESPACES[prefix];
    }
    if (namespace) {
      return element.getAttributeNS(namespace, name);
    } else {
      return element.getAttribute(name);
    }
  }
  function _setStyleAttributes(element, attributes) {
    let style = _getAttribute(element, "style") || "";
    let styleObject = {};
    style.split(";").forEach(function(styleAttribute) {
      let [attribute, value] = styleAttribute.split(":");
      if (attribute && value) {
        styleObject[attribute.trim()] = value.trim();
      }
    });
    for (const [key, value] of Object.entries(attributes)) {
      styleObject[key] = value;
    }
    style = "";
    for (const [key, value] of Object.entries(styleObject)) {
      style += `${key}:${value};`;
    }
    _setAttribute(element, "style", style);
  }
  function addElement(document2, svgElement, payload) {
    let parentElements = [];
    if (payload.parentSelector) {
      parentElements = svgElement.querySelectorAll(payload.parentSelector);
      if (!parentElements || parentElements.length == 0) {
        throw new Error(`No element matches the specified 'parentSelector' (${payload.parentSelector})`);
      }
    }
    if (parentElements.length > 1 && payload.elementId) {
      throw new Error(`Cannot add a single element (with id ${payload.elementId}) to multiple parent elements`);
    }
    if (parentElements.length == 0) {
      parentElements.push(svgElement);
    }
    parentElements.forEach(function(parentElement) {
      let newElement;
      if (payload.id) {
        if (parentElement.querySelector(`#${payload.id}`)) {
          return;
        }
      }
      if (payload.foreignElement == true) {
        newElement = document2.createElement(payload.type);
      } else {
        newElement = document2.createElementNS("http://www.w3.org/2000/svg", payload.type);
      }
      if (payload.id) {
        _setAttribute(newElement, "id", payload.id);
      }
      if (payload.attributes) {
        for (const [key, value] of Object.entries(payload.attributes)) {
          _setAttribute(newElement, key, value);
        }
      }
      if (payload.style) {
        let style = "";
        for (const [key, value] of Object.entries(payload.style)) {
          style += `${key}:${value};`;
        }
        _setAttribute(newElement, "style", style);
      }
      if (payload.text) {
        newElement.textContent = payload.text;
      }
      parentElement.appendChild(newElement);
    });
  }
  function addEvent(svgElement, payload, callbackHandler) {
    let elements = svgElement.querySelectorAll(payload.selector);
    if (!elements || !elements.length) {
      throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`);
    }
    let dataAttribute = `data-event_${payload.event}`;
    elements.forEach(function(element) {
      if (!element.hasAttribute(dataAttribute)) {
        element.addEventListener(payload.event, callbackHandler, false);
        element.setAttribute(dataAttribute, JSON.stringify({
          elementId: element.id,
          selector: payload.selector,
          event: payload.event,
          message: payload.message
        }));
        element.style.cursor = "pointer";
      }
    });
  }
  function removeElement(svgElement, payload) {
    let elements = svgElement.querySelectorAll(payload.selector);
    if (!elements || !elements.length) {
      throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`);
    }
    elements.forEach(function(element) {
      element.remove();
    });
  }
  function removeEvent(svgElement, payload, callbackHandler) {
    let elements = svgElement.querySelectorAll(payload.selector);
    if (!elements || !elements.length) {
      throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`);
    }
    let dataAttribute = `data-event_${payload.event}`;
    elements.forEach(function(element) {
      if (element.hasAttribute(dataAttribute)) {
        element.removeEventListener(payload.event, callbackHandler, false);
        element.removeAttribute(dataAttribute);
        element.style.cursor = "";
      }
    });
  }
  function setStyle(svgElement, payload) {
    let elements = svgElement.querySelectorAll(payload.selector);
    if (!elements || !elements.length) {
      throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`);
    }
    elements.forEach(function(element) {
      if (payload.attribute) {
        element.style[payload.attribute] = payload.style;
      } else {
        if (typeof payload.style == "object") {
          for (const property in payload.style) {
            element.style[property] = payload.style[property];
          }
        } else if (payload.style == "string") {
          element.style.cssText = payload.style;
        } else {
          throw new Error(`command 'set_style' requires a string or object 'style'`);
        }
      }
    });
  }
  function setSvg(domParser, payload) {
    if (!payload.svg.trim().startsWith("<svg")) {
      payload.svg = `<svg>${payload.svg}</svg>`;
    }
    const xmlnsPattern = /<svg[^>]*xmlns="http:\/\/www.w3.org\/2000\/svg"/;
    if (!xmlnsPattern.test(payload.svg)) {
      payload.svg = payload.svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    let document2 = domParser.parseFromString(payload.svg, "image/svg+xml");
    let parseError = document2.documentElement.querySelector("parsererror");
    if (parseError !== null) {
      throw new Error(`The 'svg' contains invalid svg`);
    }
    let svgElement = document2.querySelector("svg");
    _setAttribute(svgElement, "width", "100%");
    _setAttribute(svgElement, "heigth", "100%");
    return document2;
  }
  function setText(svgElement, payload) {
    let elements = svgElement.querySelectorAll(payload.selector);
    if (!elements || !elements.length) {
      throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`);
    }
    elements.forEach(function(element) {
      element.textContent = payload.text;
    });
  }
  function setValue(svgElement, payload) {
    let elements = svgElement.querySelectorAll(payload.selector);
    if (!elements || !elements.length) {
      throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`);
    }
    elements.forEach(function(element) {
      if (element.value !== void 0) {
        element.value = payload.value;
      }
    });
  }
  function setAttribute(svgElement, payload) {
    let elements = svgElement.querySelectorAll(payload.selector);
    if (!elements || !elements.length) {
      throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`);
    }
    elements.forEach(function(element) {
      _setAttribute(element, payload.attribute, payload.value);
    });
  }
  function setStyleAttribute(svgElement, payload) {
    let elements = svgElement.querySelectorAll(payload.selector);
    if (!elements || !elements.length) {
      throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`);
    }
    let attributes = {};
    attributes[payload.attribute] = payload.value;
    elements.forEach(function(element) {
      _setStyleAttributes(element, attributes);
    });
  }
  function removeAttribute(svgElement, payload) {
    let elements = svgElement.querySelectorAll(payload.selector);
    if (!elements || !elements.length) {
      throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`);
    }
    elements.forEach(function(element) {
      element.removeAttribute(payload.attribute);
    });
  }
  function removeStyleAttribute(svgElement, payload) {
    let elements = svgElement.querySelectorAll(payload.selector);
    if (!elements || !elements.length) {
      throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`);
    }
    elements.forEach(function(element) {
      let style = _getAttribute(element, "style") || "";
      let styleObject = {};
      style.split(";").forEach(function(styleAttribute) {
        let [attribute, value] = styleAttribute.split(":");
        if (attribute && attribute !== payload.attribute && value) {
          styleObject[attribute.trim()] = value.trim();
        }
      });
      style = "";
      for (const [key, value] of Object.entries(styleObject)) {
        style += `${key}:${value};`;
      }
      _setAttribute(element, "style", style);
    });
  }
  function replaceAttribute(svgElement, payload) {
    let elements = svgElement.querySelectorAll(payload.selector);
    if (!elements || !elements.length) {
      throw new Error(`No svg elements found for the specified 'selector' (${payload.selector})`);
    }
    let regex = new RegExp(payload.regex);
    elements.forEach(function(element) {
      if (element.hasAttribute(payload.attribute)) {
        let value = element.getAttribute(payload.attribute);
        value = value.replace(regex, function(match, group1) {
          return match.replace(group1, payload.value);
        });
        _setAttribute(element, payload.attribute, value);
      }
    });
  }
  function triggerAnimation(svgElement, payload) {
  }
  var svg_utils = {
    addElement,
    addEvent,
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
  };
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main = {
    name: "UISvg",
    inject: ["$socket"],
    props: {
      /* do not remove entries from this - Dashboard's Layout Manager's will pass this data to your component */
      id: { type: String, required: true },
      props: { type: Object, default: () => ({}) },
      state: { type: Object, default: () => ({ enabled: false, visible: false }) }
    },
    setup(props) {
      console.info("UISvg setup with:", props);
      console.debug("Vue function loaded correctly", vue.markRaw);
    },
    data() {
      return {
        input: {
          title: "some text here will base turned into title case."
        },
        vuetifyStyles: [
          { label: "Responsive Displays", url: "https://vuetifyjs.com/en/styles/display/#display" },
          { label: "Flex", url: "https://vuetifyjs.com/en/styles/flex/" },
          { label: "Spacing", url: "https://vuetifyjs.com/en/styles/spacing/#how-it-works" },
          { label: "Text & Typography", url: "https://vuetifyjs.com/en/styles/text-and-typography/#typography" }
        ]
      };
    },
    computed: {
      titleCase() {
        return toTitleCase(this.input.title);
      },
      ...vuex.mapState("data", ["messages"])
    },
    mounted() {
      this.$socket.on("widget-load:" + this.id, (msg) => {
        this.$store.commit("data/bind", {
          widgetId: this.id,
          msg
        });
      });
      this.$refs.svg_drawing.addEventListener("resize", (evt) => {
        let svgElement = this.$refs.svg_drawing;
        let bbox = svgElement.getBBox();
        let viewbox = [bbox.x, bbox.y, bbox.width, bbox.height].join(" ");
        svgElement.setAttribute("viewBox", viewbox);
      });
      this.$socket.on("msg-input:" + this.id, (msg) => {
        const mdiIcon = (iconName) => {
          let mdiIconPlaceholder = this.$refs.mdi_icon_placeholder;
          mdiIconPlaceholder.className = "mdi " + iconName;
          const styles = window.getComputedStyle(mdiIconPlaceholder, ":before");
          return styles.content.replaceAll('"', "");
        };
        this.$store.commit("data/bind", {
          widgetId: this.id,
          msg
        });
        if (!Array.isArray(msg.payload)) {
          node.error("The payload contains no array");
        }
        let svgElement = this.$refs.svg_drawing;
        msg.payload.forEach((payloadItem) => {
          if (!payloadItem.command) {
            throw new Error('Each array item in the payload should contain a "command" property');
          }
          debugger;
          switch (payloadItem.command) {
            case "add_element":
              if (payloadItem.text) {
                payloadItem.text = payloadItem.text.replace(/\{\{\s*(mdi-.+?)\s*\}\}/g, function(match, iconName) {
                  return mdiIcon(iconName);
                });
              }
              svg_utils.addElement(document, svgElement, payloadItem);
              break;
            case "add_event":
              svg_utils.addEvent(svgElement, payloadItem, this.handleEvent);
              break;
            case "remove_element":
              svg_utils.removeElement(svgElement, payloadItem);
              break;
            case "remove_event":
              svg_utils.removeEvent(svgElement, payloadItem);
              break;
            case "set_style":
              svg_utils.setStyle(svgElement, payloadItem);
              break;
            case "set_style_attribute":
              svg_utils.setStyleAttribute(svgElement, payloadItem);
              break;
            case "set_svg":
              let domParser = new DOMParser();
              let newDocument = svg_utils.setSvg(domParser, payloadItem);
              let newSvgElement = newDocument.querySelector("svg");
              let importedNode = document.importNode(newSvgElement, true);
              svgElement.removeAttribute("viewBox");
              let newViewBox = newSvgElement.getAttribute("viewBox");
              if (newViewBox) {
                svgElement.setAttribute("viewBox", newViewBox);
              }
              while (svgElement.firstChild) {
                svgElement.removeChild(svgElement.firstChild);
              }
              while (importedNode.firstChild) {
                svgElement.appendChild(importedNode.firstChild);
              }
              importedNode = null;
              break;
            case "set_text":
              svg_utils.setText(svgElement, payloadItem);
              break;
            case "set_value":
              svg_utils.setValue(svgElement, payloadItem);
              break;
            case "set_viewbox":
              svg_utils.setViewbox(svgElement, payloadItem);
              break;
            case "set_attribute":
              svg_utils.setAttribute(svgElement, payloadItem);
              break;
            case "remove_attribute":
              svg_utils.removeAttribute(svgElement, payloadItem);
              break;
            case "remove_style_attribute":
              svg_utils.removeStyleAttribute(svgElement, payloadItem);
              break;
            case "replace_attribute":
              svg_utils.replaceAttribute(svgElement, payloadItem);
              break;
            case "trigger_animation":
              svg_utils.triggerAnimation(svgElement, payloadItem);
              break;
            default:
              throw new Error("Unknown command");
          }
        });
      });
      this.$socket.emit("widget-load", this.id);
    },
    unmounted() {
      var _a, _b;
      (_a = this.$socket) == null ? void 0 : _a.off("widget-load" + this.id);
      (_b = this.$socket) == null ? void 0 : _b.off("msg-input:" + this.id);
    },
    methods: {
      /*
          widget-action just sends a msg to Node-RED, it does not store the msg state server-side
          alternatively, you can use widget-change, which will also store the msg in the Node's datastore
      */
      send(msg) {
        this.$socket.emit("widget-action", this.id, msg);
      },
      alert(text) {
        alert(text);
      },
      handleEvent(evt, proceedWithoutTimer) {
        if (!proceedWithoutTimer) {
          evt.preventDefault();
          evt.stopPropagation();
        }
        let element = evt.currentTarget;
        if (!element) {
          throw new Error(`No svg element has been found for event ${evt.type}`);
        }
        if (evt.type == "click" && !proceedWithoutTimer) {
          if (element.hasAttribute("data-event_dblclick")) {
            if (clickTimer && clickTimerTarget != evt.target) {
              clickCount = 0;
              clearTimeout(clickTimer);
              clickTimerTarget = null;
              clickTimer = null;
            }
            clickCount++;
            let currentTarget = evt.currentTarget;
            if (!clickTimer) {
              clickTimerTarget = evt.target;
              clickTimer = setTimeout(function() {
                if (clickCount < 2) {
                  Object.defineProperty(evt, "currentTarget", { writable: false, value: currentTarget });
                  handleEvent(evt, true);
                }
                clickCount = 0;
                clearTimeout($scope.clickTimer);
                clickTimerTarget = null;
                clickTimer = null;
              }, 400);
            }
            return;
          }
        }
        let userData = element.getAttribute(`data-event_${evt.type}`);
        if (!userData) {
          throw new Error(`No user data available for this ${evt.type} event`);
        }
        userData = JSON.parse(userData);
        let msg = userData.message;
        msg.event = {
          element_id: userData.elementId,
          type: evt.type
        };
        if (evt.type === "change") {
          if (event.target.type === "number") {
            msg.event.value = event.target.valueAsNumber;
          } else {
            msg.event.value = event.target.value;
          }
        } else {
          if (evt.changedTouches) {
            let touchEvent = evt.changedTouches[0];
            msg.event.pageX = Math.trunc(touchEvent.pageX);
            msg.event.pageY = Math.trunc(touchEvent.pageY);
            msg.event.screenX = Math.trunc(touchEvent.screenX);
            msg.event.screenY = Math.trunc(touchEvent.screenY);
            msg.event.clientX = Math.trunc(touchEvent.clientX);
            msg.event.clientY = Math.trunc(touchEvent.clientY);
          } else {
            msg.event.pageX = Math.trunc(evt.pageX);
            msg.event.pageY = Math.trunc(evt.pageY);
            msg.event.screenX = Math.trunc(evt.screenX);
            msg.event.screenY = Math.trunc(evt.screenY);
            msg.event.clientX = Math.trunc(evt.clientX);
            msg.event.clientY = Math.trunc(evt.clientY);
          }
          if (msg.event.pageX !== void 0 && msg.event.pageY !== void 0) {
            let rootSvgElement = element.ownerSVGElement;
            let point = rootSvgElement.createSVGPoint();
            point.x = msg.event.pageX;
            point.y = msg.event.pageY;
            point = point.matrixTransform(rootSvgElement.getScreenCTM().inverse());
            msg.event.svgX = Math.trunc(point.x);
            msg.event.svgY = Math.trunc(point.y);
            let svgElement = evt.target;
            if (!svgElement) {
              throw new Error(`No SVG element has been found for this ${evt.type} event`);
            }
            try {
              let bbox = svgElement.getBoundingClientRect();
              msg.event.bbox = [
                Math.trunc(bbox.left),
                Math.trunc(bbox.bottom),
                Math.trunc(bbox.right),
                Math.trunc(bbox.top)
              ];
            } catch (err) {
              throw new Error(`No bounding client rect has been found for this ${evt.type} event`);
            }
          }
        }
        this.send(msg);
      }
    }
  };
  const _hoisted_1 = { className: "ui-svg-wrapper" };
  const _hoisted_2 = { ref: "mdi_icon_placeholder" };
  const _hoisted_3 = {
    ref: "svg_drawing",
    width: "100%",
    height: "100%",
    xmlns: "http://www.w3.org/2000/svg"
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("div", _hoisted_1, [
      vue.withDirectives(vue.createElementVNode("i", _hoisted_2, null, 512), [
        [vue.vShow, false]
      ]),
      (vue.openBlock(), vue.createElementBlock("svg", _hoisted_3, null, 512))
    ]);
  }
  const UISvg = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-dfd731c1"]]);
  exports2.UISvg = UISvg;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
