import{Ib as s,Nb as m,Ob as o,Pb as e,Rb as c,gc as i,hc as q}from"./chunk-Q23SA7M6.js";import{O as T,w as C}from"./chunk-364XNTHB.js";import{o as l,q as w}from"./chunk-FJHLV356.js";l();w();T();q();var L=()=>{let n=C("extension_wallet_transaction_text_minute"),x=C("extension_wallet_transaction_text_second");return(t,r,d)=>{if(d)return`-- ${n}`;let a=i(t.minCost,n,x),_=i(t.normalCost,n,x),$=i(t.maxCost,n,x),u=`> 3 ${n}`,p=`> 10 ${n}`,S=`> 60 ${n}`;return c(r,t.min)?$:e(r,t.min)&&m(r,t.normal)?`< ${$}`:c(r,t.normal)?_:e(r,t.normal)&&m(r,t.max)?`< ${_}`:c(r,t.max)?a:e(r,t.max)?`< ${a}`:m(r,t.min)?o(r,s(t.min,.85))?S:o(r,s(t.min,.9))?p:(o(r,s(t.min,.95)),u):`-- ${n}`}};export{L as a};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-6G3RP33F.js.map
