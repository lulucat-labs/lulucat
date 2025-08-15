import{a as b}from"./chunk-2LNDMD6C.js";import{g}from"./chunk-74FNJDB7.js";import{p as u,q as h}from"./chunk-ZWQEMYA4.js";import{W as f,Y as m,_a as T}from"./chunk-Q23SA7M6.js";import{oa as A,x as d}from"./chunk-KBQXBPIW.js";import{b as K}from"./chunk-NBWNTERD.js";import{o as w,q as l}from"./chunk-FJHLV356.js";w();l();K();T();A();var P=(o,t)=>async(a,e,c)=>{let r=`0/${a}`,{extendedPublicKey:s}=d(c,{path:t})||{},{hardwareDerivePubKey:i,getAddressByPublicKey:p}=await b(),n=await i(s,r),y=await p(0,{publicKey:n,addressType:g[o]});e[m][o]={path:`${t}/${r}`,publicKey:n,address:y}},D=async(o,t,a)=>{t[m]={};for(let e=0;e<h.length;e++){let{type:c,basePath:r}=h[e];await P(c,r)(o,t,a)}},M=(o,t)=>async(a,e,c)=>{let r=t+a,{extendedPublicKey:s}=d(c,{path:u})||{},{hardwareDerivePubKey:i,getAddressByPublicKey:p}=await b(),n=await i(s,r),y=await p(60,{publicKey:n});e[f][o]={path:`${u}/${r}`,address:y}};export{D as a,M as b};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-RZDDSSXU.js.map
