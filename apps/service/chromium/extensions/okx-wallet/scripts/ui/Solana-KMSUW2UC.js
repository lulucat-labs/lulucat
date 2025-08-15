import{c as w}from"./chunk-5NZYX7T6.js";import{l as f}from"./chunk-ZOUFDRHZ.js";import{n}from"./chunk-QZXD2Q4G.js";import{D as u,O as P}from"./chunk-364XNTHB.js";import{a as i}from"./chunk-PDSGFBX4.js";import"./chunk-3CPUV3E7.js";import{f as p,o as t,q as r}from"./chunk-FJHLV356.js";t();r();var h=p(i());t();r();var S=p(i());P();var d=()=>{let{accountStore:{computedAccountId:a},walletContractStore:{transactionPayload:o},swapStore:{setSolanaSwapParams:s,sendSolanaTransaction:c,solanaSwapParams:m}}=w();return(0,S.useMemo)(()=>{try{let e=o?.map(l=>l.payload.transaction),y=e.length>1;return{showDappInfo:!1,showSwitchNetwork:!1,walletId:a,method:"signAllTransactions",params:{message:e},source:"dex",onConfirm:async l=>{let[C]=await u(c({signedTransactions:l,txArray:o,enableJito:y,swapParams:m,walletId:a}));C||s(null)},onCancel:()=>{s(null),n.history?.goBack()}}}catch{return null}},[a,c,s,m,o])};var x=()=>{let{SolanaEntry:a}=n.components,o=d();return h.default.createElement(a,{...o})},J=f(x);export{J as default};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=Solana-KMSUW2UC.js.map
