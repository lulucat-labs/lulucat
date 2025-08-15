import{d as l}from"./chunk-MNWYB2XY.js";import{b as p}from"./chunk-AOBCHKFQ.js";import{tb as m}from"./chunk-B32MCU7F.js";import{d as o,f as T}from"./chunk-TKFT6XV3.js";import{C as u}from"./chunk-2BGRD7AD.js";import{u as I}from"./chunk-ZWQEMYA4.js";import{$a as f,bb as y,yb as W}from"./chunk-Q23SA7M6.js";import{o as w,q as d}from"./chunk-FJHLV356.js";w();d();W();T();var _=({txData:e,txParams:n,walletId:t,isRpcMode:r=!1,baseChain:a=f})=>async(s,i)=>{let c=i();t??=m(c);let g=await o().getWalletIdentityByWalletId(t);p(g?.initialType)&&await l({walletInfo:g,txData:e,txParams:n,isRpcMode:r,baseChain:a})};async function S(e,n,t,r,{...a}={}){let s="";r??=await o().getWalletIdByAddress(n,t);let i=await o().getWalletIdentityByWalletId(r);try{if(p(i?.initialType))return s=await l({walletInfo:i,txParams:e,baseChain:t}),s;s=await o().signTransaction(e,n,t,r,a)}catch(c){throw c?.message===I?c:new Error(u)}return s}function k(e,n,t){return async()=>S(e,n,y,t)}function v(e,n,t,r,a){return o().signPsbt(e,n,t,r,a)}export{_ as a,S as b,k as c,v as d};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-IEUJSLGG.js.map
