import{a as c}from"./chunk-ZTL7I2OD.js";import{b as s}from"./chunk-IKTGIHKL.js";import{a as d}from"./chunk-PIRKUEXW.js";import{b as u}from"./chunk-T2TGZ6ZH.js";import{l as a}from"./chunk-WCLMZJ77.js";import{o as r,q as n}from"./chunk-FJHLV356.js";r();n();var V=(o=a)=>{let{memeAccountStore:p,memeBuyStore:i,memeSellStore:_,memeQuoteStore:e,memeConfigStore:k}=u(),{currentMode:l}=k,{queryParams:f}=s(),g=l==="buy"||f?.get("tab")==="buy",{currentPreset:y}=d(),{slippage:m}=y,{chainId:S,chainName:t}=c(),M=p?.getAddressByChainId(S);return({button_name:h,custom_or_auto:C,popup_type:T,tab_name:b,type:A})=>{o&&o({button_name:h,custom_or_auto:C,popup_type:T,type:A,tab_name:b,wallet_address:M,from_token_address:e?.computedGetQuoteFrom?.tokenContractAddress,from_token_amount:e?.computedGetQuoteFromAmount,from_amount_usdt:e?.computedFromTokenValue,to_token_address:e?.computedGetQuoteTo?.tokenContractAddress,to_token_amount:e?.computedGetQuoteToAmount,to_amount_usdt:e?.computedToTokenValue,swap_type:"swap",balance_bracket:g?i?.fromToken?.amountNum:_?.toToken?.amountNum,slippage:{type:m?.type,amount:m?.value},trade_dialog:"no",from_chain:t,to_chain:t,chain:t})}};export{V as a};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-3PXXBAAG.js.map
