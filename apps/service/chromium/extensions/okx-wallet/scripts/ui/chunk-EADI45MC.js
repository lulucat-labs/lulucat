import{ta as i}from"./chunk-B32MCU7F.js";import{s,t as e}from"./chunk-2BGRD7AD.js";import{o as n,q as u}from"./chunk-FJHLV356.js";n();u();var p=async({chainId:c,address:o,contractAddress:m,coinId:S})=>{let E=await i({chainId:c,address:o,contractAddress:m,coinId:S}),{status:r,alertMessage:d,url:R,register:a}=E||{},t={alertMessage:d,url:R,register:a,status:e.PROCESSING};return a||r===s.SUCCESS?(t.status=e.COMPLETED,t):((r===s.NONE||r===s.TIMEOUT||r===s.ERROR)&&(t.status=e.NOT_STARTED),t)};export{p as a};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-EADI45MC.js.map
