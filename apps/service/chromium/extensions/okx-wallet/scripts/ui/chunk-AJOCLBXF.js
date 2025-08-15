import{e as T}from"./chunk-DPRLOZH7.js";import{c as g,i as C}from"./chunk-HZPID3WW.js";import{g as y}from"./chunk-4HGOSSS7.js";import{o as b}from"./chunk-AUURQ3HI.js";import{t as A}from"./chunk-B32MCU7F.js";import{Gc as I,Jc as S,_a as R,qa as s}from"./chunk-Q23SA7M6.js";import{o as u,oa as N}from"./chunk-KBQXBPIW.js";import{f as w,o as p,q as f}from"./chunk-FJHLV356.js";p();f();N();R();S();var d=w(b());var z=(n,h)=>{let B=y(),a=h??B,l=T(a),i=(0,d.useCreation)(()=>l.find(t=>t.coinId===n?.coinId),[l,n?.coinId])?.childrenCoin??[],o=g(s,a),c=C(s,a);return(0,d.useCreation)(()=>{if(!n||!A(n)||!Array.isArray(i)||!Array.isArray(o)||!o.length)return[];let t=i.filter(r=>r.coinId===+n.coinId).map(r=>({...r})),m=[],e=u(t[0]||n),E=t.map(r=>c[r.addressType]);return o.forEach(({address:r,addressType:W})=>{E.includes(r)||(e.address=r,e.addressType=I[s][W],e.coinAmount=0,e.coinAmountInt=0,e.currencyAmount=0,e.currencyAmountUSD=0,m.push(u(e)))}),t.concat(m).filter(r=>Boolean(c[r.addressType]))},[n,i,o,c])};export{z as a};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-AJOCLBXF.js.map
