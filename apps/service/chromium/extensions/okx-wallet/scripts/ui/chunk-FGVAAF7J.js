import{wa as i,za as n}from"./chunk-N4B7HQY5.js";import{d as s,f as c}from"./chunk-TKFT6XV3.js";import{G as o}from"./chunk-E44TZGUB.js";import{o as a,q as d}from"./chunk-FJHLV356.js";a();d();n();c();async function p(e){try{return await s().addAddressBook(e)}catch(r){throw r?.message!==i&&o.error({title:r?.message}),r}}async function A(e,r){try{return await s().updateAddressBook(e,r)}catch(t){return o.error({title:t?.message}),t}}async function g(e){try{return await s().removeAddressBook(e)}catch(r){throw o.error({title:r?.message}),r}}async function k(e,r){try{return await s().addRecentlyAddress(e,r)}catch(t){return o.error({title:t?.message}),t}}export{p as a,A as b,g as c,k as d};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-FGVAAF7J.js.map
