import{T as i,U as p,la as c,ma as g}from"./chunk-N4B7HQY5.js";import{c as a,f as m}from"./chunk-TKFT6XV3.js";import{o as r,q as o}from"./chunk-FJHLV356.js";r();o();g();m();p();var d=c({name:"walletConfig",initialState:{},reducers:{}}),{reducer:w}=d,W=w;function x(e){return{type:i,value:e}}function C(e,l){return s=>new Promise((u,f)=>{a().setWalletConfig(e,l,(t,n)=>{if(t){f(t);return}s(x(n)),u(n)})})}function A(e){return C("hasShowDisconnectUpgrade",e)}function E({metamask:e}){return e.walletConfig}export{W as a,C as b,A as c,E as d};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-ZZLPMRQY.js.map
