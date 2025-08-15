import{d as o,f as A}from"./chunk-TKFT6XV3.js";import{Ac as x,Bc as c,Cc as y,vc as a,yc as n}from"./chunk-Q23SA7M6.js";import{o as s,q as u}from"./chunk-FJHLV356.js";s();u();x();y();A();var l=async(t={})=>{let{data:e}=await a(c.queryAccountExist,t);return e},q=async t=>{let{data:e}=await a(c.queryAccountInfo,t);return e},w=async(t,e)=>{let r=await o().getSignRequestHeaders({walletId:e});return await n(c.createWaxAccount,t,{headers:r})||{}},g=async(t,e)=>{let r=await o().getSignRequestHeaders({walletId:e});return await n(c.createFreeWaxAccount,t,{headers:r})||{}},W=async t=>{let{data:e}=await a(c.queryAccountStatus,t);return e||{}},h=async t=>{let{data:e}=await a(c.checkAccountPattern,t);return e??!1};export{l as a,q as b,w as c,g as d,W as e,h as f};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-SVAZTO4I.js.map
