(function(n,t,i){"use strict";function s(n,t){return typeof t!="object"&&(t=t()),Object.keys(t).forEach(function(i){n[i]=t[i]}),n}function p(n){return{from:function(t){return n.prototype=Object.create(t.prototype),n.prototype.constructor=n,{extend:function(i){s(n.prototype,typeof i!="object"?i(t.prototype):i)}}}}}function w(n,t){return t(n)}function u(n,t){function cr(){b.on("versionchange",function(){b.close();b.on("error").fire(new nt("Database version changed by other database connection."))})}function gi(n){this._cfg={version:n,storesSource:null,dbschema:{},tables:{},contentUpgrade:null};this.stores({})}function lr(n,t,i,u){var e,f,s,h,l,c;if(n===0)Object.keys(st).forEach(function(n){nr(t,n,st[n].primKey,st[n].indexes)}),e=b._createTransaction(yt,fi,st),e.idbtrans=t,e.idbtrans.onerror=o(i,["populating database"]),e.on("error").subscribe(i),r.newPSD(function(){r.PSD.trans=e;try{b.on("populate").fire(e)}catch(n){u.onerror=t.onerror=function(n){n.preventDefault()};try{t.abort()}catch(f){}t.db.close();i(n)}});else{if(f=[],s=ui.filter(function(t){return t._cfg.version===n})[0],!s)throw new nt("Dexie specification of currently installed DB version is missing");st=b._dbSchema=s._cfg.dbschema;h=!1;l=ui.filter(function(t){return t._cfg.version>n});l.forEach(function(n){var e=st,r=n._cfg.dbschema,u;or(e,t);or(r,t);st=b._dbSchema=r;u=ar(e,r);u.add.forEach(function(n){f.push(function(t,i){nr(t,n[0],n[1].primKey,n[1].indexes);i()})});u.change.forEach(function(n){if(n.recreate)throw new nt("Not yet support for changing primary key");else f.push(function(t,i){var r=t.objectStore(n.name);n.add.forEach(function(n){tr(r,n)});n.change.forEach(function(n){r.deleteIndex(n.name);tr(r,n)});n.del.forEach(function(n){r.deleteIndex(n)});i()})});n._cfg.contentUpgrade&&f.push(function(t,u){var f,e;h=!0;f=b._createTransaction(yt,[].slice.call(t.db.objectStoreNames,0),r);f.idbtrans=t;e=0;f._promise=w(f._promise,function(n){return function(t,i,r){function f(n){return function(){n.apply(this,arguments);--e==0&&u()}}return++e,n.call(this,t,function(n,t){arguments[0]=f(n);arguments[1]=f(t);i.apply(this,arguments)},r)}});t.onerror=o(i,["running upgrader function for version",n._cfg.version]);f.on("error").subscribe(i);n._cfg.contentUpgrade(f);e===0&&u()});h&&dr()||f.push(function(n,t){yr(r,n);t()})});c=function(){try{f.length?f.shift()(t,c):vr(st,t)}catch(n){u.onerror=t.onerror=function(n){n.preventDefault()};try{t.abort()}catch(r){}t.db.close();i(n)}};c()}}function ar(n,t){var f={del:[],add:[],change:[]},r,e,o,i,c,s,u,l,h;for(r in n)t[r]||f.del.push(r);for(r in t)if(e=n[r],o=t[r],e)if(i={name:r,def:t[r],recreate:!1,del:[],add:[],change:[]},e.primKey.src!==o.primKey.src)i.recreate=!0,f.change.push(i);else{c=e.indexes.reduce(function(n,t){return n[t.name]=t,n},{});s=o.indexes.reduce(function(n,t){return n[t.name]=t,n},{});for(u in c)s[u]||i.del.push(u);for(u in s)l=c[u],h=s[u],l?l.src!==h.src&&i.change.push(h):i.add.push(h);(i.recreate||i.del.length>0||i.add.length>0||i.change.length>0)&&f.change.push(i)}else f.add.push([r,o]);return f}function nr(n,t,i,r){var u=n.db.createObjectStore(t,i.keyPath?{keyPath:i.keyPath,autoIncrement:i.auto}:{autoIncrement:i.auto});return r.forEach(function(n){tr(u,n)}),u}function vr(n,t){Object.keys(n).forEach(function(i){t.db.objectStoreNames.contains(i)||nr(t,i,n[i].primKey,n[i].indexes)})}function yr(n,t){for(var u,r=0;r<t.db.objectStoreNames.length;++r)u=t.db.objectStoreNames[r],(n[u]===null||n[u]===i)&&t.db.deleteObjectStore(u)}function tr(n,t){n.createIndex(t.name,t.keyPath,{unique:t.unique,multiEntry:t.multi})}function pr(n,t){throw new nt("Table "+t[0]+" not part of transaction. Original Scope Function Source: "+u.Promise.PSD.trans.scopeFunc.toString());}function oi(n,t,i,r){this.name=n;this.schema=i;this.hook=dt[n]?dt[n].hook:v(null,{creating:[at,f],reading:[lt,tt],updating:[vt,f],deleting:[wt,f]});this._tpf=t;this._collClass=r||ai}function wi(n,t,i,r){oi.call(this,n,t,i,r||rr)}function ir(n,t,i,r){function o(n,t,i,r){return s._promise(n,i,r)}var s=this,f,u,e;for(this.db=b,this.mode=n,this.storeNames=t,this.idbtrans=null,this.on=v(this,["complete","error"],"abort"),this._reculock=0,this._blockedFuncs=[],this._psd=null,this.active=!0,this._dbschema=i,r&&(this.parent=r),this._tpf=o,this.tables=Object.create(di),f=t.length-1;f!==-1;--f)u=t[f],e=b._tableFactory(n,i[u],o),this.tables[u]=e,this[u]||(this[u]=e)}function li(n,t,i){this._ctx={table:n,index:t===":id"?null:t,collClass:n._collClass,or:i}}function ai(n,t){var r=null,u=null,i;if(t)try{r=t()}catch(f){u=f}i=n._ctx;this._ctx={table:i.table,index:i.index,isPrimKey:!i.index||i.table.schema.primKey.keyPath&&i.index===i.table.schema.primKey.name,range:r,op:"openCursor",dir:"next",unique:"",algorithm:null,filter:null,isMatch:null,offset:0,limit:Infinity,error:u,or:i.or}}function rr(){ai.apply(this,arguments)}function wr(n,t){return n._cfg.version-t._cfg.version}function ur(n,t,i,u,f,e){i.forEach(function(i){var o=b._tableFactory(u,f[i],t);n.forEach(function(n){n[i]||(e?Object.defineProperty(n,i,{configurable:!0,enumerable:!0,get:function(){var n=r.PSD&&r.PSD.trans;return n&&n.db===b?n.tables[i]:o}}):n[i]=o)})})}function br(n){n.forEach(function(n){for(var t in n)n[t]instanceof oi&&delete n[t]})}function bi(n,t,i,u,f,e){var s=r.PSD;e=e||tt;n.onerror||(n.onerror=o(f));n.onsuccess=t?d(function(){var r=n.result,o;r?(o=function(){r.continue()},t(r,function(n){o=n},u,f)&&i(e(r.value),r,function(n){o=n}),o()):u()},f,s):d(function(){var t=n.result,r;t?(r=function(){t.continue()},i(e(t.value),t,function(n){r=n}),r()):u()},f,s)}function kr(n){var t=[];return n.split(",").forEach(function(n){n=n.trim();var i=n.replace("&","").replace("++","").replace("*",""),r=i.indexOf("[")!==0?i:n.substring(n.indexOf("[")+1,n.indexOf("]")).split("+");t.push(new a(i,r||null,n.indexOf("&")!==-1,n.indexOf("*")!==-1,n.indexOf("++")!==-1,Array.isArray(r),r.indexOf(".")!==-1))}),t}function ii(n,t){return n<t?-1:n>t?1:0}function fr(n,t){return n<t?1:n>t?-1:0}function er(n){return function(t,i){for(var r=0,u;;){if(u=n(t[r],i[r]),u!==0)return u;if(++r,r===t.length||r===i.length)return n(t.length,i.length)}}}function ki(n,t){return n?t?function(){return n.apply(this,arguments)&&t.apply(this,arguments)}:n:t}function dr(){return navigator.userAgent.indexOf("Trident")>=0||navigator.userAgent.indexOf("MSIE")>=0}function gr(){if(b.verno=it.version/10,b._dbSchema=st={},fi=[].slice.call(it.objectStoreNames,0),fi.length!==0){var n=it.transaction(ot(fi),"readonly");fi.forEach(function(t){for(var u,s,r=n.objectStore(t),i=r.keyPath,f=i&&typeof i=="string"&&i.indexOf(".")!==-1,h=new a(i,i||"",!1,!1,!!r.autoIncrement,i&&typeof i!="string",f),o=[],e=0;e<r.indexNames.length;++e)u=r.index(r.indexNames[e]),i=u.keyPath,f=i&&typeof i=="string"&&i.indexOf(".")!==-1,s=new a(u.name,i,!!u.unique,!!u.multiEntry,!1,i&&typeof i!="string",f),o.push(s);st[t]=new et(t,h,o,{})});ur([dt],b._transPromiseFactory,Object.keys(st),yt,st)}}function or(n,t){for(var i,r,u,o,s=t.db.objectStoreNames,f=0;f<s.length;++f)for(i=s[f],r=t.objectStore(i),u=0;u<r.indexNames.length;++u){var h=r.indexNames[u],e=r.index(h).keyPath,c=typeof e=="string"?e:"["+[].slice.call(e).join("+")+"]";n[i]&&(o=n[i].idxByName[c],o&&(o.name=h))}}var hr=t&&t.addons||u.addons,si=u.dependencies,vi=si.indexedDB,kt=si.IDBKeyRange,nu=si.IDBTransaction,tu=si.DOMError,yi=si.TypeError,nt=si.Error,st=this._dbSchema={},ui=[],fi=[],dt={},di={},it=null,hi=!0,ei=null,pi=!1,ti="readonly",yt="readwrite",b=this,ri=[],ci=!0,sr=!!ct();this.version=function(n){if(it)throw new nt("Cannot add version when database is open");this.verno=Math.max(this.verno,n);var t=ui.filter(function(t){return t._cfg.version===n})[0];return t?t:(t=new gi(n),ui.push(t),ui.sort(wr),t)};s(gi.prototype,{stores:function(n){var i,t;return this._cfg.storesSource=this._cfg.storesSource?s(this._cfg.storesSource,n):n,i={},ui.forEach(function(n){s(i,n._cfg.storesSource)}),t=this._cfg.dbschema={},this._parseStoresSpec(i,t),st=b._dbSchema=t,br([dt,b,di]),ur([di],pr,Object.keys(t),yt,t),ur([dt,b,this._cfg.tables],b._transPromiseFactory,Object.keys(t),yt,t,!0),fi=Object.keys(t),this},upgrade:function(n){var t=this;return k(function(){n(b._createTransaction(yt,Object.keys(t._cfg.dbschema),t._cfg.dbschema))}),this._cfg.contentUpgrade=n,this},_parseStoresSpec:function(n,t){Object.keys(n).forEach(function(i){if(n[i]!==null){var u={},f=kr(n[i]),r=f.shift();if(r.multi)throw new nt("Primary key cannot be multi-valued");r.keyPath&&h(u,r.keyPath,r.auto?0:r.keyPath);f.forEach(function(n){if(n.auto)throw new nt("Only primary key can be marked as autoIncrement (++)");if(!n.keyPath)throw new nt("Index must have a name and cannot be an empty string");h(u,n.keyPath,n.compound?n.keyPath.map(function(){return""}):"")});t[i]=new et(i,r,f,u)}})}});this._allTables=dt;this._tableFactory=function(n,t,i){return n===ti?new oi(t.name,i,t,ai):new wi(t.name,i,t)};this._createTransaction=function(n,t,i,r){return new ir(n,t,i,r)};this._transPromiseFactory=function(n,t,i){var f,u;return!hi||r.PSD&&r.PSD.letThrough?(u=b._createTransaction(n,t,st),u._promise(n,function(n,t){u.error(function(n){b.on("error").fire(n)});i(function(t){u.complete(function(){n(t)})},t,u)})):f=new r(function(r,u){ri.push({resume:function(){var e=b._transPromiseFactory(n,t,i);f.onuncatched=e.onuncatched;e.then(r,u)}})})};this._whenReady=function(n){return!e&&hi&&(!r.PSD||!r.PSD.letThrough)?new r(function(t,i){ri.push({resume:function(){n(t,i)}})}):new r(n)};this.verno=0;this.open=function(){return new r(function(t,i){function f(n){try{u.transaction.abort()}catch(t){}pi=!1;ei=n;hi=!1;i(ei);ri.forEach(function(n){n.resume()});ri=[]}if(e&&t(b),it||pi)throw new nt("Database already opened or being opened");var u,s=!1;try{if(ei=null,pi=!0,ui.length>0&&(ci=!1),!vi)throw new nt("indexedDB API not found. If using IE10+, make sure to run your code on a server URL (not locally). If using Safari, make sure to include indexedDB polyfill.");if(u=ci?vi.open(n):vi.open(n,Math.round(b.verno*10)),!u)throw new nt("IndexedDB API not available");u.onerror=o(f,["opening database",n]);u.onblocked=function(n){b.on("blocked").fire(n)};u.onupgradeneeded=d(function(t){var i,r;ci&&!b._allowEmptyDB?(u.onerror=function(n){n.preventDefault()},u.transaction.abort(),u.result.close(),i=vi.deleteDatabase(n),i.onsuccess=i.onerror=function(){f(new nt("Database '"+n+"' doesnt exist"))}):(t.oldVersion===0&&(s=!0),u.transaction.onerror=o(f),r=t.oldVersion>Math.pow(2,62)?0:t.oldVersion,lr(r/10,u.transaction,f,u))},f);u.onsuccess=d(function(){pi=!1;it=u.result;ci?gr():it.objectStoreNames.length>0&&or(st,it.transaction(ot(it.objectStoreNames),ti));it.onversionchange=b.on("versionchange").fire;sr||ft(function(t){if(t.indexOf(n)===-1)return t.push(n)});r.newPSD(function(){function i(){hi=!1;ri.forEach(function(n){n.resume()});ri=[];t(b)}r.PSD.letThrough=!0;try{var n=b.on.ready.fire();n&&typeof n.then=="function"?n.then(i,function(n){it.close();it=null;f(n)}):y(i)}catch(u){f(u)}})},f)}catch(h){f(h)}})};this.close=function(){it&&(it.close(),it=null,hi=!0,ei=null)};this.delete=function(){var t=arguments;return new r(function(i,r){function u(){b.close();var t=vi.deleteDatabase(n);t.onsuccess=function(){sr||ft(function(t){var i=t.indexOf(n);if(i>=0)return t.splice(i,1)});i()};t.onerror=o(r,["deleting",n]);t.onblocked=function(){b.on("blocked").fire()}}if(t.length>0)throw new nt("Arguments not allowed in db.delete()");pi?ri.push({resume:u}):u()})};this.backendDB=function(){return it};this.isOpen=function(){return it!==null};this.hasFailed=function(){return ei!==null};this.dynamicallyOpened=function(){return ci};this.name=n;Object.defineProperty(this,"tables",{get:function(){return Object.keys(dt).map(function(n){return dt[n]})}});this.on=v(this,"error","populate","blocked",{ready:[bt,f],versionchange:[pt,f]});this.on.ready.subscribe=w(this.on.ready.subscribe,function(n){return function(t,i){function r(){return i||b.on.ready.unsubscribe(r),t.apply(this,arguments)}n.call(this,r);b.isOpen()&&(hi?ri.push({resume:r}):r())}});k(function(){b.on("populate").fire(b._createTransaction(yt,fi,st));b.on("error").fire(new nt)});this.transaction=function(n,t,i){function s(t,e){var s=null,c,a,h;try{if(f)throw f;s=b._createTransaction(n,o,st,u);c=o.map(function(n){return s.tables[n]});c.push(s);h=0;r.newPSD(function(){r.PSD.trans=s;s.scopeFunc=i;u&&(s.idbtrans=u.idbtrans,s._promise=w(s._promise,function(n){return function(t,i,u){function f(n){return function(t){var i;return r._rootExec(function(){i=n(t);r._tickFinalize(function(){--h==0&&s.active&&(s.active=!1,s.on.complete.fire())})}),i}}return++h,n.call(this,t,function(n,t,r){return i(f(n),f(t),r)},u)}}));s.complete(function(){t(a)});s.error(function(n){s.idbtrans&&(s.idbtrans.onerror=ht);try{s.abort()}catch(i){}u&&(u.active=!1,u.on.error.fire(n));var t=e(n);u||t||b.on.error.fire(n)});r._rootExec(function(){a=i.apply(s,c)})});(!s.idbtrans||u&&h===0)&&s._nop()}catch(l){s&&s.idbtrans&&(s.idbtrans.onerror=ht);s&&s.abort();u&&u.on.error.fire(l);y(function(){e(l)||b.on("error").fire(l)})}}var u,e;t=[].slice.call(arguments,1,arguments.length-1);i=arguments[arguments.length-1];u=r.PSD&&r.PSD.trans;u&&u.db===b&&n.indexOf("!")===-1||(u=null);e=n.indexOf("?")!==-1;n=n.replace("!","").replace("?","");var h=Array.isArray(t[0])?t.reduce(function(n,t){return n.concat(t)}):t,f=null,o=h.map(function(n){return typeof n=="string"?n:(n instanceof oi||(f=f||new yi("Invalid type. Arguments following mode must be instances of Table or String")),n.name)});return n=="r"||n==ti?n=ti:n=="rw"||n==yt?n=yt:f=new nt("Invalid transaction mode: "+n),u&&(f||(u&&u.mode===ti&&n===yt&&(e?u=null:f=f||new nt("Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY")),u&&o.forEach(function(n){u.tables.hasOwnProperty(n)||(e?u=null:f=f||new nt("Table "+n+" not included in parent transaction. Parent Transaction function: "+u.scopeFunc.toString()))}))),u?u._promise(n,s,"lock"):b._whenReady(s)};this.table=function(n){if(e&&ci)return new wi(n);if(!dt.hasOwnProperty(n))throw new nt("Table does not exist");return dt[n]};s(oi.prototype,function(){function n(){throw new nt("Current Transaction is READONLY");}return{_trans:function(n,t,i){return this._tpf(n,[this.name],t,i)},_idbstore:function(n,t,i){if(e)return new r(t);var u=this;return this._tpf(n,[this.name],function(n,i,r){t(n,i,r.idbtrans.objectStore(u.name),r)},i)},get:function(n,t){var i=this;return this._idbstore(ti,function(t,r,u){e&&t(i.schema.instanceTemplate);var f=u.get(n);f.onerror=o(r,["getting",n,"from",i.name]);f.onsuccess=function(){t(i.hook.reading.fire(f.result))}}).then(t)},where:function(n){return new li(this,n)},count:function(n){return this.toCollection().count(n)},offset:function(n){return this.toCollection().offset(n)},limit:function(n){return this.toCollection().limit(n)},reverse:function(){return this.toCollection().reverse()},filter:function(n){return this.toCollection().and(n)},each:function(n){var t=this;return e&&n(t.schema.instanceTemplate),this._idbstore(ti,function(i,r,u){var f=u.openCursor();f.onerror=o(r,["calling","Table.each()","on",t.name]);bi(f,null,n,i,r,t.hook.reading.fire)})},toArray:function(n){var t=this;return this._idbstore(ti,function(n,i,r){e&&n([t.schema.instanceTemplate]);var u=[],f=r.openCursor();f.onerror=o(i,["calling","Table.toArray()","on",t.name]);bi(f,null,function(n){u.push(n)},function(){n(u)},i,t.hook.reading.fire)}).then(n)},orderBy:function(n){return new this._collClass(new li(this,n))},toCollection:function(){return new this._collClass(new li(this))},mapToClass:function(n,t){var i,r;return this.schema.mappedClass=n,i=Object.create(n.prototype),t&&ut(i,t),this.schema.instanceTemplate=i,r=function(t){var r,i;if(!t)return t;r=Object.create(n.prototype);for(i in t)t.hasOwnProperty(i)&&(r[i]=t[i]);return r},this.schema.readHook&&this.hook.reading.unsubscribe(this.schema.readHook),this.schema.readHook=r,this.hook("reading",r),n},defineClass:function(n){return this.mapToClass(u.defineClass(n),n)},add:n,put:n,"delete":n,clear:n,update:n}});p(wi).from(oi).extend(function(){return{add:function(n,t){var u=this,r=this.hook.creating.fire;return this._idbstore(yt,function(e,s,l,a){var v={},w,y,p;r!==f&&(w=t||(l.keyPath?c(n,l.keyPath):i),y=r.call(v,w,n,a),w===i&&y!==i&&(l.keyPath?h(n,l.keyPath,y):t=y));p=t?l.add(n,t):l.add(n);p.onerror=o(function(n){if(v.onerror)v.onerror(n);return s(n)},["adding",n,"into",u.name]);p.onsuccess=function(t){var i=l.keyPath;if(i&&h(n,i,t.target.result),v.onsuccess)v.onsuccess(t.target.result);e(p.result)}})},put:function(n,t){var r=this,u=this.hook.creating.fire,e=this.hook.updating.fire;return u!==f||e!==f?this._trans(yt,function(u,f,e){var o=t||r.schema.primKey.keyPath&&c(n,r.schema.primKey.keyPath);o===i?e.tables[r.name].add(n).then(u,f):(e._lock(),n=l(n),e.tables[r.name].where(":id").equals(o).modify(function(){this.value=n}).then(function(i){return i===0?e.tables[r.name].add(n,t):o}).finally(function(){e._unlock()}).then(u,f))}):this._idbstore(yt,function(i,u,f){var e=t?f.put(n,t):f.put(n);e.onerror=o(u,["putting",n,"into",r.name]);e.onsuccess=function(t){var r=f.keyPath;r&&h(n,r,t.target.result);i(e.result)}})},"delete":function(n){return this.hook.deleting.subscribers.length?this.where(":id").equals(n).delete():this._idbstore(yt,function(t,i,r){var u=r.delete(n);u.onerror=o(i,["deleting",n,"from",r.name]);u.onsuccess=function(){t(u.result)}})},clear:function(){return this.hook.deleting.subscribers.length?this.toCollection().delete():this._idbstore(yt,function(n,t,i){var r=i.clear();r.onerror=o(t,["clearing",i.name]);r.onsuccess=function(){n(r.result)}})},update:function(n,t){if(typeof t!="object"||Array.isArray(t))throw new nt("db.update(keyOrObject, modifications). modifications must be an object.");if(typeof n!="object"||Array.isArray(n))return this.where(":id").equals(n).modify(t);Object.keys(t).forEach(function(i){h(n,i,t[i])});var u=c(n,this.schema.primKey.keyPath);return u===i&&r.reject(new nt("Object does not contain its primary key")),this.where(":id").equals(u).modify(t)}}});s(ir.prototype,{_lock:function(){return++this._reculock,this._reculock===1&&r.PSD&&(r.PSD.lockOwnerFor=this),this},_unlock:function(){if(--this._reculock==0)for(r.PSD&&(r.PSD.lockOwnerFor=null);this._blockedFuncs.length>0&&!this._locked();){var n=this._blockedFuncs.shift();try{n()}catch(t){}}return this},_locked:function(){return this._reculock&&(!r.PSD||r.PSD.lockOwnerFor!==this)},_nop:function(n){this.tables[this.storeNames[0]].get(0).then(n)},_promise:function(n,t,i){var f=this;return r.newPSD(function(){var e;return f._locked()?e=new r(function(r,u){f._blockedFuncs.push(function(){f._promise(n,t,i).then(r,u)})}):(e=f.active?new r(function(r,e){if(!f.idbtrans&&n){if(!it)throw ei?new nt("Database not open. Following error in populate, ready or upgrade function made Dexie.open() fail: "+ei):new nt("Database not open");var o=f.idbtrans=it.transaction(ot(f.storeNames),f.mode);o.onerror=function(n){f.on("error").fire(n&&n.target.error);n.preventDefault();f.abort()};o.onabort=function(n){y(function(){f.on("error").fire(new nt("Transaction aborted for unknown reason"))});f.active=!1;f.on("abort").fire(n)};o.oncomplete=function(n){f.active=!1;f.on("complete").fire(n)}}i&&f._lock();try{t(r,e,f)}catch(s){u.ignoreTransaction(function(){f.on("error").fire(s)});f.abort();e(s)}}):r.reject(ni(new nt("Transaction is inactive. Original Scope Function Source: "+f.scopeFunc.toString()))),f.active&&i&&e.finally(function(){f._unlock()})),e.onuncatched=function(n){u.ignoreTransaction(function(){f.on("error").fire(n)});f.abort()},e})},complete:function(n){return this.on("complete",n)},error:function(n){return this.on("error",n)},abort:function(){if(this.idbtrans&&this.active)try{this.active=!1;this.idbtrans.abort();this.on.error.fire(new nt("Transaction Aborted"))}catch(n){}},table:function(n){if(!this.tables.hasOwnProperty(n))throw new nt("Table "+n+" not in transaction");return this.tables[n]}});s(li.prototype,function(){function n(n,t){try{throw t;}catch(i){n._ctx.error=i}return n}function t(n){return Array.prototype.slice.call(n.length===1&&Array.isArray(n[0])?n[0]:n)}function r(n){return n==="next"?function(n){return n.toUpperCase()}:function(n){return n.toLowerCase()}}function u(n){return n==="next"?function(n){return n.toLowerCase()}:function(n){return n.toUpperCase()}}function f(n,t,i,r,u,f){for(var h,s=Math.min(n.length,r.length),o=-1,e=0;e<s;++e){if(h=t[e],h!==r[e])return u(n[e],i[e])<0?n.substr(0,e)+i[e]+i.substr(e+1):u(n[e],r[e])<0?n.substr(0,e)+r[e]+i.substr(e+1):o>=0?n.substr(0,o)+t[o]+i.substr(o+1):null;u(n[e],h)<0&&(o=e)}return s<r.length&&f==="next"?n+i.substr(n.length):s<n.length&&f==="prev"?n.substr(0,i.length):o<0?null:n.substr(0,o)+r[o]+i.substr(o+1)}function i(n,t,i){function a(n){s=r(n);e=u(n);h=n==="next"?ii:fr;c=s(i);o=e(i);l=n}var s,e,h,c,o,l;a("next");n._ondirectionchange=function(n){a(n)};n._addAlgorithm(function(n,i,r){var u=n.key,s,a;return typeof u!="string"?!1:(s=e(u),t(s,o)?(i(function(){n.continue()}),!0):(a=f(u,s,c,o,h,l),a?i(function(){n.continue(a)}):i(r),!1))})}return{between:function(n,t,i,r){return(i=i!==!1,r=r===!0,n>t||n===t&&(i||r)&&!(i&&r))?new this._ctx.collClass(this,function(){return kt.only(n)}).limit(0):new this._ctx.collClass(this,function(){return kt.bound(n,t,!i,!r)})},equals:function(n){return new this._ctx.collClass(this,function(){return kt.only(n)})},above:function(n){return new this._ctx.collClass(this,function(){return kt.lowerBound(n,!0)})},aboveOrEqual:function(n){return new this._ctx.collClass(this,function(){return kt.lowerBound(n)})},below:function(n){return new this._ctx.collClass(this,function(){return kt.upperBound(n,!0)})},belowOrEqual:function(n){return new this._ctx.collClass(this,function(){return kt.upperBound(n)})},startsWith:function(t){return typeof t!="string"?n(new this._ctx.collClass(this),new yi("String expected")):this.between(t,t+String.fromCharCode(65535),!0,!0)},startsWithIgnoreCase:function(t){if(typeof t!="string")return n(new this._ctx.collClass(this),new yi("String expected"));if(t==="")return this.startsWith(t);var r=new this._ctx.collClass(this,function(){return kt.bound(t.toUpperCase(),t.toLowerCase()+String.fromCharCode(65535))});return i(r,function(n,t){return n.indexOf(t)===0},t),r._ondirectionchange=function(){n(r,new nt("reverse() not supported with WhereClause.startsWithIgnoreCase()"))},r},equalsIgnoreCase:function(t){if(typeof t!="string")return n(new this._ctx.collClass(this),new yi("String expected"));var r=new this._ctx.collClass(this,function(){return kt.bound(t.toUpperCase(),t.toLowerCase())});return i(r,function(n,t){return n===t},t),r},anyOf:function(){var f=this._ctx,e=f.table.schema,o=f.index?e.idxByName[f.index]:e.primKey,s=o&&o.compound,n=t(arguments),i=s?er(ii):ii,u,r;return(n.sort(i),n.length===0)?new this._ctx.collClass(this,function(){return kt.only("")}).limit(0):(u=new this._ctx.collClass(this,function(){return kt.bound(n[0],n[n.length-1])}),u._ondirectionchange=function(t){i=t==="next"?ii:fr;s&&(i=er(i));n.sort(i)},r=0,u._addAlgorithm(function(t,u,f){for(var e=t.key;i(e,n[r])>0;)if(++r,r===n.length)return u(f),!1;return i(e,n[r])===0?(u(function(){t.continue()}),!0):(u(function(){t.continue(n[r])}),!1)}),u)},notEqual:function(n){return this.below(n).or(this._ctx.index).above(n)},noneOf:function(){var i=this._ctx,f=i.table.schema,e=i.index?f.idxByName[i.index]:f.primKey,h=e&&e.compound,n=t(arguments),o,r,s,u;return n.length===0?new this._ctx.collClass(this):(o=h?er(ii):ii,n.sort(o),r=n.reduce(function(n,t){return n?n.concat([[n[n.length-1][1],t]]):[[null,t]]},null),r.push([n[n.length-1],null]),s=this,u=i.index,r.reduce(function(n,t){return n?t[1]===null?n.or(u).above(t[0]):n.or(u).between(t[0],t[1],!1,!1):s.below(t[1])},null))},startsWithAnyOf:function(){function h(n){return n>f[r]}function c(n){return n<i[r]}var s=this._ctx,i=t(arguments),f,u,r,e,o;return i.every(function(n){return typeof n=="string"})?i.length===0?new s.collClass(this,function(){return kt.only("")}).limit(0):(f=i.map(function(n){return n+String.fromCharCode(65535)}),u=ii,i.sort(u),r=0,e=h,o=new s.collClass(this,function(){return kt.bound(i[0],i[i.length-1]+String.fromCharCode(65535))}),o._ondirectionchange=function(n){n==="next"?(e=h,u=ii):(e=c,u=fr);i.sort(u);f.sort(u)},o._addAlgorithm(function(n,t,o){for(var s=n.key;e(s);)if(++r,r===i.length)return t(o),!1;return s>=i[r]&&s<=f[r]?(t(function(){n.continue()}),!0):(t(function(){u===ii?n.continue(i[r]):n.continue(f[r])}),!1)}),o):n(new s.collClass(this),new yi("startsWithAnyOf() only works with strings"))}}});s(ai.prototype,function(){function n(n,t){n.filter=ki(n.filter,t)}function s(n,t){n.isMatch=ki(n.isMatch,t)}function u(n,t){if(n.isPrimKey)return t;var i=n.table.schema.idxByName[n.index];if(!i)throw new nt("KeyPath "+n.index+" on object store "+t.name+" is not indexed");return n.isPrimKey?t:t.index(i.name)}function f(n,t){return u(n,t)[n.op](n.range||null,n.dir+n.unique)}function i(n,t,i,r,u){n.or?function(){function e(){++c==2&&i()}function h(n,i,u){if(!o||o(i,u,e,r)){var f=i.primaryKey.toString();s.hasOwnProperty(f)||(s[f]=!0,t(n,i,u))}}var o=n.filter,s={},l=n.table.schema.primKey.keyPath,c=0;n.or._iterate(h,e,r,u);bi(f(n,u),n.algorithm,h,e,r,n.table.hook.reading.fire)}():bi(f(n,u),ki(n.algorithm,n.filter),t,i,r,n.table.hook.reading.fire)}function t(n){return n.table.schema.instanceTemplate}return{_read:function(n,t){var i=this._ctx;return i.error?i.table._trans(null,function(n,t){t(i.error)}):i.table._idbstore(ti,n).then(t)},_write:function(n){var t=this._ctx;return t.error?t.table._trans(null,function(n,i){i(t.error)}):t.table._idbstore(yt,n,"locked")},_addAlgorithm:function(n){var t=this._ctx;t.algorithm=ki(t.algorithm,n)},_iterate:function(n,t,r,u){return i(this._ctx,n,t,r,u)},each:function(n){var r=this._ctx;return e&&n(t(r)),this._read(function(t,u,f){i(r,n,t,u,f)})},count:function(n){var s,t,f;return e?r.resolve(0).then(n):(s=this,t=this._ctx,t.filter||t.algorithm||t.or?(f=0,this._read(function(n,r,u){i(t,function(){return++f,!1},function(){n(f)},r,u)},n)):this._read(function(n,i,r){var f=u(t,r),e=t.range?f.count(t.range):f.count();e.onerror=o(i,["calling","count()","on",s.name]);e.onsuccess=function(i){n(Math.min(i.target.result,Math.max(0,t.limit-t.offset)))}},n))},sortBy:function(n,t){function r(n,t){return t?r(n[i[t]],t-1):n[e]}function o(n,t){var i=r(n,u),e=r(t,u);return i<e?-f:i>e?f:0}var s=this._ctx,i=n.split(".").reverse(),e=i[0],u=i.length-1,f=this._ctx.dir==="next"?1:-1;return this.toArray(function(n){return n.sort(o)}).then(t)},toArray:function(n){var r=this._ctx;return this._read(function(n,u,f){e&&n([t(r)]);var o=[];i(r,function(n){o.push(n)},function(){n(o)},u,f)},n)},offset:function(t){var i=this._ctx;return t<=0?this:(i.offset+=t,i.or||i.algorithm||i.filter?n(i,function(){return--t<0}):n(i,function(n,i){return t===0?!0:t===1?(--t,!1):(i(function(){n.advance(t);t=0}),!1)}),this)},limit:function(t){return this._ctx.limit=Math.min(this._ctx.limit,t),n(this._ctx,function(n,i,r){return--t<=0&&i(r),t>=0}),this},until:function(i,r){var u=this._ctx;return e&&i(t(u)),n(this._ctx,function(n,t,u){return i(n.value)?(t(u),r):!0}),this},first:function(n){return this.limit(1).toArray(function(n){return n[0]}).then(n)},last:function(n){return this.reverse().first(n)},and:function(i){return e&&i(t(this._ctx)),n(this._ctx,function(n){return i(n.value)}),s(this._ctx,i),this},or:function(n){return new li(this._ctx.table,n,this)},reverse:function(){return this._ctx.dir=this._ctx.dir==="prev"?"next":"prev",this._ondirectionchange&&this._ondirectionchange(this._ctx.dir),this},desc:function(){return this.reverse()},eachKey:function(n){var i=this._ctx;return e&&n(c(t(this._ctx),this._ctx.index?this._ctx.table.schema.idxByName[this._ctx.index].keyPath:this._ctx.table.schema.primKey.keyPath)),i.isPrimKey||(i.op="openKeyCursor"),this.each(function(t,i){n(i.key,i)})},eachUniqueKey:function(n){return this._ctx.unique="unique",this.eachKey(n)},keys:function(n){var i=this._ctx,t;return(i.isPrimKey||(i.op="openKeyCursor"),t=[],e)?new r(this.eachKey.bind(this)).then(function(n){return[n]}).then(n):this.each(function(n,i){t.push(i.key)}).then(function(){return t}).then(n)},uniqueKeys:function(n){return this._ctx.unique="unique",this.keys(n)},firstKey:function(n){return this.limit(1).keys(function(n){return n[0]}).then(n)},lastKey:function(n){return this.reverse().firstKey(n)},distinct:function(){var t={};return n(this._ctx,function(n){var i=n.primaryKey.toString(),r=t.hasOwnProperty(i);return t[i]=!0,!r}),this}}});p(rr).from(ai).extend({modify:function(n){var a=this,t=this._ctx,r=t.table.hook,i=r.updating.fire,u=r.deleting.fire;return e&&typeof n=="function"&&n.call({value:t.table.schema.instanceTemplate},t.table.schema.instanceTemplate),this._write(function(r,e,v,y){function st(n,i){var r,u,f;if(et=i.primaryKey,r={primKey:i.primaryKey,value:n},w.call(r,n)!==!1)u=!r.hasOwnProperty("value"),f=u?i.delete():i.update(r.value),++ut,f.onerror=o(function(n){if(p.push(n),nt.push(r.primKey),r.onerror)r.onerror(n);return tt(),!0},u?["deleting",n,"from",t.table.name]:["modifying",n,"on",t.table.name]),f.onsuccess=function(){if(r.onsuccess)r.onsuccess(r.value);++b;tt()};else if(r.onsuccess)r.onsuccess(r.value)}function ot(n){return n&&(p.push(n),nt.push(et)),e(new g("Error modifying one or more objects",p,b,nt))}function tt(){ft&&b+p.length===ut&&(p.length>0?ot():r(b))}var w,k,it,d;typeof n=="function"?w=i===f&&u===f?n:function(t){var f=l(t),e,r;if(n.call(this,t)===!1)return!1;this.hasOwnProperty("value")?(e=gt(f,this.value),r=i.call(this,e,this.primKey,f,y),r&&(t=this.value,Object.keys(r).forEach(function(n){h(t,n,r[n])}))):u.call(this,this.primKey,t,y)}:i===f?(k=Object.keys(n),it=k.length,w=function(t){for(var i,u,f=!1,r=0;r<it;++r)i=k[r],u=n[i],c(t,i)!==u&&(h(t,i,u),f=!0);return f}):(d=n,n=rt(d),w=function(t){var u=!1,r=i.call(this,n,this.primKey,l(t),y);return r&&s(n,r),Object.keys(n).forEach(function(i){var r=n[i];c(t,i)!==r&&(h(t,i,r),u=!0)}),r&&(n=rt(d)),u});var ut=0,b=0,ft=!1,p=[],nt=[],et=null;a._iterate(st,function(){ft=!0;tt()},ot,v)})},"delete":function(){return this.modify(function(){delete this.value})}});s(this,{Collection:ai,Table:oi,Transaction:ir,Version:gi,WhereClause:li,WriteableCollection:rr,WriteableTable:wi});cr();hr.forEach(function(n){n(b)})}function f(){}function tt(n){return n}function lt(n,t){return n===tt?t:function(i){return t(n(i))}}function b(n,t){return function(){n.apply(this,arguments);t.apply(this,arguments)}}function at(n,t){return n===f?t:function(){var f=n.apply(this,arguments),r,u,e;return f!==i&&(arguments[0]=f),r=this.onsuccess,u=this.onerror,delete this.onsuccess,delete this.onerror,e=t.apply(this,arguments),r&&(this.onsuccess=this.onsuccess?b(r,this.onsuccess):r),u&&(this.onerror=this.onerror?b(u,this.onerror):u),e!==i?e:f}}function vt(n,t){return n===f?t:function(){var r=n.apply(this,arguments),f,e,u;return r!==i&&s(arguments[0],r),f=this.onsuccess,e=this.onerror,delete this.onsuccess,delete this.onerror,u=t.apply(this,arguments),f&&(this.onsuccess=this.onsuccess?b(f,this.onsuccess):f),e&&(this.onerror=this.onerror?b(e,this.onerror):e),r===i?u===i?i:u:u===i?r:s(r,u)}}function yt(n,t){return n===f?t:function(){return n.apply(this,arguments)===!1?!1:t.apply(this,arguments)}}function pt(n,t){return n===f?t:function(){return t.apply(this,arguments)===!1?!1:n.apply(this,arguments)}}function wt(n,t){return n===f?t:function(){n.apply(this,arguments);t.apply(this,arguments)}}function bt(n,t){return n===f?t:function(){var i=n.apply(this,arguments),r,u;return i&&typeof i.then=="function"?(r=this,u=arguments,i.then(function(){return t.apply(r,u)})):t.apply(this,arguments)}}function v(t){function i(n,t,i){if(Array.isArray(n))return c(n);if(typeof n=="object")return h(n);t||(t=yt);i||(i=f);var r={subscribers:[],fire:i,subscribe:function(n){r.subscribers.push(n);r.fire=t(r.fire,n)},unsubscribe:function(n){r.subscribers=r.subscribers.filter(function(t){return t!==n});r.fire=r.subscribers.reduce(t,i)}};return u[n]=e[n]=r,r}function h(t){Object.keys(t).forEach(function(r){var f=t[r],u;if(Array.isArray(f))i(r,t[r][0],t[r][1]);else if(f==="asap")u=i(r,null,function(){var t=arguments;u.subscribers.forEach(function(i){y(function(){i.apply(n,t)})})}),u.subscribe=function(n){u.subscribers.indexOf(n)===-1&&u.subscribers.push(n)},u.unsubscribe=function(n){var t=u.subscribers.indexOf(n);t!==-1&&u.subscribers.splice(t,1)};else throw new Error("Invalid event config");})}function c(n){function r(){if(t)return!1;t=!0}var t=!1;n.forEach(function(n){i(n).subscribe(r)})}var o=arguments,u={},e=function(n,i){if(i){var f=[].slice.call(arguments,1),r=u[n];return r.subscribe.apply(r,f),t}if(typeof n=="string")return u[n]},r,s;for(e.addEventType=i,r=1,s=o.length;r<s;++r)i(o[r]);return e}function kt(n){if(!n)throw new Error("Assertion failed");}function y(t){n.setImmediate?setImmediate(t):setTimeout(t,0)}function it(n){var t=setTimeout(n,1e3);clearTimeout(t)}function d(n,t,i){return function(){var u=r.PSD;r.PSD=i;try{n.apply(this,arguments)}catch(f){t(f)}finally{r.PSD=u}}}function c(n,t){var f,r,o,s,u,e;if(n.hasOwnProperty(t))return n[t];if(!t)return n;if(typeof t!="string"){for(f=[],r=0,o=t.length;r<o;++r)s=c(n,t[r]),f.push(s);return f}return(u=t.indexOf("."),u!==-1)?(e=n[t.substr(0,u)],e===i?i:c(e,t.substr(u+1))):i}function h(n,t,r){var u,c,e,f,s,o;if(n&&t!==i)if(typeof t!="string"&&"length"in t)for(kt(typeof r!="string"&&"length"in r),u=0,c=t.length;u<c;++u)h(n,t[u],r[u]);else e=t.indexOf("."),e!==-1?(f=t.substr(0,e),s=t.substr(e+1),s===""?r===i?delete n[f]:n[f]=r:(o=n[f],o||(o=n[f]={}),h(o,s,r))):r===i?delete n[t]:n[t]=r}function dt(n,t){typeof t=="string"?h(n,t,i):"length"in t&&[].map.call(t,function(t){h(n,t,i)})}function rt(n){var i={};for(var t in n)n.hasOwnProperty(t)&&(i[t]=n[t]);return i}function l(n){var t,i,u,r;if(!n||typeof n!="object")return n;if(Array.isArray(n))for(t=[],i=0,u=n.length;i<u;++i)t.push(l(n[i]));else if(n instanceof Date)t=new Date,t.setTime(n.getTime());else{t=n.constructor?Object.create(n.constructor.prototype):{};for(r in n)n.hasOwnProperty(r)&&(t[r]=l(n[r]))}return t}function gt(n,t){var u={};for(var r in n)n.hasOwnProperty(r)&&(t.hasOwnProperty(r)?n[r]!==t[r]&&JSON.stringify(n[r])!=JSON.stringify(t[r])&&(u[r]=t[r]):u[r]=i);for(r in t)t.hasOwnProperty(r)&&!n.hasOwnProperty(r)&&(u[r]=t[r]);return u}function st(n){if(typeof n=="function")return new n;if(Array.isArray(n))return[st(n[0])];if(n&&typeof n=="object"){var t={};return ut(t,n),t}return n}function ut(n,t){Object.keys(t).forEach(function(i){var r=st(t[i]);n[i]=r})}function o(n,t){return function(i){var r=i&&i.target.error||new Error,u;return t&&(u=" occurred when "+t.map(function(n){switch(typeof n){case"function":return n();case"string":return n;default:return JSON.stringify(n)}}).join(" "),r.name?r.toString=function(){return r.name+u+(r.message?". "+r.message:"")}:r=r+u),n(r),i&&(i.stopPropagation&&i.stopPropagation(),i.preventDefault&&i.preventDefault()),!1}}function ni(n){try{throw n;}catch(t){return t}}function ht(n){n.preventDefault()}function ft(n){var t,i=u.dependencies.localStorage;if(!i)return n([]);try{t=JSON.parse(i.getItem("Dexie.DatabaseNames")||"[]")}catch(r){t=[]}n(t)&&i.setItem("Dexie.DatabaseNames",JSON.stringify(t))}function a(n,t,i,r,u,f,e){this.name=n;this.keyPath=t;this.unique=i;this.multi=r;this.auto=u;this.compound=f;this.dotted=e;var o=typeof t=="string"?t:t&&"["+[].join.call(t,"+")+"]";this.src=(i?"&":"")+(r?"*":"")+(u?"++":"")+o}function et(n,t,i,r){this.name=n;this.primKey=t||new a;this.indexes=i||[new a];this.instanceTemplate=r;this.mappedClass=null;this.idxByName=i.reduce(function(n,t){return n[t.name]=t,n},{})}function g(n,t,i,r){this.name="ModifyError";this.failures=t;this.failedKeys=r;this.successCount=i;this.message=t.join("\n")}function ot(n){return n.length===1?n[0]:n}function ct(){var n=u.dependencies.indexedDB,t=n&&(n.getDatabaseNames||n.webkitGetDatabaseNames);return t&&t.bind(n)}var r=function(){function l(n){u.push([n,c.call(arguments,1)])}function p(){var r=u,t,f,i;for(u=[],t=0,f=r.length;t<f;++t)i=r[t],i[0].apply(n,i[1])}function t(n){if(typeof this!="object")throw new TypeError("Promises must be constructed via new");if(typeof n!="function")throw new TypeError("not a function");this._state=null;this._value=null;this._deferreds=[];this._catched=!1;var r=this,u=!0;this._PSD=t.PSD;try{k(this,n,function(n){u?i(a,r,n):a(r,n)},function(n){return u?(i(h,r,n),!1):h(r,n)})}finally{u=!1}}function s(n,f){var h,s,a,v,b,c;if(n._state===null){n._deferreds.push(f);return}if(h=n._state?f.onFulfilled:f.onRejected,h===null)return(n._state?f.resolve:f.reject)(n._value);a=r;r=!1;i=l;try{v=t.PSD;t.PSD=n._PSD;s=h(n._value);n._state||s&&typeof s.then=="function"&&s._state===!1||w(n);f.resolve(s)}catch(y){if(b=f.reject(y),!b&&n.onuncatched)try{n.onuncatched(y)}catch(y){}}finally{if(t.PSD=v,a){do{while(u.length>0)p();if(c=e.pop(),c)try{c()}catch(y){}}while(e.length>0||u.length>0);i=o;r=!0}}}function d(n){var f=r,t;r=!1;i=l;try{n()}finally{if(f){do{while(u.length>0)p();if(t=e.pop(),t)try{t()}catch(s){}}while(e.length>0||u.length>0);i=o;r=!0}}}function w(n){n._catched=!0;n._parent&&w(n._parent)}function a(n,i){var r=t.PSD;t.PSD=n._PSD;try{if(i===n)throw new TypeError("A promise cannot be resolved with itself.");if(i&&(typeof i=="object"||typeof i=="function")&&typeof i.then=="function"){k(n,function(n,t){i.then(n,t)},function(t){a(n,t)},function(t){h(n,t)});return}n._state=!0;n._value=i;b.call(n)}catch(u){h(u)}finally{t.PSD=r}}function h(n,i){var r=t.PSD;if(t.PSD=n._PSD,n._state=!1,n._value=i,b.call(n),!n._catched)try{if(n.onuncatched)n.onuncatched(n._value);t.on.error.fire(n._value)}catch(u){}return t.PSD=r,n._catched}function b(){for(var n=0,t=this._deferreds.length;n<t;n++)s(this,this._deferreds[n]);this._deferreds=[]}function y(n,t,i,r){this.onFulfilled=typeof n=="function"?n:null;this.onRejected=typeof t=="function"?t:null;this.resolve=i;this.reject=r}function k(n,t,i,r){var u=!1;try{t(function(n){u||(u=!0,i(n))},function(t){return u?n._catched:(u=!0,r(t))})}catch(f){return u?void 0:r(f)}}var c=[].slice,o=typeof setImmediate=="undefined"?function(t){var i=arguments;setTimeout(function(){t.apply(n,c.call(i,1))},0)}:setImmediate;it(function(){o=i=l=function(t){var i=arguments;setTimeout(function(){t.apply(n,c.call(i,1))},0)}});var i=o,r=!0,u=[],e=[];return t.on=v(null,"error"),t.all=function(){var n=Array.prototype.slice.call(arguments.length===1&&Array.isArray(arguments[0])?arguments[0]:arguments);return new t(function(t,i){function f(r,e){try{if(e&&(typeof e=="object"||typeof e=="function")){var o=e.then;if(typeof o=="function"){o.call(e,function(n){f(r,n)},i);return}}n[r]=e;--u==0&&t(n)}catch(s){i(s)}}var u,r;if(n.length===0)return t([]);for(u=n.length,r=0;r<n.length;r++)f(r,n[r])})},t.prototype.then=function(n,r){var f=this,u=new t(function(t,u){f._state===null?s(f,new y(n,r,t,u)):i(s,f,new y(n,r,t,u))});return u._PSD=this._PSD,u.onuncatched=this.onuncatched,u._parent=this,u},t.prototype._then=function(n,t){s(this,new y(n,t,f,f))},t.prototype["catch"]=function(n){if(arguments.length===1)return this.then(null,n);var i=arguments[0],r=arguments[1];return typeof i=="function"?this.then(null,function(n){return n instanceof i?r(n):t.reject(n)}):this.then(null,function(n){return n&&n.name===i?r(n):t.reject(n)})},t.prototype["finally"]=function(n){return this.then(function(t){return n(),t},function(i){return n(),t.reject(i)})},t.prototype.onuncatched=null,t.resolve=function(n){var i=new t(function(){});return i._state=!0,i._value=n,i},t.reject=function(n){var i=new t(function(){});return i._state=!1,i._value=n,i},t.race=function(n){return new t(function(t,i){n.map(function(n){n.then(t,i)})})},t.PSD=null,t.newPSD=function(n){var i=t.PSD;t.PSD=i?Object.create(i):{};try{return n()}finally{t.PSD=i}},t._rootExec=d,t._tickFinalize=function(n){if(r)throw new Error("Not in a virtual tick");e.push(n)},t}(),k=function(){},e=!1,nt;p(g).from(Error);u.delete=function(n){var t=new u(n),i=t.delete();return i.onblocked=function(n){t.on("blocked",n);return this},i};u.exists=function(n){return new u(n).open().then(function(n){return n.close(),!0},function(){return!1})};u.getDatabaseNames=function(n){return new r(function(n,t){var r=ct(),i;r?(i=r(),i.onsuccess=function(t){n([].slice.call(t.target.result,0))},i.onerror=o(t)):ft(function(t){return n(t),!1})}).then(n)};u.defineClass=function(n){function t(t){t?s(this,t):e&&ut(this,n)}return t};u.ignoreTransaction=function(n){return r.newPSD(function(){return r.PSD.trans=null,n()})};u.spawn=function(){return n.console&&console.warn("Dexie.spawn() is deprecated. Use Dexie.ignoreTransaction() instead."),u.ignoreTransaction.apply(this,arguments)};u.vip=function(n){return r.newPSD(function(){return r.PSD.letThrough=!0,n()})};Object.defineProperty(u,"currentTransaction",{get:function(){return r.PSD&&r.PSD.trans||null}});u.Promise=r;u.derive=p;u.extend=s;u.override=w;u.events=v;u.getByKeyPath=c;u.setByKeyPath=h;u.delByKeyPath=dt;u.shallowClone=rt;u.deepClone=l;u.addons=[];u.fakeAutoComplete=k;u.asap=y;u.ModifyError=g;u.MultiModifyError=g;u.IndexSpec=a;u.TableSchema=et;nt=n.idbModules&&n.idbModules.shimIndexedDB?n.idbModules:{};u.dependencies={indexedDB:nt.shimIndexedDB||n.indexedDB||n.mozIndexedDB||n.webkitIndexedDB||n.msIndexedDB,IDBKeyRange:nt.IDBKeyRange||n.IDBKeyRange||n.webkitIDBKeyRange,IDBTransaction:nt.IDBTransaction||n.IDBTransaction||n.webkitIDBTransaction,Error:n.Error||String,SyntaxError:n.SyntaxError||String,TypeError:n.TypeError||String,DOMError:n.DOMError||String,localStorage:(typeof chrome!="undefined"&&chrome!==null?chrome.storage:void 0)!=null?null:n.localStorage};u.version=1.2;t("Dexie",u);it(function(){u.fakeAutoComplete=k=it;u.fake=e=!0})}).apply(null,typeof define=="function"&&define.amd?[self||window,function(n,t){define(function(){return t})}]:typeof window!="undefined"&&typeof module!="undefined"&&module.exports?[window,function(n,t){module.exports=t}]:[self||window,function(n,t){(self||window)[n]=t}]);
eval(function(n){"use strict";function r(n){var r=[];return r[n-1]=void 0,r}function u(n,r){return f(n[0]+r[0],n[1]+r[1])}function t(n,r){var u,t;return n[0]==r[0]&&n[1]==r[1]?0:(u=0>n[1],t=0>r[1],u&&!t?-1:!u&&t?1:a(n,r)[1]<0?-1:1)}function f(n,r){var u,t;for(r%=0x10000000000000000,n%=0x10000000000000000,u=r%un,t=Math.floor(n/un)*un,r=r-u+t,n=n-t+u;0>n;)n+=un,r-=un;for(;n>4294967295;)n-=un,r+=un;for(r%=0x10000000000000000;r>0x7fffffff00000000;)r-=0x10000000000000000;for(;-0x8000000000000000>r;)r+=0x10000000000000000;return[n,r]}function i(n){return n>=0?[n,0]:[n+un,-un]}function c(n){return n[0]>=2147483648?~~Math.max(Math.min(n[0]-un,2147483647),-2147483648):~~Math.max(Math.min(n[0],2147483647),-2147483648)}function a(n,r){return f(n[0]-r[0],n[1]-r[1])}function o(n,r){return n.ab=r,n.cb=0,n.O=r.length,n}function e(n){return n.cb>=n.O?-1:255&n.ab[n.cb++]}function v(n){return n.ab=r(32),n.O=0,n}function s(n){var r=n.ab;return r.length=n.O,r}function g(n,r,u,t){l(r,u,n.ab,n.O,t),n.O+=t}function l(n,r,u,t,f){for(var i=0;f>i;++i)u[t+i]=n[r+i]}function C(n,r,u){var t,f,c,a,o="",v=[];for(f=0;5>f;++f){if(c=e(r),-1==c)throw Error("truncated input");v[f]=c<<24>>24}if(t=F({}),!V(t,v))throw Error("corrupted input");for(f=0;64>f;f+=8){if(c=e(r),-1==c)throw Error("truncated input");c=c.toString(16),1==c.length&&(c="0"+c),o=c+""+o}/^0+$|^f+$/i.test(o)?n.M=tn:(a=parseInt(o,16),n.M=a>4294967295?tn:i(a)),n.S=M(t,r,u,n.M)}function z(n,r){return n.Y=v({}),C(n,o({},r),n.Y),n}function p(n,r,u){var t=n.y-r-1;for(0>t&&(t+=n.c);0!=u;--u)t>=n.c&&(t=0),n.x[n.y++]=n.x[t++],n.y>=n.c&&N(n)}function x(n,u){(null==n.x||n.c!=u)&&(n.x=r(u)),n.c=u,n.y=0,n.w=0}function N(n){var r=n.y-n.w;r&&(g(n.T,n.x,n.w,r),n.y>=n.c&&(n.y=0),n.w=n.y)}function d(n,r){var u=n.y-r-1;return 0>u&&(u+=n.c),n.x[u]}function J(n,r){n.x[n.y++]=r,n.y>=n.c&&N(n)}function L(n){N(n),n.T=null}function j(n){return n-=2,4>n?n:3}function B(n){return 4>n?0:10>n?n-3:n-6}function b(n,r){return n.h=r,n.bb=null,n.V=1,n}function k(n){if(!n.V)throw Error("bad state");if(n.bb)throw Error("No encoding");return h(n),n.V}function h(n){var r=U(n.h);if(-1==r)throw Error("corrupted input");n.$=tn,n.Z=n.h.d,(r||t(n.h.U,fn)>=0&&t(n.h.d,n.h.U)>=0)&&(N(n.h.b),L(n.h.b),n.h.a.K=null,n.V=0)}function M(n,r,u,t){return n.a.K=r,L(n.b),n.b.T=u,A(n),n.f=0,n.l=0,n.Q=0,n.R=0,n._=0,n.U=t,n.d=fn,n.G=0,b({},n)}function U(n){var r,f,a,o,e,v;if(v=c(n.d)&n.P,Q(n.a,n.t,(n.f<<4)+v)){if(Q(n.a,n.E,n.f))a=0,Q(n.a,n.r,n.f)?(Q(n.a,n.u,n.f)?(Q(n.a,n.s,n.f)?(f=n._,n._=n.R):f=n.R,n.R=n.Q):f=n.Q,n.Q=n.l,n.l=f):Q(n.a,n.o,(n.f<<4)+v)||(n.f=7>n.f?9:11,a=1),a||(a=q(n.n,n.a,v)+2,n.f=7>n.f?8:11);else if(n._=n.R,n.R=n.Q,n.Q=n.l,a=2+q(n.D,n.a,v),n.f=7>n.f?7:10,e=S(n.k[j(a)],n.a),e>=4){if(o=(e>>1)-1,n.l=(2|1&e)<<o,14>e)n.l+=X(n.J,n.l-e-1,n.a,o);else if(n.l+=T(n.a,o-4)<<4,n.l+=Y(n.q,n.a),0>n.l)return-1==n.l?1:-1}else n.l=e;if(t(i(n.l),n.d)>=0||n.l>=n.m)return-1;p(n.b,n.l,a),n.d=u(n.d,i(a)),n.G=d(n.b,0)}else r=D(n.j,c(n.d),n.G),n.G=7>n.f?E(r,n.a):R(r,n.a,d(n.b,n.l)),J(n.b,n.G),n.f=B(n.f),n.d=u(n.d,cn);return 0}function F(n){n.b={},n.a={},n.t=r(192),n.E=r(12),n.r=r(12),n.u=r(12),n.s=r(12),n.o=r(192),n.k=r(4),n.J=r(114),n.q=H({},4),n.D=m({}),n.n=m({}),n.j={};for(var u=0;4>u;++u)n.k[u]=H({},6);return n}function A(n){n.b.w=0,n.b.y=0,I(n.t),I(n.o),I(n.E),I(n.r),I(n.u),I(n.s),I(n.J),Z(n.j);for(var r=0;4>r;++r)I(n.k[r].z);w(n.D),w(n.n),I(n.q.z),K(n.a)}function V(n,r){var u,t,f,i,c,a,o;if(5>r.length)return 0;for(o=255&r[0],f=o%9,a=~~(o/9),i=a%5,c=~~(a/5),u=0,t=0;4>t;++t)u+=(255&r[1+t])<<8*t;return u>99999999||!W(n,f,i,c)?0:G(n,u)}function G(n,r){return 0>r?0:(n.A!=r&&(n.A=r,n.m=Math.max(n.A,1),x(n.b,Math.max(n.m,4096))),1)}function W(n,r,u,t){if(r>8||u>4||t>4)return 0;P(n.j,u,r);var f=1<<t;return O(n.D,f),O(n.n,f),n.P=f-1,1}function O(n,r){for(;r>n.e;++n.e)n.I[n.e]=H({},3),n.H[n.e]=H({},3)}function q(n,r,u){if(!Q(r,n.N,0))return S(n.I[u],r);var t=8;return t+=Q(r,n.N,1)?8+S(n.L,r):S(n.H[u],r)}function m(n){return n.N=r(2),n.I=r(16),n.H=r(16),n.L=H({},8),n.e=0,n}function w(n){I(n.N);for(var r=0;n.e>r;++r)I(n.I[r].z),I(n.H[r].z);I(n.L.z)}function P(n,u,t){var f,i;if(null==n.F||n.g!=t||n.B!=u)for(n.B=u,n.X=(1<<u)-1,n.g=t,i=1<<n.g+n.B,n.F=r(i),f=0;i>f;++f)n.F[f]=y({})}function D(n,r,u){return n.F[((r&n.X)<<n.g)+((255&u)>>>8-n.g)]}function Z(n){var r,u;for(u=1<<n.g+n.B,r=0;u>r;++r)I(n.F[r].v)}function E(n,r){var u=1;do u=u<<1|Q(r,n.v,u);while(256>u);return u<<24>>24}function R(n,r,u){var t,f,i=1;do if(f=u>>7&1,u<<=1,t=Q(r,n.v,(1+f<<8)+i),i=i<<1|t,f!=t){for(;256>i;)i=i<<1|Q(r,n.v,i);break}while(256>i);return i<<24>>24}function y(n){return n.v=r(768),n}function H(n,u){return n.C=u,n.z=r(1<<u),n}function S(n,r){var u,t=1;for(u=n.C;0!=u;--u)t=(t<<1)+Q(r,n.z,t);return t-(1<<n.C)}function Y(n,r){var u,t,f=1,i=0;for(t=0;n.C>t;++t)u=Q(r,n.z,f),f<<=1,f+=u,i|=u<<t;return i}function X(n,r,u,t){var f,i,c=1,a=0;for(i=0;t>i;++i)f=Q(u,n,r+c),c<<=1,c+=f,a|=f<<i;return a}function Q(n,r,u){var t,f=r[u];return t=(n.i>>>11)*f,(-2147483648^t)>(-2147483648^n.p)?(n.i=t,r[u]=f+(2048-f>>>5)<<16>>16,-16777216&n.i||(n.p=n.p<<8|e(n.K),n.i<<=8),0):(n.i-=t,n.p-=t,r[u]=f-(f>>>5)<<16>>16,-16777216&n.i||(n.p=n.p<<8|e(n.K),n.i<<=8),1)}function T(n,r){var u,t,f=0;for(u=r;0!=u;--u)n.i>>>=1,t=n.p-n.i>>>31,n.p-=n.i&t-1,f=f<<1|1-t,-16777216&n.i||(n.p=n.p<<8|e(n.K),n.i<<=8);return f}function K(n){n.p=0,n.i=-1;for(var r=0;5>r;++r)n.p=n.p<<8|e(n.K)}function I(n){for(var r=n.length-1;r>=0;--r)n[r]=1024}function _(n){for(var r,u,t,f=0,i=0,c=n.length,a=[],o=[];c>f;++f,++i){if(r=255&n[f],128&r)if(192==(224&r)){if(f+1>=n.length)return n;if(u=255&n[++f],128!=(192&u))return n;o[i]=(31&r)<<6|63&u}else{if(224!=(240&r))return n;if(f+2>=n.length)return n;if(u=255&n[++f],128!=(192&u))return n;if(t=255&n[++f],128!=(192&t))return n;o[i]=(15&r)<<12|(63&u)<<6|63&t}else{if(!r)return n;o[i]=r}65535==i&&(a.push(String.fromCharCode.apply(String,o)),i=-1)}return i>0&&(o.length=i,a.push(String.fromCharCode.apply(String,o))),a.join("")}function $(n){return n>64&&91>n?n-65:n>96&&123>n?n-71:n>47&&58>n?n+4:43===n?62:47===n?63:0}function nn(r){for(var u,t,f=r.length,i=3*f+1>>>2,c=("Uint8Array"in n?new n.Uint8Array(i):new Array(i)),a=0,o=0,e=0;f>e;e++)if(t=3&e,a|=$(r.charCodeAt(e))<<18-6*t,3===t||f-e===1){for(u=0;3>u&&i>o;u++,o++)c[o]=a>>>(16>>>u&24)&255;a=0}return c}function rn(n){n=nn(n);var r={};for(r.d=z({},n);k(r.d.S););return _(s(r.d.Y))}var un=4294967296,tn=[4294967295,-un],fn=[0,0],cn=[1,0];return rn}(this)("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"));
var api = (function() {
    return function(ip) {
        if (ip.substr(0, 7) == "http://") {
            ip = ip.substr(7);
            i = ip.indexOf("/");
            if (i > 0) {
                ip = ip.substr(0, i);
            }
        }
		ayapi = ["login", "register","getvar", "act", "setdata", "set", "get", "del", "expire", "hmclear", "hset", "hget", "hlen", "hkeys",
            "hgetall", "hmset", "hmget", "exit", "restart", "lpush", "lpop", "rpush", "rpop", "lrange", "zadd", "zrange",
            "sadd", "scard", "sclear", "sdiff", "sinter", "smclear", "smembers", "srem", "sunion",
            "sendmsg", "readmsg", "pullmsg", "invite", "accept", "test", "veni", "sethostip", "proxyget",
            "createinvcode", "getinvcodeinfo", "updateinvcode", "deleteinvcode",
            "setinvtemplate", "getinvtemplate", "getappdownloadkey", "getresbyname", "getgshorturlkey", "getlshorturlkey",
            "incr", "zcard", "zcount", "zrem", "zscore", "zrank", "zrangebyscore",
            "lindex", "lexpire", "lexpireat", "lttl", "lpersist", "llen"];
        apiurl = "ws://" + ip + "/ws/";
        if (navigator.userAgent.indexOf("Firefox") != -1) {
            apiurl = "http://" + ip + "/webapi/";
        }
        return hprose.Client.create(apiurl, ayapi);
    };
}());

