import{a as l}from"./chunk-VLKJDIZ5.js";import{a as P}from"./chunk-PDSGFBX4.js";import{f as h,o,q as s}from"./chunk-FJHLV356.js";o();s();function u(t){if(!t)return{};let{pathname:e,search:n,hash:r}=t,a=new URLSearchParams(n),c=new URLSearchParams(r.slice(1)),i=e?.includes("/dex-swap/meme/sell")||e?.includes("/dex-swap/meme")&&a?.get("tab")==="sell",p=e?.includes("/dex-swap/meme/buy")||e?.includes("/dex-swap/meme")&&a?.get("tab")==="buy";return{isSellMode:i,isBuyMode:p,path:e,queryParams:a,hashParams:c}}o();s();var m=h(P()),f=h(l());function I(){let t=(0,f.useLocation)(),[e,n]=(0,m.useState)({});(0,m.useEffect)(()=>{if(t){let i=u(t);n(i)}},[t]);let{path:r,queryParams:a,hashParams:c}=e;return{path:r,queryParams:a,hashParams:c}}export{u as a,I as b};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-IKTGIHKL.js.map
