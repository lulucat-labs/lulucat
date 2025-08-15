import{Eb as u,Fb as D,ic as f,jc as k}from"./chunk-Q23SA7M6.js";import{G as p,oa as v}from"./chunk-KBQXBPIW.js";import{a as M}from"./chunk-PDSGFBX4.js";import{f as E,n as process,o as c,q as g}from"./chunk-FJHLV356.js";c();g();var e=E(M());v();k();D();var s,C=(t,a={})=>{let[o,w]=(0,e.useState)(null),[r,T]=(0,e.useState)(null),[i,y]=(0,e.useState)(a);return(0,e.useEffect)(()=>{p(a,i)||y(a)},[a]),(0,e.useEffect)(()=>{if(r)return()=>{};let l=document.getElementById("sandbox"),m=n=>{n.data.chanel===t&&T(n.data)},d=n=>{n.data.status===201&&(window.removeEventListener("message",d),s&&clearInterval(s),window.addEventListener("message",m),w(l))},b=f();return s||(s=setInterval(()=>{l.contentWindow?.postMessage({status:200,buildType:process.env.ASSETS_BUILD_TYPE,cdn:u(),browser:b},"*")},1e3)),window.addEventListener("message",d),()=>{window.removeEventListener("message",m)}},[r]),(0,e.useEffect)(()=>{t&&o&&o.contentWindow?.postMessage({chanel:t,data:i},"*")},[t,o,i]),r};export{C as a};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-SNFTVDFG.js.map