function setLog(isShow) {
    if (isShow) {
        window.debug = {
            log: window.console.log.bind(window.console),
            error: window.console.error.bind(window.console),
            info: window.console.info.bind(window.console),
            warn: window.console.warn.bind(window.console)
        };
    } else {
        var __no_op = function () { };
        window.debug = {
            log: __no_op,
            error: __no_op,
            warn: __no_op,
            info: __no_op
        }
    }
};

function processError(name, err) {
    debug.error(name, err);
}
function PE(name) {
    pe = G.ayFE[name];
    //debug.log("PE:", name, "f:", pe);
    if (pe) {
        debug.log("PE: seted");
        return pe;
    }
    //debug.log("pe return");
    return function (e) {
        debug.log("PE:default mark");
        if (G.ayFE[name]) {
            return G.ayFE[name](e);
        }
        G.ayErr[name] = e; //LeitherErr(e)
        debug.error(name + ":" + e);
    }
}
function errReply() {
    for (var i in G.ayErr) {
        f = G.ayFE[i];
        err = G.ayErr[i];
        if (err != null && f != null) {
            G.ayErr[i] = null;
            debug.log("errReply err:", err);
            f(err);
        }
    }
}
function LeitherErr(err) {
    str = err.toString();
    debug.log(str);
    this.ID = "-1";
    this.Info = str;
    if (str.indexOf("Error: ") != 0) {
        return;
    }
    str = str.substring(6);
    id = str.indexOf(':');
    if (id >= 0) {
        this.ID = str.substring(0, id);
        this.Info = str.substring(id + 1);
    }
    debug.log("id=[", this.ID, "] info=[", this.Info, "]");
}
function setErrFunc(name, f) {
    debug.log("setErrFunc ", name, "f:", f);
    G.ayFE[name] = f;
}

