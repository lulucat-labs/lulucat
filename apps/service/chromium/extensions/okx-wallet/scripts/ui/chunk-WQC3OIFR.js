import{b as c}from"./chunk-WRZIZFIL.js";import{g as u}from"./chunk-4HGOSSS7.js";import{o as k}from"./chunk-AUURQ3HI.js";import{Ac as W,Bc as a,Cc as _,ob as n,vc as m,yb as C}from"./chunk-Q23SA7M6.js";import{j as i,oa as L}from"./chunk-KBQXBPIW.js";import{O as b,n as f}from"./chunk-364XNTHB.js";import{a as E}from"./chunk-PDSGFBX4.js";import{f as r,o,q as s}from"./chunk-FJHLV356.js";o();s();var l=r(E()),p=r(k());L();b();C();_();W();var T="update_defi_list",M=()=>{let d=u(),I=n(),t=(0,p.useRequest)(async()=>{let D=await m(a.getDefiList,{accountId:d});return i(D,["data","platformListByAccountId","0","platformListVoList"],[]).filter(g=>I.find(h=>Number(h.netWorkId)===g.chainId))},{manual:!0}),e=c("invest-DeFi",{onError:t.refresh,pollingInterval:30*1e3});return(0,l.useEffect)(()=>{e&&t.refresh()},[e]),f.listen(T,t.refresh,!1),t};export{T as a,M as b};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-WQC3OIFR.js.map
