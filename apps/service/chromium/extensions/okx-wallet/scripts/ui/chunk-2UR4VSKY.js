import{c as a}from"./chunk-FK74IDTO.js";import{m as f}from"./chunk-GCAD5G3O.js";import{cc as R}from"./chunk-B32MCU7F.js";import{a as N}from"./chunk-TKFT6XV3.js";import{F as m,oa as h}from"./chunk-KBQXBPIW.js";import{a as B}from"./chunk-PDSGFBX4.js";import{f as o,o as s,q as u}from"./chunk-FJHLV356.js";s();u();var t=o(B()),i=o(R());h();var p=o(N());var y=20*1e3,E=b=>{let k=(0,i.useDispatch)(),c=f(void 0,b),r=(0,t.useRef)(null);(0,t.useEffect)(()=>{let n=()=>{clearInterval(r.current),r.current=null},l=async()=>{try{let e=await c();if(m(e)){n();return}let d=await(0,p.default)(e.eth.getBlockNumber)();k(a(d))}catch(e){console.log(`fetch block failed 
${e}`)}};return l(),r.current=setInterval(()=>{l()},y),()=>{n()}},[c])},I=E;export{I as a};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-2UR4VSKY.js.map