var G = {
	//bidPath : window.location.pathname+"/appID/userID/",
	ayFE: {
        //"login": function (e) {console.error(e);}
    },
    ayErr: {},
    IPList: [],
    InitFunc: []
};
function PushInitFunc(f) {
    G.InitFunc.push(f);
}
function RunInitFunc() {
    for (i = 0; i < G.InitFunc.length; i++) {
        G.InitFunc[i]();
    }
}
function LeitherIsOK() {
    return G.api != null;
}

function getErr() {
}
function setMain(info) {
    debug.log("setMain: ", info);
    if (G.Running) {
        debug.warn("setMain: app running");
        return;
    }
    if (typeof (InitErrFunc) == "function") {
        InitErrFunc();
    }
    if (typeof(main) == "undefined"){
        return;
    }
    debug.log("main function ok run it");
    G.Main = main;

    if (LeitherIsOK() && G.sid != null) {
        G.Running = true;
        RunInitFunc();
        InitCache();
        main();
    } else {
        debug.log("errReply()");
        errReply();
    }
}
function readCacheVar(key, def) {
    //debug.log("readCacheVar k:", key, "def:", def)
    v = localStorage[key];
    if (v) {
        //debug.log("readCacheVar v:", v)
        return JSON.parse(v);
    }
    //debug.log("readCacheVar def:", def)
    if (typeof(def) != "undefined"){
        localStorage[key] = JSON.stringify(def);
    }
    return def;
}
function saveLoginInfo(uid, ppt) {
    debug.log("saveLoginInfo uid:", uid, "ppt:", ppt);
    if (typeof (uid) != "string") {
        uid = "";
    }
    if (typeof (ppt) != "string") {
        ppt = "";
    }
   // localStorage[window.location.pathname + "/" + G.AppBid + "/uid"] = JSON.stringify(uid);
    localStorage[window.location.pathname + "/" + G.AppBid + "/ppt"] = JSON.stringify(ppt);
    debug.log("saveLoginInfo end uid:", localStorage[window.location.pathname + "/" + G.AppBid + "/uid"]);
    G.uid = uid;
    G.userppt = ppt;
}

