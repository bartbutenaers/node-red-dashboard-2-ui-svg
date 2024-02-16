(function(){"use strict";try{if(typeof document<"u"){var e=document.createElement("style");e.appendChild(document.createTextNode(".ui-svg-wrapper[data-v-6b79839d]{width:100vw;height:100vh;padding:10px;margin:10px;border:1px solid black}")),document.head.appendChild(e)}}catch(d){console.error("vite-plugin-css-injected-by-js",d)}})();
(function(n,o){typeof exports=="object"&&typeof module<"u"?o(exports,require("vue"),require("vuex")):typeof define=="function"&&define.amd?define(["exports","vue","vuex"],o):(n=typeof globalThis<"u"?globalThis:n||self,o(n["ui-svg"]={},n.Vue,n.vuex))})(this,function(n,o,r){"use strict";function c(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var u=h,p=/\s/,l=/(_|-|\.|:)/,d=/([a-z][A-Z]|[A-Z][a-z])/;function h(e){return p.test(e)?e.toLowerCase():l.test(e)?(m(e)||e).toLowerCase():d.test(e)?y(e).toLowerCase():e.toLowerCase()}var f=/[\W_]+(.|$)/g;function m(e){return e.replace(f,function(t,s){return s?" "+s:""})}var v=/(.)([A-Z]+)/g;function y(e){return e.replace(v,function(t,s,a){return s+" "+a.toLowerCase().split("").join(" ")})}var g=u,w=_;function _(e){return g(e).replace(/[a-z]/i,function(t){return t.toUpperCase()}).trim()}var C=function(e){return String(e).replace(/([.*+?=^!:${}()|[\]\/\\])/g,"\\$1")},b=["a","an","and","as","at","but","by","en","for","from","how","if","in","neither","nor","of","on","only","onto","out","or","per","so","than","that","the","to","until","up","upon","v","v.","versus","vs","vs.","via","when","with","without","yet"],S=w,$=C,j=b,k=U,x=j.map($),I=new RegExp("[^^]\\b("+x.join("|")+")\\b","ig"),T=/:\s*(\w)/g;function U(e){return S(e).replace(/(^|\s)(\w)/g,function(t,s,a){return s+a.toUpperCase()}).replace(I,function(t){return t.toLowerCase()}).replace(T,function(t){return t.toUpperCase()})}const E=c(k),L=(e,t)=>{const s=e.__vccOpts||e;for(const[a,i]of t)s[a]=i;return s},O={name:"UISvg",inject:["$socket"],props:{id:{type:String,required:!0},props:{type:Object,default:()=>({})},state:{type:Object,default:()=>({enabled:!1,visible:!1})}},setup(e){console.info("UISvg setup with:",e),console.debug("Vue function loaded correctly",o.markRaw)},data(){return{input:{title:"some text here will base turned into title case."},vuetifyStyles:[{label:"Responsive Displays",url:"https://vuetifyjs.com/en/styles/display/#display"},{label:"Flex",url:"https://vuetifyjs.com/en/styles/flex/"},{label:"Spacing",url:"https://vuetifyjs.com/en/styles/spacing/#how-it-works"},{label:"Text & Typography",url:"https://vuetifyjs.com/en/styles/text-and-typography/#typography"}]}},computed:{titleCase(){return E(this.input.title)},...r.mapState("data",["messages"])},mounted(){this.$socket.on("widget-load:"+this.id,e=>{this.$store.commit("data/bind",{widgetId:this.id,msg:e})}),this.$socket.on("msg-input:"+this.id,e=>{this.$store.commit("data/bind",{widgetId:this.id,msg:e})}),this.$socket.emit("widget-load",this.id)},unmounted(){var e,t;(e=this.$socket)==null||e.off("widget-load"+this.id),(t=this.$socket)==null||t.off("msg-input:"+this.id)},methods:{send(e){this.$socket.emit("widget-action",this.id,e)},alert(e){alert(e)},test(){console.info("custom event handler:"),this.$socket.emit("my-custom-event",this.id,{payload:"Custom Event"})}}},M=e=>(o.pushScopeId("data-v-6b79839d"),e=e(),o.popScopeId(),e),N={className:"ui-svg-wrapper"},z=[M(()=>o.createElementVNode("svg",{width:"100%",height:"100%"},[o.createElementVNode("circle",{cx:"50%",cy:"50%",r:"50",fill:"blue"})],-1))];function R(e,t,s,a,i,A){return o.openBlock(),o.createElementBlock("div",N,z)}const V=L(O,[["render",R],["__scopeId","data-v-6b79839d"]]);n.UISvg=V,Object.defineProperty(n,Symbol.toStringTag,{value:"Module"})});
