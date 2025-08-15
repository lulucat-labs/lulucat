import{f as s}from"./chunk-F4XZWNG2.js";import{o as d}from"./chunk-AUURQ3HI.js";import{cc as M}from"./chunk-B32MCU7F.js";import{d as a,f as B}from"./chunk-TKFT6XV3.js";import{f as c,o as n,q as i}from"./chunk-FJHLV356.js";n();i();var p=c(M()),m=c(d());B();var S=({metamask:t})=>t?.createdMap||{},g=(t,e,u={})=>{let r=s(t,e,{...u,withBalanceStatus:!0})||{},{requestBalance:f}=r,l=!(0,p.useSelector)(S)[e];return(0,m.useMount)(async()=>{if(l)try{let o=await a().getWalletTypeCreated(e);await a().createWalletToServer({walletId:e,walletType:o,noticeBackend:!0}),f()}catch{}}),r},C=g;export{C as a};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-R6UCQXIY.js.map