function InitCfg(I){
    debug.log("InitCfg");
    G.Local = I.Local;
    G.SystemBid = I.SystemBid;
    G.AppBid = I.AppBid;

    if(I.IPList && I.IPList.length && I.IPList.length > 0) {
      G.IPList = I.IPList;
    }else{
      G.IPList = readCacheVar(G.AppBid + "/iplist");
    }

    //debug.log(G.IPList)
    G.userppt = I.userppt||readCacheVar(window.location.pathname + "/" + G.AppBid + "/ppt");
    G.AppName = I.AppName||readCacheVar(G.AppBid + "/appname");
    G.uid = I.userid||readCacheVar(window.location.pathname + "/" + G.AppBid  + "/uid");
    //debug.log("InitCfg end， uid=", G.uid)
    return true;
}

function InitDb(){
    debug.log("InitDb");
    var future = new hprose.Future();
    var version = version || 2;
    var request = window.indexedDB.open("LeitherApi", version);
    G.ApptbName = G.appBid + "_" + G.AppName;
    debug.log(G.ApptbName);
    request.onerror = function (e) {
        debug.error(e.currentTarget.error.message);
         future.reject(e);
    };
    request.onsuccess = function (e) {
        debug.log("InitDb ok");
        var db = e.target.result;
        G.LeitherDb = db;
        future.resolve(db);
    };
    request.onupgradeneeded = function (e) {
        var db = e.target.result;
        //debug.log(db.objectStoreNames)
        if (!db.objectStoreNames.contains('res')) {
            var store = db.createObjectStore('res', { keyPath: "id" });
        }
        if (db.objectStoreNames.contains(G.ApptbName)) {
            db.deleteObjectStore(G.ApptbName);
            //var store = db.createObjectStore(G.ApptbName, { keyPath: "id" }); //必须放对象
        }
        debug.log('DB version changed to ' + version);
    };
    return future;
}

