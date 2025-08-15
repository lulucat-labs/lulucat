import{b as a}from"./chunk-UEHNGOG4.js";import{k as g,l as m}from"./chunk-2LNDMD6C.js";import{a as p}from"./chunk-XRF6BZHR.js";import{H as f,a as N}from"./chunk-2BGRD7AD.js";import{pb as s,rb as I,yb as E}from"./chunk-Q23SA7M6.js";import{c as h,i as u,oa as l}from"./chunk-KBQXBPIW.js";import{f as k,o as d,q as T}from"./chunk-FJHLV356.js";d();T();var r=k(N());l();E();var L=async o=>{let{Common:t,Hardfork:e}=await g();(0,r.isHexString)(u(o.chainId))&&(o.chainId=h(p(o.chainId)));let n=s({netWorkId:o.chainId})?.baseChain,i=()=>{let w=a(o.from,n),b=a(o.to,n);return{...o,from:w,to:b,gasLimit:o.gas||o.gasLimit}},c=s({netWorkId:o.chainId})?.localType||"custom-net",x=I(c)?.networkId||"custom-net",y={chainId:o.chainId,networkId:x,name:c},C={common:t.custom(y,{baseChain:n,hardfork:e.London})},{TransactionFactory:A}=await m();return A.fromTxData(i(),C)},W=async(o,t)=>{let e=o.toJSON();e.type=o.type;let{TransactionFactory:n}=await m(),i=n.fromTxData({...e,...t},{common:o.common,freeze:Object.isFrozen(o)});return(0,r.bufferToHex)(i.serialize())},S="0x2019",_=({chainId:o,method:t})=>S===o&&t===f.KAIA_SIGN_TRANSACTION;export{L as a,W as b,_ as c};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-3OCLT7XJ.js.map
