import{o as T}from"./chunk-AUURQ3HI.js";import{M as D}from"./chunk-B32MCU7F.js";import{e as l,ga as n,oa as x}from"./chunk-KBQXBPIW.js";import{a as B}from"./chunk-PDSGFBX4.js";import{f as I,o as b,q as y}from"./chunk-FJHLV356.js";b();y();var e=I(B()),s=I(T());x();var _=(E,O={wait:200,disabled:!1,fetchOnce:null,forceUpdate:null,onFetchSuccess:()=>{},onFetchError:()=>{}})=>{let[g,d]=(0,e.useState)({}),[m,v]=(0,e.useState)(null),[w,{setTrue:S,setFalse:o}]=(0,s.useBoolean)(!0),[U,{setFalse:r}]=(0,s.useBoolean)(!0),{address:i,inputData:c,tokenAddress:a,coinId:F,value:h}=E,{wait:k,disabled:p,fetchOnce:t,forceUpdate:q,onFetchSuccess:L,onFetchError:G}=O,A=async()=>{try{let u={coinId:F,value:h,address:i&&n(i),inputData:c&&n(c)};a&&(u.tokenAddress=n(a));let{data:f}=await D(u);d(f),t&&v(t),l(L)&&L()}catch{d(f=>({...f,queryGasLimitErrorUseDefault:!0})),l(G)&&G()}finally{o(),r()}},{run:P}=(0,s.useDebounceFn)(()=>{if(p){o(),r();return}if(t===m&&t!==null){o(),r();return}A()},{wait:k});return(0,e.useEffect)(()=>{S(),P()},[i,c,a,F,h,t,q,m,p]),[g,w,U]},H=_;export{H as a};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-UWMYELRK.js.map