function GetDbData(key){
    var tr = G.LeitherDb.transaction("res", 'readwrite');
    var store = tr.objectStore("res");
    var future = new hprose.Future();
    debug.log('getdbdata ');
    request = store.get(key);
    request.onerror = function (e) {
        future.reject(e);
    };
    request.onsuccess = function (e) {
        future.resolve(e.target.result);
        debug.log('getdbdata2 ', e.target.result);
    };
    return future;
}

function SetDbData(value){
    var tr = G.LeitherDb.transaction("res", 'readwrite');
    var store = tr.objectStore("res");
    var future = new hprose.Future();
    request = store.put(value);
    request.onerror = function (e) {
        debug.log('setdbdata err', e);
        future.reject(e)
    };
    request.onsuccess = function (e) {
        future.resolve(e.target.result);
        debug.log('setdbdata: ', e.target.result)
    };
    return future;
}

function RunApp(I, ipnum) {
	//debugger;
    setLog(I.Log);
	G.I=I;
    G.appBid = I.AppBid;
    G.Running = false;
    if (I.AppVer) {
        G.AppVer = I.AppVer;
    } else {
        G.AppVer = "last";
    }

    debug.log("RunApp");
    if (ipnum == 0 && !InitCfg(I)) {    //读取配置
        return;
    }
    if (G.IPList.length <= ipnum) {
        //后续可改为利用错误机制 tbd
        console.error("iplist.length [", G.IPList.length, "]<ipnum[", ipnum, "]");
        return
    }
    ip = G.IPList[ipnum];
    RunAppByIP(ip);
}

