(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[443],{360:(e,t,r)=>{"use strict";r.d(t,{A:()=>d});var n=r(7876),s=r(7328),a=r.n(s),i=r(8230),o=r.n(i),c=r(9099);function d(e){let{children:t}=e,r=(0,c.useRouter)();return(0,n.jsxs)("div",{className:"min-h-screen flex flex-col bg-gray-100",children:[(0,n.jsxs)(a(),{children:[(0,n.jsx)("title",{children:"簡易会計システム"}),(0,n.jsx)("meta",{name:"description",content:"簡易会計・確定申告支援システム"}),(0,n.jsx)("link",{rel:"icon",href:"/favicon.ico"})]}),(0,n.jsx)("header",{className:"bg-white shadow",children:(0,n.jsx)("div",{className:"container mx-auto p-4",children:(0,n.jsxs)("div",{className:"flex justify-between items-center",children:[(0,n.jsx)(o(),{href:"/",className:"text-2xl font-bold",children:"簡易会計システム"}),(0,n.jsx)("nav",{className:"hidden md:block",children:(0,n.jsx)("ul",{className:"flex space-x-6",children:[{href:"/",label:"ホーム"},{href:"/transactions",label:"仕訳入力"},{href:"/documents",label:"帳票作成"},{href:"/reports",label:"財務レポート"},{href:"/settings",label:"設定"}].map(e=>(0,n.jsx)("li",{children:(0,n.jsx)(o(),{href:e.href,className:"".concat(r.pathname===e.href?"text-blue-500 font-medium":"text-gray-600 hover:text-blue-500"),children:e.label})},e.href))})}),(0,n.jsx)("button",{className:"md:hidden",children:(0,n.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",className:"w-6 h-6",children:(0,n.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M4 6h16M4 12h16M4 18h16"})})})]})})}),(0,n.jsx)("main",{className:"flex-grow py-6",children:t}),(0,n.jsx)("footer",{className:"bg-white shadow-inner mt-auto",children:(0,n.jsx)("div",{className:"container mx-auto p-4 text-center text-gray-600",children:(0,n.jsx)("p",{children:"\xa9 2025 簡易会計システム"})})})]})}},3081:(e,t,r)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/transactions/[id]",function(){return r(5687)}])},5019:(e,t,r)=>{"use strict";let n,s;r.d(t,{q:()=>N});let a=(e,t)=>t.some(t=>e instanceof t),i=new WeakMap,o=new WeakMap,c=new WeakMap,d={get(e,t,r){if(e instanceof IDBTransaction){if("done"===t)return i.get(e);if("store"===t)return r.objectStoreNames[1]?void 0:r.objectStore(r.objectStoreNames[0])}return l(e[t])},set:(e,t,r)=>(e[t]=r,!0),has:(e,t)=>e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e};function l(e){if(e instanceof IDBRequest)return function(e){let t=new Promise((t,r)=>{let n=()=>{e.removeEventListener("success",s),e.removeEventListener("error",a)},s=()=>{t(l(e.result)),n()},a=()=>{r(e.error),n()};e.addEventListener("success",s),e.addEventListener("error",a)});return c.set(t,e),t}(e);if(o.has(e))return o.get(e);let t=function(e){if("function"==typeof e)return(s||(s=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(e)?function(...t){return e.apply(u(this),t),l(this.request)}:function(...t){return l(e.apply(u(this),t))};return(e instanceof IDBTransaction&&function(e){if(i.has(e))return;let t=new Promise((t,r)=>{let n=()=>{e.removeEventListener("complete",s),e.removeEventListener("error",a),e.removeEventListener("abort",a)},s=()=>{t(),n()},a=()=>{r(e.error||new DOMException("AbortError","AbortError")),n()};e.addEventListener("complete",s),e.addEventListener("error",a),e.addEventListener("abort",a)});i.set(e,t)}(e),a(e,n||(n=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])))?new Proxy(e,d):e}(e);return t!==e&&(o.set(e,t),c.set(t,e)),t}let u=e=>c.get(e),h=["get","getKey","getAll","getAllKeys","count"],m=["put","add","delete","clear"],x=new Map;function b(e,t){if(!(e instanceof IDBDatabase&&!(t in e)&&"string"==typeof t))return;if(x.get(t))return x.get(t);let r=t.replace(/FromIndex$/,""),n=t!==r,s=m.includes(r);if(!(r in(n?IDBIndex:IDBObjectStore).prototype)||!(s||h.includes(r)))return;let a=async function(e,...t){let a=this.transaction(e,s?"readwrite":"readonly"),i=a.store;return n&&(i=i.index(t.shift())),(await Promise.all([i[r](...t),s&&a.done]))[0]};return x.set(t,a),a}d=(e=>({...e,get:(t,r,n)=>b(t,r)||e.get(t,r,n),has:(t,r)=>!!b(t,r)||e.has(t,r)}))(d);let p=["continue","continuePrimaryKey","advance"],j={},g=new WeakMap,f=new WeakMap,v={get(e,t){if(!p.includes(t))return e[t];let r=j[t];return r||(r=j[t]=function(...e){g.set(this,f.get(this)[t](...e))}),r}};async function*y(...e){let t=this;if(t instanceof IDBCursor||(t=await t.openCursor(...e)),!t)return;let r=new Proxy(t,v);for(f.set(r,t),c.set(r,u(t));t;)yield r,t=await (g.get(r)||t.continue()),g.delete(r)}function w(e,t){return t===Symbol.asyncIterator&&a(e,[IDBIndex,IDBObjectStore,IDBCursor])||"iterate"===t&&a(e,[IDBIndex,IDBObjectStore])}async function N(){return function(e,t,{blocked:r,upgrade:n,blocking:s,terminated:a}={}){let i=indexedDB.open(e,1),o=l(i);return n&&i.addEventListener("upgradeneeded",e=>{n(l(i.result),e.oldVersion,e.newVersion,l(i.transaction),e)}),r&&i.addEventListener("blocked",e=>r(e.oldVersion,e.newVersion,e)),o.then(e=>{a&&e.addEventListener("close",()=>a()),s&&e.addEventListener("versionchange",e=>s(e.oldVersion,e.newVersion,e))}).catch(()=>{}),o}("AccountingAppDB",0,{upgrade(e){if(!e.objectStoreNames.contains("transactions")){let t=e.createObjectStore("transactions",{keyPath:"id"});t.createIndex("date","date"),t.createIndex("debitAccount","debitAccount"),t.createIndex("creditAccount","creditAccount")}if(!e.objectStoreNames.contains("documents")){let t=e.createObjectStore("documents",{keyPath:"id"});t.createIndex("type","type"),t.createIndex("date","date")}e.objectStoreNames.contains("settings")||e.createObjectStore("settings",{keyPath:"id"})}})}d=(e=>({...e,get:(t,r,n)=>w(t,r)?y:e.get(t,r,n),has:(t,r)=>w(t,r)||e.has(t,r)}))(d)},5687:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>c});var n=r(7876),s=r(4232),a=r(9099),i=r(360),o=r(5019);function c(){let e=(0,a.useRouter)(),{id:t}=e.query,r=Array.isArray(t)?t[0]:t,[c,d]=(0,s.useState)(null),[l,u]=(0,s.useState)(!1),[h,m]=(0,s.useState)(!0),[x,b]=(0,s.useState)(""),[p,j]=(0,s.useState)(!1),g=["現金","普通預金","売上","売掛金","買掛金","仕入","旅費交通費","通信費","消耗品費","水道光熱費","家賃","雑費"];(0,s.useEffect)(()=>{!async function(){try{if(!r)return;let e=(await (0,o.q)()).transaction("transactions","readonly").objectStore("transactions"),t=await e.get(r);if(t){let e=new Date(t.date).toISOString().split("T")[0];d({...t,date:e})}else b("取引データが見つかりませんでした");m(!1)}catch(e){console.error("取引データの取得に失敗しました:",e),b("データの読み込み中にエラーが発生しました"),m(!1)}}()},[r]);let f=e=>{let{name:t,value:r}=e.target;d({...c,[t]:"amount"===t?""===r?"":Number(r):r})},v=async e=>{e.preventDefault(),j(!0),b("");try{let e=(await (0,o.q)()).transaction("transactions","readwrite"),t=e.objectStore("transactions"),r={...c,date:new Date(c.date).toISOString(),updatedAt:new Date().toISOString()};await t.put(r),await e.oncomplete,u(!1),d({...r,date:r.date.split("T")[0]}),j(!1)}catch(e){console.error("取引の更新に失敗しました:",e),b("取引の更新中にエラーが発生しました"),j(!1)}},y=async()=>{if(confirm("この取引を削除してもよろしいですか？この操作は元に戻せません。"))try{let t=(await (0,o.q)()).transaction("transactions","readwrite"),n=t.objectStore("transactions");await n.delete(r),await t.oncomplete,e.push("/transactions")}catch(e){console.error("取引の削除に失敗しました:",e),b("取引の削除中にエラーが発生しました")}};return h?(0,n.jsx)(i.A,{children:(0,n.jsx)("div",{className:"container mx-auto p-4",children:(0,n.jsx)("p",{className:"text-center py-8",children:"データ読み込み中..."})})}):c||h?(0,n.jsx)(i.A,{children:(0,n.jsxs)("div",{className:"container mx-auto p-4",children:[(0,n.jsxs)("div",{className:"flex justify-between items-center mb-6",children:[(0,n.jsx)("h1",{className:"text-2xl font-bold",children:l?"取引の編集":"取引の詳細"}),(0,n.jsx)("div",{className:"flex gap-2",children:l?(0,n.jsx)("button",{onClick:()=>u(!1),className:"px-4 py-2 border rounded",disabled:p,children:"キャンセル"}):(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("button",{onClick:()=>u(!0),className:"px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600",children:"編集"}),(0,n.jsx)("button",{onClick:y,className:"px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600",children:"削除"})]})})]}),x&&(0,n.jsx)("div",{className:"bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4",children:x}),l?(0,n.jsxs)("form",{onSubmit:v,className:"bg-white p-6 rounded shadow",children:[(0,n.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 mb-4",children:[(0,n.jsxs)("div",{children:[(0,n.jsx)("label",{htmlFor:"date",className:"block text-gray-700",children:"日付"}),(0,n.jsx)("input",{type:"date",id:"date",name:"date",value:c.date,onChange:f,className:"w-full p-2 border border-gray-300 rounded"})]}),(0,n.jsxs)("div",{children:[(0,n.jsx)("label",{htmlFor:"amount",className:"block text-gray-700",children:"金額"}),(0,n.jsx)("input",{type:"number",id:"amount",name:"amount",value:c.amount,onChange:f,className:"w-full p-2 border border-gray-300 rounded",required:!0})]})]}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("label",{htmlFor:"description",className:"block text-gray-700",children:"取引内容"}),(0,n.jsx)("input",{type:"text",id:"description",name:"description",value:c.description,onChange:f,className:"w-full p-2 border border-gray-300 rounded",required:!0})]}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("label",{htmlFor:"debitAccount",className:"block text-gray-700",children:"借方勘定"}),(0,n.jsx)("select",{id:"debitAccount",name:"debitAccount",value:c.debitAccount,onChange:f,className:"w-full p-2 border border-gray-300 rounded",required:!0,children:g.map(e=>(0,n.jsx)("option",{value:e,children:e},e))})]}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("label",{htmlFor:"creditAccount",className:"block text-gray-700",children:"貸方勘定"}),(0,n.jsx)("select",{id:"creditAccount",name:"creditAccount",value:c.creditAccount,onChange:f,className:"w-full p-2 border border-gray-300 rounded",required:!0,children:g.map(e=>(0,n.jsx)("option",{value:e,children:e},e))})]}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("label",{htmlFor:"memo",className:"block text-gray-700",children:"メモ"}),(0,n.jsx)("textarea",{id:"memo",name:"memo",value:c.memo||"",onChange:f,className:"w-full p-2 border border-gray-300 rounded"})]}),(0,n.jsx)("button",{type:"submit",className:"w-full py-2 bg-green-500 text-white rounded hover:bg-green-600",disabled:p,children:p?"保存中...":"保存"})]}):(0,n.jsxs)("div",{className:"bg-white p-6 rounded shadow",children:[(0,n.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 mb-4",children:[(0,n.jsxs)("div",{children:[(0,n.jsx)("strong",{children:"日付:"})," ",c.date]}),(0,n.jsxs)("div",{children:[(0,n.jsx)("strong",{children:"金額:"})," ",c.amount]})]}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("strong",{children:"取引内容:"})," ",c.description]}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("strong",{children:"借方勘定:"})," ",c.debitAccount]}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("strong",{children:"貸方勘定:"})," ",c.creditAccount]}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("strong",{children:"メモ:"})," ",c.memo||"なし"]})]})]})}):(0,n.jsx)(i.A,{children:(0,n.jsxs)("div",{className:"container mx-auto p-4",children:[(0,n.jsx)("div",{className:"bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4",children:x||"取引データが見つかりませんでした"}),(0,n.jsx)("button",{onClick:()=>e.push("/transactions"),className:"px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600",children:"取引一覧に戻る"})]})})}}},e=>{var t=t=>e(e.s=t);e.O(0,[8,636,593,792],()=>t(3081)),_N_E=e.O()}]);