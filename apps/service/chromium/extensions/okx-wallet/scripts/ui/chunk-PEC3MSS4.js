import{e as B}from"./chunk-DPRLOZH7.js";import{c as T,h as y}from"./chunk-HZPID3WW.js";import{g as C}from"./chunk-4HGOSSS7.js";import{o as j}from"./chunk-AUURQ3HI.js";import{s as I}from"./chunk-B32MCU7F.js";import{Gc as A,Jc as S,Y as s,_a as O}from"./chunk-Q23SA7M6.js";import{o as d,oa as k}from"./chunk-KBQXBPIW.js";import{f as b,o as p,q as f}from"./chunk-FJHLV356.js";p();f();var l=b(j());k();O();S();var G=(e,g)=>{let h=C(),a=g??h,u=B(a),i=(0,l.useCreation)(()=>u.find(t=>t.coinId===e?.coinId),[u,e?.coinId])?.childrenCoin??[],o=T(s,a),c=y(s,a);return(0,l.useCreation)(()=>{if(!e||!I(e)||!Array.isArray(i)||!Array.isArray(o)||!o.length)return[];let t=i.filter(r=>r.coinId===+e.coinId).map(r=>({...r})),m=[],n=d(t[0]||e),W=t.map(r=>c[r.addressType]);return o.forEach(({address:r,addressType:w})=>{W.includes(r)||(n.userAddress=r,n.address=r,n.addressType=A[s][w],n.coinAmount=0,n.coinAmountInt=0,n.currencyAmount=0,m.push(d(n)))}),t.concat(m).filter(r=>Boolean(c[r.addressType]))},[e,i,o,c])};export{G as a};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-PEC3MSS4.js.map