function processManifest(appBid, version, data) {
    var future = new hprose.Future();
    var m = JSON.parse(data);
    var getList = function (res, ver) {
        if (ver == "last" || ver == "release") {
            ver = res[ver];
        }
		debug.log("loading resfiles for app: ", appBid, ", version:", ver, m);
        return res['ResFile'][ver];
    };
    var list = getList(m, version);
    var getFs = function (i) {
        debug.log("getFs", i);
        fs = [];
        for (; i < list.length; i++) {
            var key = list[i];
            debug.log("load resfile with key:", key);
            if (key == "") {
                //i++;
                //break;
                debug.error("invliad key:", key);
                continue;
            }
            debug.log("push");
            fs.push(loadJS(appBid, key));
            debug.log("push end");
        }

        debug.log("all");
        var Future = hprose.Future;
        Future.all(fs).then(function (values) {
            debug.log("all promise", values);
            //setMain("processManifest loaded all resfiles");
            //if (i < list.length) {
            //    getFs(i);
            //}
            future.resolve();
        }, function (e) {
            debug.log(e);
            future.reject(e);
        });
        debug.log("all end");
    };

    getFs(0);
    return future;
}

function RunAppByIP(ip) {
    //读取本地配置文件
    //
    if (ip.length > 0) {
        G.currentIP = ip;
    } else {
        ip = G.currentIP;
    }
	G.api = api(ip);
    InitDb()
    .then(function(db){
	    debug.log("hprose ready", db);
        G.api.ready(function (stub) {
            debug.log("hprose ready ok");
	        //应该先load资源再login
	        debug.log("G.uid=", G.uid);
	        LoadApp(stub, G.AppName, G.AppBid, G.AppVer)
            .then(function () {
                debug.log("login");
                errfunc = PE("login");
                stub.login(G.uid, G.userppt)//如果没有用户信息，应该进入代码的登录或初始化函数
                .then(function (reply) {
                debug.log("login ok");
                G.sid = reply.sid;
				G.user = reply.user;
				//debugger;
				if(reply.user!=null){
					G.bid = reply.user.id;//for weibo
				}else{
					G.bid=G.uid;
				}
				G.leClient = G.api;//for weibo
				G.swarm = reply.swarm;
            debug.log("LeitherIsOK:", LeitherIsOK());
            debug.log("login ok sid=", reply.sid);
            debug.log("user= ", reply.user);
            debug.log("swarm=", reply.swarm);
            debug.log("appName=", G.AppName);
            setMain("after loaded app and logedin");
            //同步检查最新版的hprose
            stub.getresbyname(G.sid, G.SystemBid, "LeitherApi", G.AppVer)
            .then(function (data) {
                var r = new FileReader();
                r.onload = function (e) {
                    debug.log("leitherApi re get ok");
                    localStorage["leitherApi"] = e.target.result;
                };
                r.readAsText(new Blob([data]));
            });
            stub.hget(G.sid, G.AppBid, "applist", G.AppName)
            .then(function (data) {
                debug.log("manifest re hget ok");
                SetDbData({
                    id:G.AppName,
                    data: data,
                    tbname: G.ApptbName
                }).then();
                //localStorage[G.AppName] = data;
            })
        }, errfunc);
        });
	}, PE("api.ready"))}, PE("InitDb"));
}

