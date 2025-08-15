import{d as L}from"./chunk-4L5OPDYI.js";import{c as E,k as m}from"./chunk-2NGLDVXQ.js";import{a as d}from"./chunk-KYU5M654.js";import{cc as k,y as w,z as f}from"./chunk-B32MCU7F.js";import{a as g}from"./chunk-PDSGFBX4.js";import{f as a,o as M,q as p}from"./chunk-FJHLV356.js";M();p();var r=a(g()),N=a(k()),h=a(w());var x=(0,h.createSelector)(t=>d(t).map(e=>({...e,icon:e.image})),t=>{let[e]=f(t);return{isEVMChainExisted:t.some(o=>E(o.coinId)),mainNetworkList:e}}),D=t=>{let{defaultNets:e,customNets:i}=L(),{isEVMChainExisted:o,mainNetworkList:s}=(0,N.useSelector)(x),{rpcModeTestNetworkList:C,rpcModeCustomNetworkList:u}=(0,r.useMemo)(()=>({rpcModeTestNetworkList:o?e.map(m):[],rpcModeCustomNetworkList:o?i.map(m):[]}),[o,e,i]),c=(0,r.useMemo)(()=>{let n=V=>V.filter(l=>l.chainName?.toLowerCase().includes(t.toLowerCase()));return{originMainnetListLength:s.length,mainnetList:n(s),testnetList:n(C),customList:n(u)}},[t,s,C,u]);return(0,r.useMemo)(()=>({...c,isEVMChainExisted:o}),[c,o])},B=D;export{x as a,B as b};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-GHKJNUVY.js.map
