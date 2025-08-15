import{h as x}from"./chunk-4HGOSSS7.js";import{B as N,cc as T}from"./chunk-B32MCU7F.js";import{nb as w,yb as W}from"./chunk-Q23SA7M6.js";import{F as d,K as y,oa as k,v as p}from"./chunk-KBQXBPIW.js";import{a as Q}from"./chunk-PDSGFBX4.js";import{f as a,o as u,q as c}from"./chunk-FJHLV356.js";u();c();var l=a(Q()),j=a(T());k();W();u();c();k();var I=e=>{if(!e||typeof e!="object")return!1;let r={};return Object.keys(e).forEach(t=>{let o=e[t];r[t]=Array.isArray(o)?o:[o]}),r},b=(e,r)=>{if(!Array.isArray(e))return[];if(!r||d(r)||typeof r!="object")return e;let t=Object.entries(r);return p(e,o=>{for(let n=0;n<t.length;n++){let f=t[n][0];if(!t[n][1]?.includes(o[f]))return!1}return!0})};var m=e=>{let r=(0,j.useSelector)(N);return(0,l.useMemo)(()=>{if(!e)return r;let t=I(e);return b(r,t)},[r,e])},E=(e={},r)=>{let t=x(r),o=Object.keys(t?.account||{});return m({...e,localType:o})},O=(e={})=>{let{coinId:r,localType:t,networkId:o,netWorkId:n}=w(e)||{},f=m();return(0,l.useMemo)(()=>{let i=o??n;if(![r,t,i].every(s=>y(s)||s===""))return f.find(s=>i!==void 0&&s?.netWorkId===i||r!==void 0&&s?.coinId===r||t!==void 0&&s?.localType===t)},[r,t,o,n,f])};u();c();export{m as a,E as b,O as c};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-7YQLUBDN.js.map