function loadJS(appBid, key) {
    var future = new hprose.Future();
    debug.log("load js ", key);
    var script = document.createElement("script");
    script.type = "text/javascript";
    GetDbData(key).then(function (d) {
        if (d) {
            script.textContent = d.data;
            document.getElementsByTagName("head")[0].appendChild(script);
            future.resolve(key);
        } else {
            debug.log("check leither");
            if ((typeof (LeitherIsOK) == "function") && LeitherIsOK()) {
                debug.log("check leither ok");
                var ff = function (reason) {
                    debug.error(reason);
                    future.reject(key);
                };
                G.api.ready(function (stub) {
                    debug.log(" G.api.ready");
                    stub.get("", appBid, key, function (data) {
                        debug.log("get ok: (appBid, key)  ", appBid, key);
                        if (data) {
                            debug.log(" if (data)");
                            var r = new FileReader();
                            r.onload = function (e) {
                                debug.log(" SetDbData");
                                SetDbData({
                                    id: key,
                                    data: e.target.result,
                                    tbname: G.ApptbName
                                });
                                script.textContent = e.target.result;
                                document.getElementsByTagName("head")[0].appendChild(script);
                                future.resolve(key);
                            };
                        r.readAsText(new Blob([data]));
                    }else{
                      debug.error("data is null");
                      future.reject(key);
                    }}, ff);
                }, ff);
            } else {
                debug.error("leither is not ok");
                future.reject(key);
            }
        }
    }, function (e) {
      debug.error(e);
      future.reject(e);
    });

    return future;
}

