import{b as c}from"./chunk-GHKJNUVY.js";import{O as y,w as u}from"./chunk-364XNTHB.js";import{a as h}from"./chunk-PDSGFBX4.js";import{f as d,o as e,q as n}from"./chunk-FJHLV356.js";e();n();e();n();var g=d(h());y();function w(C){let{mainnetList:s,testnetList:a,customList:m,originMainnetListLength:I,isEVMChainExisted:p}=c(C);return(0,g.useMemo)(()=>{let i=(r,M)=>t=>{let l=t[r];return{chainName:t.chainName,icon:"image"in t?t.image:t.icon,id:String(l??""),rpcUrl:"rpcUrl"in t?t.rpcUrl:void 0,networkType:M,symbol:t.symbol}},o=[];return I>1&&o.push({chainName:u("wallet_extension_history_dropdown_all_network"),id:"",icon:"/static/images/tx-history/all-chain-icon.svg",networkType:0}),o.push(...s.map(i("chainId",0))),{isEVMChainExisted:p,mainnetListForUI:o,testnetListForUI:a.map(i("uniqueId",1)),customListForUI:m.map(i("uniqueId",2))}},[s,a,m,p])}export{w as a};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-HGH3KFHX.js.map