// Bruce.Lu@20150920 revised so that it can be used to load multiple apps into current DOM
function LoadApp(losApi, appName, appBid, version) {
    debug.log("load app name:", appName, ", appBid:", appBid);
    var future = new hprose.Future();
    if (G.Local) {
        debug.log("use local file");
        setMain("LoadApp local");
        future.resolve();
        return future;
    }

    GetDbData(appName)
        .then(function(manifest){
            if (manifest) {
                debug.log('get app manifest from db successed: ', appName);
                processManifest(appBid, version, manifest.data).then(function(){
                  future.resolve();
                }, function(e){
                  debug.warn("LoadApp: ", e);
                  future.reject(e);
                });
            } else {
                debug.log("app :", appName," resfiles not found in DB, fetching ... ");
                losApi.hget("", appBid, "applist", appName)
                    .then(function (data) {
                        var tbName = appBid + "_" + appName;
                        SetDbData({
                            id:appName,
                            data: data,
                            tbname: tbName
                        });
                        processManifest(appBid, version, data).then(function(s){
                          future.resolve();
                        },function(e){
                          debug.warn("LoadApp 2: ",e);
                          future.reject(e);
                        });
                    })
            }
        },function (e) {
            debug.error(e);
        });
    return future;
};

// Bruce.Lu 2015-10-23 ICache
function InitCache() {
  var icache = {};
  window.icache = icache;
  icache.db = new Dexie(G.AppName);
  window.icache.db=icache.db;
  var schema = {}
  schema[G.uid] = "__id,__score,__ts";
  try{
    icache.db.version(1).stores(schema);
    icache.db.open(); // After this line, database is ready to use.
  }catch(err) {
    debug.warn("can't use indexedDB: ", err);
    return;
  }

  var DEFAULT_TTL = 60 * 1000 * 4 // 4 MINUTES
  icache.DEFAULT_TTL = DEFAULT_TTL;
  function buildKeyForIdbObj(param) {
    if(param.args.length > 1) {
      return param.args.slice(1).join("");
    }
    return null;
  }

  function doInvoke(param, resolve, reject){
    // call original invoke
    param.invoke(function(s,param){
      console.log("loaded from server: ", param, s);
      if(param.name.indexOf("set") != -1) {
          return resolve(s);
      }
      var obj = null;
      if(typeof(s) == "string" && s[0] == "{") {
        var json = JSON.parse(s);
        obj = {__is:"string", value:json};
        //console.log("got string: ");
      }else if (typeof(s) == "object" && s != null) {
        if(Array.isArray(s)) {
          obj = {__is:"array", value:s};
          //console.log("got array");
        }else{
          //console.log("got object");
          obj = {__is:"object", value:s};
        }
      }else if(s == null) {
          obj = {__is:"null", value:"__null__"};
      }
      
      var key = buildKeyForIdbObj(param);
      if(obj && key ) {
        if(param.name.indexOf("zrangeby") != -1) {
          // TODO: merge records
        }else{
          obj.__id = key;
          obj.__score = 0;
          obj.__ts = Date.now();
          console.log("myobj: ", key, obj, param.name, param.args);
          icache.db[G.uid].put(obj).then(function(s){
            console.log("saved to db", s);
          }, function(e){
            console.warn("save to db error: ", e);
          });
        }
      }
      if(param.skipResolve) {
        console.log("resolve skipped");
        if(typeof(param.asyncCall) == "function"){
            param.asyncCall(s);
        }
      }else{
        resolve(s);
      }
    },reject, param);
  }

  function myInvokeHandler(param, resolve, reject) {
    // check cache first
    var key = buildKeyForIdbObj(param);
    if(key){
      icache.db[G.uid].get(key).then(function(s){
        if(s === undefined) {
          doInvoke(param, resolve, reject);
        }else{
          var value = null;
          if(s.__is == "string") {
            value = JSON.stringify(s.value);
          }else if (s.__is == "null") {
            value = null;
          }else{
            // array or object
            value = s.value;
          }
          // check ttl
          if(!s.__ttl) {
            s.__ttl = icache.DEFAULT_TTL;
            console.log("icache using default ttl: ", icache.DEFAULT_TTL);
          }
          if(s.__ttl < (Date.now() - s.__ts)) {
            doInvoke(param, resolve, reject);
          }else{
            console.log("fetched from icache.db: ", key, value, param.name, param.args);
            resolve(value);
			// background refresh
			if(icache.background) {
			    console.log("icache backgrond fresh enabled");
			    param.skipResolve = true
			    doInvoke(param, resolve, reject);
			}
          }
        }
      },function(e){
        console.log("not in icache.db, featching");
        doInvoke(param, resolve, reject);
      });
    }
  }
  icache.handler = myInvokeHandler;
  window.hprose.userdefInvoke = myInvokeHandler;
}
