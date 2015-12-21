/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var Dexie = __webpack_require__(1);
	__webpack_require__(4);

	'use strict';
	// Bruce.Lu 2015-10-23 ICache
	function InitCache() {
	  //debug.log("in initcache 0");
	  var TargetAPIs = ['get'];
	  var icache = {};
	  window.icache = icache;
	  //debug.log("in initcache 1");
	  icache.db = new Dexie(G.AppName);
	  //debug.log("in initcache 2");
	  var schema = {};
	  icache.table = 'icache';
	  schema[icache.table] = "__id,__score,__ts";
	  //debug.log("in initcache");
	  try {
	    icache.db.version(2).stores(schema);
	    icache.db.open(); // After this line, database is ready to use.
	  } catch (err) {
	    debug.warn("can't use indexedDB: ", err);
	    return;
	  }

	  var DEFAULT_TTL = 1000 * 60 * 60 * 24 * 365; // cache 2 hours
	  icache.DEFAULT_TTL = DEFAULT_TTL;

	  function buildKeyForIdbObj(param) {
	    if (param.args.length > 1) {
	      return param.args.slice(1).join("");
	    }
	    return null;
	  }

	  function doInvoke(param, resolve, reject) {
	    // call original invoke
	    param.invoke(function (s, param) {
	      //debug.log("loaded from server: ", param, s);
	      var flag = TargetAPIs.some(function (e) {
	        return param.name.indexOf(e) !== -1;
	      });

	      var reason = flag;
	      if (param.ttl !== undefined && param.ttl <= 0) {
	        flag = false;
	        reason = "disabled";
	      }

	      debug.log("do cache?: ", reason, param.name, param.args, param.udata, s);
	      if (!flag || param.nocache || s === null) {
	        return resolve(s);
	      }

	      var obj = null;
	      if (typeof s == "string" && s[0] == "{") {
	        var json = JSON.parse(s);
	        obj = {
	          __is: "string",
	          value: json
	        };
	        //debug.log("got string: ");
	      } else if (typeof s == "object" && s != null) {
	          if (Array.isArray(s)) {
	            obj = {
	              __is: "array",
	              value: s
	            };
	            //debug.log("got array");
	          } else {
	              //debug.log("got object");
	              obj = {
	                __is: "object",
	                value: s
	              };
	            }
	        } else if (s === null) {
	          obj = {
	            __is: "null",
	            value: "__null__"
	          };
	        }

	      var key = buildKeyForIdbObj(param);
	      if (obj && key) {
	        // TODO: lrange, zrang APIs have specitial implementaion of cache,
	        obj.__id = key;
	        obj.__score = 0;
	        obj.__ts = Date.now();
	        //debug.log("myobj: ", key, obj, param.name, param.args);
	        icache.db[icache.table].put(obj).then(function (s) {
	          //debug.log("saved to db", s);
	        }, function (e) {
	          debug.warn("save to db error: ", e);
	        });
	      }
	      if (param.skipResolve) {
	        //debug.log("resolve skipped");
	        if (typeof param.asyncCall == "function") {
	          param.asyncCall(s);
	        }
	      } else {
	        resolve(s);
	      }
	    }, reject, param);
	  }

	  function myInvokeHandler(param, resolve, reject) {
	    // check cache first
	    var key = null;
	    var flag = TargetAPIs.some(function (e) {
	      return param.name.indexOf(e) !== -1;
	    });

	    if (flag) {
	      key = buildKeyForIdbObj(param);
	    }

	    if (key) {
	      icache.db[icache.table].get(key).then(function (s) {
	        if (!s) {
	          doInvoke(param, resolve, reject);
	        } else {
	          var value = null;
	          if (s.__is == "string") {
	            value = JSON.stringify(s.value);
	          } else if (s.__is == "null") {
	            value = null;
	            // corrently we refetch null value
	            return doInvoke(param, resolve, reject);
	          } else {
	            // array or object
	            value = s.value;
	          }
	          // check if background fresh enabled
	          if (param.background || typeof param.background == 'undefined' && icache.background) {
	            debug.log("fetching from icache.db with background enabled: ", key, value, param.name, param.args);
	            resolve(value);
	            param.skipResolve = true;
	            doInvoke(param, resolve, reject);
	            return;
	          }

	          // check ttl
	          if (typeof param.ttl == "undefined") {
	            if (typeof s.__ttl == "undefined") {
	              s.__ttl = icache.DEFAULT_TTL;
	            }
	            //debug.log("icache using default ttl: ", icache.DEFAULT_TTL);
	          } else {
	              s.__ttl = param.ttl;
	            }

	          if (s.__ttl < Date.now() - s.__ts) {
	            doInvoke(param, resolve, reject);
	          } else {
	            debug.log("fetching from icache.db: ", key, value, param.name, param.args);
	            resolve(value);
	          }
	        }
	      }, function (e) {
	        debug.log("not in icache.db, fetching from server");
	        doInvoke(param, resolve, reject);
	      });
	    } else {
	      //debug.log("not valid key, fetching from server", param.name, param.args);
	      doInvoke(param, resolve, reject);
	    }
	  }

	  icache.handler = myInvokeHandler;
	  window.hprose.userdefInvoke = myInvokeHandler;
	  icache.tools = {};
	  icache.tools.makeurl = function (ipport, appname, appbid, uid) {
	    return "http://" + ipport + "/loadres?type=text/html&AppName=" + appname + "&AppBid=" + appbid + "&ip=" + ipport + "&bid=" + G.SystemBid + "&name=AppTemplate&ver=last&userid=" + uid;
	  };
	}

	// originals
	var api = function (ip) {
	  if (ip.substr(0, 7) == "http://") {
	    ip = ip.substr(7);
	    var i = ip.indexOf("/");
	    if (i > 0) {
	      ip = ip.substr(0, i);
	    }
	  }
	  var ayapi = ["login", "register", "getvar", "act", "setdata", "set", "get", "del", "expire", "hmclear", "hset", "hget", "hdel", "hlen", "hkeys", "hgetall", "hmset", "hmget", "exit", "restart", "lpush", "lpop", "rpush", "rpop", "lrange", "zadd", "zrange", "sadd", "scard", "sclear", "sdiff", "sinter", "smclear", "smembers", "srem", "sunion", "sendmsg", "readmsg", "pullmsg", "invite", "accept", "test", "veni", "sethostip", "proxyget", "createinvcode", "getinvcodeinfo", "updateinvcode", "deleteinvcode", "setinvtemplate", "getinvtemplate", "getappdownloadkey", "getresbyname", "getgshorturlkey", "getlshorturlkey", "incr", "zcard", "zcount", "zrem", "zscore", "zrank", "zrangebyscore", "lindex", "lexpire", "lexpireat", "lttl", "lpersist", "llen", "sendmail", "lset"];
	  var apiurl = "ws://" + ip + "/ws/";
	  if (navigator.userAgent.indexOf("Firefox") != -1) {
	    apiurl = "http://" + ip + "/webapi/";
	  }
	  return hprose.Client.create(apiurl, ayapi);
	};

	window.api = api;
	var apiLogLevels = ['log', 'info', 'warn', 'error'];
	window.debug = {};

	function setLog(logLvl) {
	  var getLoglevel = function (levl) {
	    // for compatibility of old api
	    // default to warn
	    var DEFAULT_LEVLE = 2;
	    var lvl = DEFAULT_LEVLE;
	    try {
	      lvl = eval(levl);
	    } catch (e) {
	      lvl = DEFAULT_LEVLE;
	    }

	    // special handler for 'bool' and 'string'
	    if (typeof lvl === 'boolean') {
	      if (!lvl) {
	        lvl = apiLogLevels.length;
	      } else {
	        lvl = DEFAULT_LEVLE;
	      }
	    } else if (typeof lvl === 'string') {
	      lvl = DEFAULT_LEVLE;
	    }

	    return lvl;
	  };

	  var lvl = getLoglevel(logLvl);

	  console.log("loglevel: ", lvl);

	  var __no_op = function () {};
	  for (var i = lvl; i < apiLogLevels.length; i++) {
	    window.debug[apiLogLevels[i]] = window.console[apiLogLevels[i]].bind(window.console);
	  }
	  for (var i = 0; i < lvl; i++) {
	    window.debug[apiLogLevels[i]] = __no_op;
	  }
	}

	window.setLog = setLog;

	function processError(name, err) {
	  debug.error(name, err);
	}

	function PE(name) {
	  var pe = G.ayFE[name];
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
	    G.ayErr[name] = e;
	    debug.error(name + ":" + e);
	  };
	}

	function errReply() {
	  for (var i in G.ayErr) {
	    var f = G.ayFE[i];
	    err = G.ayErr[i];
	    if (err != null && f != null) {
	      G.ayErr[i] = null;
	      debug.log("errReply err:", err);
	      f(err);
	    }
	  }
	}

	function LeitherErr(err) {
	  var str = err.toString();
	  debug.log(str);
	  this.ID = "-1";
	  this.Info = str;
	  if (str.indexOf("Error: ") != 0) {
	    return;
	  }
	  var str = str.substring(6);
	  var id = str.indexOf(':');
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

	window.G = G;

	function PushInitFunc(f) {
	  G.InitFunc.push(f);
	}

	function RunInitFunc() {
	  for (var i = 0; i < G.InitFunc.length; i++) {
	    G.InitFunc[i]();
	  }
	}

	function LeitherIsOK() {
	  return G.api != null;
	}

	window.LeitherIsOK = LeitherIsOK;

	function getErr() {}

	function setMain(info) {
	  debug.log("setMain: ", info);
	  if (G.Running) {
	    debug.warn("setMain: app running");
	    return;
	  }
	  if (typeof InitErrFunc == "function") {
	    InitErrFunc();
	  }
	  if (typeof main == "undefined") {
	    return;
	  }
	  debug.log("main function ok run it");
	  G.Main = main;

	  debug.log("isok", LeitherIsOK);

	  if (LeitherIsOK()) {
	    G.Running = true;
	    debug.log("s1");
	    RunInitFunc();
	    debug.log("s2", InitCache);
	    InitCache();
	    debug.log("s3");
	    main();
	    debug.log("called main()");
	  } else {
	    debug.log("Leither is not OK");
	    errReply();
	  }
	}

	function readCacheVar(key, def) {
	  var v = localStorage[key];
	  if (v) {
	    return JSON.parse(v);
	  }
	  //debug.log("readCacheVar def:", def)
	  if (typeof def != "undefined") {
	    localStorage[key] = JSON.stringify(def);
	  }
	  return def;
	}

	function saveLoginInfo(uid, ppt) {
	  debug.log("saveLoginInfo uid:", uid, "ppt:", ppt);
	  if (typeof uid != "string") {
	    uid = "";
	  }
	  if (typeof ppt != "string") {
	    ppt = "";
	  }
	  // localStorage[window.location.pathname + "/" + G.AppBid + "/uid"] = JSON.stringify(uid);
	  localStorage[window.location.pathname + "/" + G.AppBid + "/ppt"] = JSON.stringify(ppt);
	  debug.log("saveLoginInfo end uid:", localStorage[window.location.pathname + "/" + G.AppBid + "/uid"]);
	  G.uid = uid;
	  G.userppt = ppt;
	}

	function InitCfg(I) {
	  debug.log("InitCfg");
	  G.Local = I.Local;
	  G.SystemBid = I.SystemBid;
	  G.AppBid = I.AppBid;

	  if (I.IPList && I.IPList.length && I.IPList.length > 0) {
	    G.IPList = I.IPList;
	  } else {
	    G.IPList = readCacheVar(G.AppBid + "/iplist");
	  }

	  G.userppt = I.userppt || readCacheVar(window.location.pathname + "/" + G.AppBid + "/ppt");
	  G.AppName = I.AppName || readCacheVar(G.AppBid + "/appname");
	  G.uid = I.userid || readCacheVar(window.location.pathname + "/" + G.AppBid + "/uid");
	  //debug.log("InitCfg end， uid=", G.uid)
	  return true;
	}

	function InitDb() {
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
	      db.createObjectStore('res', {
	        keyPath: "id"
	      });
	    }
	    if (db.objectStoreNames.contains(G.ApptbName)) {
	      db.deleteObjectStore(G.ApptbName);
	      //var store = db.createObjectStore(G.ApptbName, { keyPath: "id" }); //必须放对象
	    }
	    debug.log('DB version changed to ' + version);
	  };

	  return future;
	}

	function GetDbData(key) {
	  var tr = G.LeitherDb.transaction("res", 'readwrite');
	  var store = tr.objectStore("res");
	  var future = new hprose.Future();
	  request = store.get(key);
	  request.onerror = function (e) {
	    future.reject(e);
	  };
	  request.onsuccess = function (e) {
	    future.resolve(e.target.result);
	  };
	  return future;
	}

	function SetDbData(value) {
	  var tr = G.LeitherDb.transaction("res", 'readwrite');
	  var store = tr.objectStore("res");
	  var future = new hprose.Future();
	  request = store.put(value);
	  request.onerror = function (e) {
	    debug.log('setdbdata err', e);
	    future.reject(e);
	  };
	  request.onsuccess = function (e) {
	    future.resolve(e.target.result);
	    debug.log('setdbdata: ', e.target.result);
	  };
	  return future;
	}

	function RunApp(I, ipnum) {
	  // CompilerFix:  workaround for undefined RunApp
	  if (arguments.length == 0) return;

	  if (typeof I.Log === "undefined") {
	    setLog(false);
	  } else {
	    setLog(I.Log);
	  }

	  G.I = I;
	  G.appBid = I.AppBid;
	  G.Running = false;
	  if (I.AppVer) {
	    G.AppVer = I.AppVer;
	  } else {
	    G.AppVer = "last";
	  }

	  debug.log("RunApp");
	  if (ipnum == 0 && !InitCfg(I)) {
	    return;
	  }

	  if (G.IPList.length <= ipnum) {
	    console.error("iplist.length [", G.IPList.length, "]<ipnum[", ipnum, "]");
	    return;
	  }
	  var ip = G.IPList[ipnum];
	  RunAppByIP(ip);
	}

	window.RunApp = RunApp;
	// CompilerFix:  workaround for undefined RunApp
	window.RunApp();

	function processManifest(appBid, ver, data) {
	  //debug.log("in processManifest");
	  var future = new hprose.Future();
	  var m = JSON.parse(data);
	  var getList = function (res, version) {
	    var thisVer = "last";
	    if (version == "last" || version == "release") {
	      thisVer = res[version];
	    }
	    return res['ResFile'][thisVer];
	  };

	  var list = getList(m, ver);
	  var getFs = function (i) {
	    //debug.log("getFs", i);
	    var fs = [];
	    for (; i < list.length; i++) {
	      var key = list[i];
	      if (key == "") {
	        //i++;
	        //break;
	        debug.error("invliad key:", key);
	        continue;
	      }
	      //debug.log("push");
	      fs.push(loadJS(appBid, key));
	      //debug.log("push end");
	    }

	    //debug.log("all");
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
	    //debug.log("all end");
	  };

	  getFs(0);
	  //debug.log("called fs0");
	  return future;
	}

	function postLogin(loginData) {
	  G.loginData = loginData;
	  G.sid = loginData.sid;
	  G.user = loginData.user;
	  G.username = G.user.name;
	  if (loginData.user !== null) {
	    G.bid = loginData.user.id; //for weibo
	  } else {
	      G.bid = G.uid;
	    }
	  G.leClient = G.api; //for weibo
	  G.swarm = loginData.swarm;
	}

	function RunAppByIP(ip) {
	  if (ip.length > 0) {
	    G.currentIP = ip;
	  } else {
	    ip = G.currentIP;
	  }
	  G.api = api(ip);
	  InitDb().then(function (db) {
	    debug.log("hprose ready", db);
	    G.api.ready(function (stub) {
	      debug.log("hprose ready ok");
	      debug.log("G.uid=", G.uid);
	      LoadApp(stub, G.AppName, G.AppBid, G.AppVer).then(function () {
	        var errfunc = PE("login");
	        G.postLogin = postLogin;
	        if (typeof ENABLE_UAC !== 'undefined' && ENABLE_UAC) {
	          setMain("UAC enabled, must redirect to the login page first");
	        } else {
	          stub.login(G.uid, G.userppt).then(function (reply) {
	            debug.log("login ok");
	            postLogin(reply);
	            G.swarm = reply.swarm;
	            debug.log("LeitherIsOK:", LeitherIsOK());
	            debug.log("login ok sid=", reply.sid);
	            debug.log("user= ", reply.user);
	            debug.log("swarm=", reply.swarm);
	            debug.log("appName=", G.AppName);
	            setMain("after loaded app and logedin");

	            // get new leitherapi and manifest file
	            if (!G.Local) {
	              debug.log("use remote files");
	              //check newest api and app manifest
	              stub.getresbyname(G.sid, G.SystemBid, "LeitherApi", G.AppVer, {
	                handler: icache.handler,
	                ttl: 0
	              }).then(function (data) {
	                var r = new FileReader();
	                r.onload = function (e) {
	                  debug.log("leitherApi re get ok");
	                  localStorage["leitherApi"] = e.target.result;
	                };
	                r.readAsText(new Blob([data]));
	              });
	              stub.hget(G.sid, G.AppBid, "applist", G.AppName, {
	                handler: icache.handler,
	                ttl: 0
	              }).then(function (data) {
	                debug.log("manifest re hget ok");
	                SetDbData({
	                  id: G.AppName,
	                  data: data,
	                  tbname: G.ApptbName
	                }).then();
	              });
	            }
	          }, errfunc);
	        }
	      });
	    }, PE("api.ready"));
	  }, PE("InitDb"));
	}

	function loadJS(appBid, key) {
	  var future = new hprose.Future();
	  var script = document.createElement("script");
	  script.type = "text/javascript";
	  GetDbData(key).then(function (d) {
	    if (d) {
	      debug.log("load js from db: ", key);
	      script.textContent = d.data;
	      document.getElementsByTagName("head")[0].appendChild(script);
	      future.resolve(key);
	    } else {
	      debug.log("check leither");
	      if (typeof LeitherIsOK == "function" && LeitherIsOK()) {
	        debug.log("check leither ok");
	        var ff = function (reason) {
	          debug.error(reason);
	          future.reject(key);
	        };
	        G.api.ready(function (stub) {
	          stub.get("", appBid, key, function (data) {
	            debug.log("load js from server: ", appBid, key);
	            if (data) {
	              var r = new FileReader();
	              r.onload = function (e) {
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
	            } else {
	              debug.error("data is null");
	              future.reject(key);
	            }
	          }, ff);
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
	    // setMain("LoadApp local");
	    future.resolve();
	    return future;
	  }

	  GetDbData(appName).then(function (manifest) {
	    if (manifest) {
	      debug.log('get app manifest from db successed: ', appName);
	      processManifest(appBid, version, manifest.data).then(function () {
	        future.resolve();
	      }, function (e) {
	        debug.warn("LoadApp: ", e);
	        future.reject(e);
	      });
	    } else {
	      debug.log("app :", appName, " resfiles not found in DB, fetching ... ");
	      losApi.hget("", appBid, "applist", appName).then(function (data) {
	        var tbName = appBid + "_" + appName;
	        SetDbData({
	          id: appName,
	          data: data,
	          tbname: tbName
	        });
	        processManifest(appBid, version, data).then(function (s) {
	          future.resolve();
	        }, function (e) {
	          debug.warn("LoadApp 2: ", e);
	          future.reject(e);
	        });
	      });
	    }
	  }, function (e) {
	    debug.error(e);
	  });
	  return future;
	}

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(setImmediate) {(function (n, t, i) {
	  "use strict";
	  function s(n, t) {
	    return typeof t != "object" && (t = t()), Object.keys(t).forEach(function (i) {
	      n[i] = t[i];
	    }), n;
	  }function p(n) {
	    return { from: function (t) {
	        return n.prototype = Object.create(t.prototype), n.prototype.constructor = n, { extend: function (i) {
	            s(n.prototype, typeof i != "object" ? i(t.prototype) : i);
	          } };
	      } };
	  }function w(n, t) {
	    return t(n);
	  }function u(n, t) {
	    function cr() {
	      b.on("versionchange", function () {
	        b.close();b.on("error").fire(new nt("Database version changed by other database connection."));
	      });
	    }function gi(n) {
	      this._cfg = { version: n, storesSource: null, dbschema: {}, tables: {}, contentUpgrade: null };this.stores({});
	    }function lr(n, t, i, u) {
	      var e, f, s, h, l, c;if (n === 0) Object.keys(st).forEach(function (n) {
	        nr(t, n, st[n].primKey, st[n].indexes);
	      }), e = b._createTransaction(yt, fi, st), e.idbtrans = t, e.idbtrans.onerror = o(i, ["populating database"]), e.on("error").subscribe(i), r.newPSD(function () {
	        r.PSD.trans = e;try {
	          b.on("populate").fire(e);
	        } catch (n) {
	          u.onerror = t.onerror = function (n) {
	            n.preventDefault();
	          };try {
	            t.abort();
	          } catch (f) {}t.db.close();i(n);
	        }
	      });else {
	        if ((f = [], s = ui.filter(function (t) {
	          return t._cfg.version === n;
	        })[0], !s)) throw new nt("Dexie specification of currently installed DB version is missing");st = b._dbSchema = s._cfg.dbschema;h = !1;l = ui.filter(function (t) {
	          return t._cfg.version > n;
	        });l.forEach(function (n) {
	          var e = st,
	              r = n._cfg.dbschema,
	              u;or(e, t);or(r, t);st = b._dbSchema = r;u = ar(e, r);u.add.forEach(function (n) {
	            f.push(function (t, i) {
	              nr(t, n[0], n[1].primKey, n[1].indexes);i();
	            });
	          });u.change.forEach(function (n) {
	            if (n.recreate) throw new nt("Not yet support for changing primary key");else f.push(function (t, i) {
	              var r = t.objectStore(n.name);n.add.forEach(function (n) {
	                tr(r, n);
	              });n.change.forEach(function (n) {
	                r.deleteIndex(n.name);tr(r, n);
	              });n.del.forEach(function (n) {
	                r.deleteIndex(n);
	              });i();
	            });
	          });n._cfg.contentUpgrade && f.push(function (t, u) {
	            var f, e;h = !0;f = b._createTransaction(yt, [].slice.call(t.db.objectStoreNames, 0), r);f.idbtrans = t;e = 0;f._promise = w(f._promise, function (n) {
	              return function (t, i, r) {
	                function f(n) {
	                  return function () {
	                    n.apply(this, arguments);--e == 0 && u();
	                  };
	                }return ++e, n.call(this, t, function (n, t) {
	                  arguments[0] = f(n);arguments[1] = f(t);i.apply(this, arguments);
	                }, r);
	              };
	            });t.onerror = o(i, ["running upgrader function for version", n._cfg.version]);f.on("error").subscribe(i);n._cfg.contentUpgrade(f);e === 0 && u();
	          });h && dr() || f.push(function (n, t) {
	            yr(r, n);t();
	          });
	        });c = function () {
	          try {
	            f.length ? f.shift()(t, c) : vr(st, t);
	          } catch (n) {
	            u.onerror = t.onerror = function (n) {
	              n.preventDefault();
	            };try {
	              t.abort();
	            } catch (r) {}t.db.close();i(n);
	          }
	        };c();
	      }
	    }function ar(n, t) {
	      var f = { del: [], add: [], change: [] },
	          r,
	          e,
	          o,
	          i,
	          c,
	          s,
	          u,
	          l,
	          h;for (r in n) t[r] || f.del.push(r);for (r in t) if ((e = n[r], o = t[r], e)) {
	        if ((i = { name: r, def: t[r], recreate: !1, del: [], add: [], change: [] }, e.primKey.src !== o.primKey.src)) i.recreate = !0, f.change.push(i);else {
	          c = e.indexes.reduce(function (n, t) {
	            return n[t.name] = t, n;
	          }, {});s = o.indexes.reduce(function (n, t) {
	            return n[t.name] = t, n;
	          }, {});for (u in c) s[u] || i.del.push(u);for (u in s) l = c[u], h = s[u], l ? l.src !== h.src && i.change.push(h) : i.add.push(h);(i.recreate || i.del.length > 0 || i.add.length > 0 || i.change.length > 0) && f.change.push(i);
	        }
	      } else f.add.push([r, o]);return f;
	    }function nr(n, t, i, r) {
	      var u = n.db.createObjectStore(t, i.keyPath ? { keyPath: i.keyPath, autoIncrement: i.auto } : { autoIncrement: i.auto });return r.forEach(function (n) {
	        tr(u, n);
	      }), u;
	    }function vr(n, t) {
	      Object.keys(n).forEach(function (i) {
	        t.db.objectStoreNames.contains(i) || nr(t, i, n[i].primKey, n[i].indexes);
	      });
	    }function yr(n, t) {
	      for (var u, r = 0; r < t.db.objectStoreNames.length; ++r) u = t.db.objectStoreNames[r], (n[u] === null || n[u] === i) && t.db.deleteObjectStore(u);
	    }function tr(n, t) {
	      n.createIndex(t.name, t.keyPath, { unique: t.unique, multiEntry: t.multi });
	    }function pr(n, t) {
	      throw new nt("Table " + t[0] + " not part of transaction. Original Scope Function Source: " + u.Promise.PSD.trans.scopeFunc.toString());
	    }function oi(n, t, i, r) {
	      this.name = n;this.schema = i;this.hook = dt[n] ? dt[n].hook : v(null, { creating: [at, f], reading: [lt, tt], updating: [vt, f], deleting: [wt, f] });this._tpf = t;this._collClass = r || ai;
	    }function wi(n, t, i, r) {
	      oi.call(this, n, t, i, r || rr);
	    }function ir(n, t, i, r) {
	      function o(n, t, i, r) {
	        return s._promise(n, i, r);
	      }var s = this,
	          f,
	          u,
	          e;for (this.db = b, this.mode = n, this.storeNames = t, this.idbtrans = null, this.on = v(this, ["complete", "error"], "abort"), this._reculock = 0, this._blockedFuncs = [], this._psd = null, this.active = !0, this._dbschema = i, r && (this.parent = r), this._tpf = o, this.tables = Object.create(di), f = t.length - 1; f !== -1; --f) u = t[f], e = b._tableFactory(n, i[u], o), this.tables[u] = e, this[u] || (this[u] = e);
	    }function li(n, t, i) {
	      this._ctx = { table: n, index: t === ":id" ? null : t, collClass: n._collClass, or: i };
	    }function ai(n, t) {
	      var r = null,
	          u = null,
	          i;if (t) try {
	        r = t();
	      } catch (f) {
	        u = f;
	      }i = n._ctx;this._ctx = { table: i.table, index: i.index, isPrimKey: !i.index || i.table.schema.primKey.keyPath && i.index === i.table.schema.primKey.name, range: r, op: "openCursor", dir: "next", unique: "", algorithm: null, filter: null, isMatch: null, offset: 0, limit: Infinity, error: u, or: i.or };
	    }function rr() {
	      ai.apply(this, arguments);
	    }function wr(n, t) {
	      return n._cfg.version - t._cfg.version;
	    }function ur(n, t, i, u, f, e) {
	      i.forEach(function (i) {
	        var o = b._tableFactory(u, f[i], t);n.forEach(function (n) {
	          n[i] || (e ? Object.defineProperty(n, i, { configurable: !0, enumerable: !0, get: function () {
	              var n = r.PSD && r.PSD.trans;return n && n.db === b ? n.tables[i] : o;
	            } }) : n[i] = o);
	        });
	      });
	    }function br(n) {
	      n.forEach(function (n) {
	        for (var t in n) n[t] instanceof oi && delete n[t];
	      });
	    }function bi(n, t, i, u, f, e) {
	      var s = r.PSD;e = e || tt;n.onerror || (n.onerror = o(f));n.onsuccess = t ? d(function () {
	        var r = n.result,
	            o;r ? (o = function () {
	          r.continue();
	        }, t(r, function (n) {
	          o = n;
	        }, u, f) && i(e(r.value), r, function (n) {
	          o = n;
	        }), o()) : u();
	      }, f, s) : d(function () {
	        var t = n.result,
	            r;t ? (r = function () {
	          t.continue();
	        }, i(e(t.value), t, function (n) {
	          r = n;
	        }), r()) : u();
	      }, f, s);
	    }function kr(n) {
	      var t = [];return n.split(",").forEach(function (n) {
	        n = n.trim();var i = n.replace("&", "").replace("++", "").replace("*", ""),
	            r = i.indexOf("[") !== 0 ? i : n.substring(n.indexOf("[") + 1, n.indexOf("]")).split("+");t.push(new a(i, r || null, n.indexOf("&") !== -1, n.indexOf("*") !== -1, n.indexOf("++") !== -1, Array.isArray(r), r.indexOf(".") !== -1));
	      }), t;
	    }function ii(n, t) {
	      return n < t ? -1 : n > t ? 1 : 0;
	    }function fr(n, t) {
	      return n < t ? 1 : n > t ? -1 : 0;
	    }function er(n) {
	      return function (t, i) {
	        for (var r = 0, u;;) {
	          if ((u = n(t[r], i[r]), u !== 0)) return u;if ((++r, r === t.length || r === i.length)) return n(t.length, i.length);
	        }
	      };
	    }function ki(n, t) {
	      return n ? t ? function () {
	        return n.apply(this, arguments) && t.apply(this, arguments);
	      } : n : t;
	    }function dr() {
	      return navigator.userAgent.indexOf("Trident") >= 0 || navigator.userAgent.indexOf("MSIE") >= 0;
	    }function gr() {
	      if ((b.verno = it.version / 10, b._dbSchema = st = {}, fi = [].slice.call(it.objectStoreNames, 0), fi.length !== 0)) {
	        var n = it.transaction(ot(fi), "readonly");fi.forEach(function (t) {
	          for (var u, s, r = n.objectStore(t), i = r.keyPath, f = i && typeof i == "string" && i.indexOf(".") !== -1, h = new a(i, i || "", !1, !1, !!r.autoIncrement, i && typeof i != "string", f), o = [], e = 0; e < r.indexNames.length; ++e) u = r.index(r.indexNames[e]), i = u.keyPath, f = i && typeof i == "string" && i.indexOf(".") !== -1, s = new a(u.name, i, !!u.unique, !!u.multiEntry, !1, i && typeof i != "string", f), o.push(s);st[t] = new et(t, h, o, {});
	        });ur([dt], b._transPromiseFactory, Object.keys(st), yt, st);
	      }
	    }function or(n, t) {
	      for (var i, r, u, o, s = t.db.objectStoreNames, f = 0; f < s.length; ++f) for (i = s[f], r = t.objectStore(i), u = 0; u < r.indexNames.length; ++u) {
	        var h = r.indexNames[u],
	            e = r.index(h).keyPath,
	            c = typeof e == "string" ? e : "[" + [].slice.call(e).join("+") + "]";n[i] && (o = n[i].idxByName[c], o && (o.name = h));
	      }
	    }var hr = t && t.addons || u.addons,
	        si = u.dependencies,
	        vi = si.indexedDB,
	        kt = si.IDBKeyRange,
	        nu = si.IDBTransaction,
	        tu = si.DOMError,
	        yi = si.TypeError,
	        nt = si.Error,
	        st = this._dbSchema = {},
	        ui = [],
	        fi = [],
	        dt = {},
	        di = {},
	        it = null,
	        hi = !0,
	        ei = null,
	        pi = !1,
	        ti = "readonly",
	        yt = "readwrite",
	        b = this,
	        ri = [],
	        ci = !0,
	        sr = !!ct();this.version = function (n) {
	      if (it) throw new nt("Cannot add version when database is open");this.verno = Math.max(this.verno, n);var t = ui.filter(function (t) {
	        return t._cfg.version === n;
	      })[0];return t ? t : (t = new gi(n), ui.push(t), ui.sort(wr), t);
	    };s(gi.prototype, { stores: function (n) {
	        var i, t;return this._cfg.storesSource = this._cfg.storesSource ? s(this._cfg.storesSource, n) : n, i = {}, ui.forEach(function (n) {
	          s(i, n._cfg.storesSource);
	        }), t = this._cfg.dbschema = {}, this._parseStoresSpec(i, t), st = b._dbSchema = t, br([dt, b, di]), ur([di], pr, Object.keys(t), yt, t), ur([dt, b, this._cfg.tables], b._transPromiseFactory, Object.keys(t), yt, t, !0), fi = Object.keys(t), this;
	      }, upgrade: function (n) {
	        var t = this;return k(function () {
	          n(b._createTransaction(yt, Object.keys(t._cfg.dbschema), t._cfg.dbschema));
	        }), this._cfg.contentUpgrade = n, this;
	      }, _parseStoresSpec: function (n, t) {
	        Object.keys(n).forEach(function (i) {
	          if (n[i] !== null) {
	            var u = {},
	                f = kr(n[i]),
	                r = f.shift();if (r.multi) throw new nt("Primary key cannot be multi-valued");r.keyPath && h(u, r.keyPath, r.auto ? 0 : r.keyPath);f.forEach(function (n) {
	              if (n.auto) throw new nt("Only primary key can be marked as autoIncrement (++)");if (!n.keyPath) throw new nt("Index must have a name and cannot be an empty string");h(u, n.keyPath, n.compound ? n.keyPath.map(function () {
	                return "";
	              }) : "");
	            });t[i] = new et(i, r, f, u);
	          }
	        });
	      } });this._allTables = dt;this._tableFactory = function (n, t, i) {
	      return n === ti ? new oi(t.name, i, t, ai) : new wi(t.name, i, t);
	    };this._createTransaction = function (n, t, i, r) {
	      return new ir(n, t, i, r);
	    };this._transPromiseFactory = function (n, t, i) {
	      var f, u;return !hi || r.PSD && r.PSD.letThrough ? (u = b._createTransaction(n, t, st), u._promise(n, function (n, t) {
	        u.error(function (n) {
	          b.on("error").fire(n);
	        });i(function (t) {
	          u.complete(function () {
	            n(t);
	          });
	        }, t, u);
	      })) : f = new r(function (r, u) {
	        ri.push({ resume: function () {
	            var e = b._transPromiseFactory(n, t, i);f.onuncatched = e.onuncatched;e.then(r, u);
	          } });
	      });
	    };this._whenReady = function (n) {
	      return !e && hi && (!r.PSD || !r.PSD.letThrough) ? new r(function (t, i) {
	        ri.push({ resume: function () {
	            n(t, i);
	          } });
	      }) : new r(n);
	    };this.verno = 0;this.open = function () {
	      return new r(function (t, i) {
	        function f(n) {
	          try {
	            u.transaction.abort();
	          } catch (t) {}pi = !1;ei = n;hi = !1;i(ei);ri.forEach(function (n) {
	            n.resume();
	          });ri = [];
	        }if ((e && t(b), it || pi)) throw new nt("Database already opened or being opened");var u,
	            s = !1;try {
	          if ((ei = null, pi = !0, ui.length > 0 && (ci = !1), !vi)) throw new nt("indexedDB API not found. If using IE10+, make sure to run your code on a server URL (not locally). If using Safari, make sure to include indexedDB polyfill.");if ((u = ci ? vi.open(n) : vi.open(n, Math.round(b.verno * 10)), !u)) throw new nt("IndexedDB API not available");u.onerror = o(f, ["opening database", n]);u.onblocked = function (n) {
	            b.on("blocked").fire(n);
	          };u.onupgradeneeded = d(function (t) {
	            var i, r;ci && !b._allowEmptyDB ? (u.onerror = function (n) {
	              n.preventDefault();
	            }, u.transaction.abort(), u.result.close(), i = vi.deleteDatabase(n), i.onsuccess = i.onerror = function () {
	              f(new nt("Database '" + n + "' doesnt exist"));
	            }) : (t.oldVersion === 0 && (s = !0), u.transaction.onerror = o(f), r = t.oldVersion > Math.pow(2, 62) ? 0 : t.oldVersion, lr(r / 10, u.transaction, f, u));
	          }, f);u.onsuccess = d(function () {
	            pi = !1;it = u.result;ci ? gr() : it.objectStoreNames.length > 0 && or(st, it.transaction(ot(it.objectStoreNames), ti));it.onversionchange = b.on("versionchange").fire;sr || ft(function (t) {
	              if (t.indexOf(n) === -1) return t.push(n);
	            });r.newPSD(function () {
	              function i() {
	                hi = !1;ri.forEach(function (n) {
	                  n.resume();
	                });ri = [];t(b);
	              }r.PSD.letThrough = !0;try {
	                var n = b.on.ready.fire();n && typeof n.then == "function" ? n.then(i, function (n) {
	                  it.close();it = null;f(n);
	                }) : y(i);
	              } catch (u) {
	                f(u);
	              }
	            });
	          }, f);
	        } catch (h) {
	          f(h);
	        }
	      });
	    };this.close = function () {
	      it && (it.close(), it = null, hi = !0, ei = null);
	    };this.delete = function () {
	      var t = arguments;return new r(function (i, r) {
	        function u() {
	          b.close();var t = vi.deleteDatabase(n);t.onsuccess = function () {
	            sr || ft(function (t) {
	              var i = t.indexOf(n);if (i >= 0) return t.splice(i, 1);
	            });i();
	          };t.onerror = o(r, ["deleting", n]);t.onblocked = function () {
	            b.on("blocked").fire();
	          };
	        }if (t.length > 0) throw new nt("Arguments not allowed in db.delete()");pi ? ri.push({ resume: u }) : u();
	      });
	    };this.backendDB = function () {
	      return it;
	    };this.isOpen = function () {
	      return it !== null;
	    };this.hasFailed = function () {
	      return ei !== null;
	    };this.dynamicallyOpened = function () {
	      return ci;
	    };this.name = n;Object.defineProperty(this, "tables", { get: function () {
	        return Object.keys(dt).map(function (n) {
	          return dt[n];
	        });
	      } });this.on = v(this, "error", "populate", "blocked", { ready: [bt, f], versionchange: [pt, f] });this.on.ready.subscribe = w(this.on.ready.subscribe, function (n) {
	      return function (t, i) {
	        function r() {
	          return i || b.on.ready.unsubscribe(r), t.apply(this, arguments);
	        }n.call(this, r);b.isOpen() && (hi ? ri.push({ resume: r }) : r());
	      };
	    });k(function () {
	      b.on("populate").fire(b._createTransaction(yt, fi, st));b.on("error").fire(new nt());
	    });this.transaction = function (n, t, i) {
	      function s(t, e) {
	        var s = null,
	            c,
	            a,
	            h;try {
	          if (f) throw f;s = b._createTransaction(n, o, st, u);c = o.map(function (n) {
	            return s.tables[n];
	          });c.push(s);h = 0;r.newPSD(function () {
	            r.PSD.trans = s;s.scopeFunc = i;u && (s.idbtrans = u.idbtrans, s._promise = w(s._promise, function (n) {
	              return function (t, i, u) {
	                function f(n) {
	                  return function (t) {
	                    var i;return r._rootExec(function () {
	                      i = n(t);r._tickFinalize(function () {
	                        --h == 0 && s.active && (s.active = !1, s.on.complete.fire());
	                      });
	                    }), i;
	                  };
	                }return ++h, n.call(this, t, function (n, t, r) {
	                  return i(f(n), f(t), r);
	                }, u);
	              };
	            }));s.complete(function () {
	              t(a);
	            });s.error(function (n) {
	              s.idbtrans && (s.idbtrans.onerror = ht);try {
	                s.abort();
	              } catch (i) {}u && (u.active = !1, u.on.error.fire(n));var t = e(n);u || t || b.on.error.fire(n);
	            });r._rootExec(function () {
	              a = i.apply(s, c);
	            });
	          });(!s.idbtrans || u && h === 0) && s._nop();
	        } catch (l) {
	          s && s.idbtrans && (s.idbtrans.onerror = ht);s && s.abort();u && u.on.error.fire(l);y(function () {
	            e(l) || b.on("error").fire(l);
	          });
	        }
	      }var u, e;t = [].slice.call(arguments, 1, arguments.length - 1);i = arguments[arguments.length - 1];u = r.PSD && r.PSD.trans;u && u.db === b && n.indexOf("!") === -1 || (u = null);e = n.indexOf("?") !== -1;n = n.replace("!", "").replace("?", "");var h = Array.isArray(t[0]) ? t.reduce(function (n, t) {
	        return n.concat(t);
	      }) : t,
	          f = null,
	          o = h.map(function (n) {
	        return typeof n == "string" ? n : (n instanceof oi || (f = f || new yi("Invalid type. Arguments following mode must be instances of Table or String")), n.name);
	      });return n == "r" || n == ti ? n = ti : n == "rw" || n == yt ? n = yt : f = new nt("Invalid transaction mode: " + n), u && (f || (u && u.mode === ti && n === yt && (e ? u = null : f = f || new nt("Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY")), u && o.forEach(function (n) {
	        u.tables.hasOwnProperty(n) || (e ? u = null : f = f || new nt("Table " + n + " not included in parent transaction. Parent Transaction function: " + u.scopeFunc.toString()));
	      }))), u ? u._promise(n, s, "lock") : b._whenReady(s);
	    };this.table = function (n) {
	      if (e && ci) return new wi(n);if (!dt.hasOwnProperty(n)) throw new nt("Table does not exist");return dt[n];
	    };s(oi.prototype, function () {
	      function n() {
	        throw new nt("Current Transaction is READONLY");
	      }return { _trans: function (n, t, i) {
	          return this._tpf(n, [this.name], t, i);
	        }, _idbstore: function (n, t, i) {
	          if (e) return new r(t);var u = this;return this._tpf(n, [this.name], function (n, i, r) {
	            t(n, i, r.idbtrans.objectStore(u.name), r);
	          }, i);
	        }, get: function (n, t) {
	          var i = this;return this._idbstore(ti, function (t, r, u) {
	            e && t(i.schema.instanceTemplate);var f = u.get(n);f.onerror = o(r, ["getting", n, "from", i.name]);f.onsuccess = function () {
	              t(i.hook.reading.fire(f.result));
	            };
	          }).then(t);
	        }, where: function (n) {
	          return new li(this, n);
	        }, count: function (n) {
	          return this.toCollection().count(n);
	        }, offset: function (n) {
	          return this.toCollection().offset(n);
	        }, limit: function (n) {
	          return this.toCollection().limit(n);
	        }, reverse: function () {
	          return this.toCollection().reverse();
	        }, filter: function (n) {
	          return this.toCollection().and(n);
	        }, each: function (n) {
	          var t = this;return e && n(t.schema.instanceTemplate), this._idbstore(ti, function (i, r, u) {
	            var f = u.openCursor();f.onerror = o(r, ["calling", "Table.each()", "on", t.name]);bi(f, null, n, i, r, t.hook.reading.fire);
	          });
	        }, toArray: function (n) {
	          var t = this;return this._idbstore(ti, function (n, i, r) {
	            e && n([t.schema.instanceTemplate]);var u = [],
	                f = r.openCursor();f.onerror = o(i, ["calling", "Table.toArray()", "on", t.name]);bi(f, null, function (n) {
	              u.push(n);
	            }, function () {
	              n(u);
	            }, i, t.hook.reading.fire);
	          }).then(n);
	        }, orderBy: function (n) {
	          return new this._collClass(new li(this, n));
	        }, toCollection: function () {
	          return new this._collClass(new li(this));
	        }, mapToClass: function (n, t) {
	          var i, r;return this.schema.mappedClass = n, i = Object.create(n.prototype), t && ut(i, t), this.schema.instanceTemplate = i, r = function (t) {
	            var r, i;if (!t) return t;r = Object.create(n.prototype);for (i in t) t.hasOwnProperty(i) && (r[i] = t[i]);return r;
	          }, this.schema.readHook && this.hook.reading.unsubscribe(this.schema.readHook), this.schema.readHook = r, this.hook("reading", r), n;
	        }, defineClass: function (n) {
	          return this.mapToClass(u.defineClass(n), n);
	        }, add: n, put: n, "delete": n, clear: n, update: n };
	    });p(wi).from(oi).extend(function () {
	      return { add: function (n, t) {
	          var u = this,
	              r = this.hook.creating.fire;return this._idbstore(yt, function (e, s, l, a) {
	            var v = {},
	                w,
	                y,
	                p;r !== f && (w = t || (l.keyPath ? c(n, l.keyPath) : i), y = r.call(v, w, n, a), w === i && y !== i && (l.keyPath ? h(n, l.keyPath, y) : t = y));p = t ? l.add(n, t) : l.add(n);p.onerror = o(function (n) {
	              if (v.onerror) v.onerror(n);return s(n);
	            }, ["adding", n, "into", u.name]);p.onsuccess = function (t) {
	              var i = l.keyPath;if ((i && h(n, i, t.target.result), v.onsuccess)) v.onsuccess(t.target.result);e(p.result);
	            };
	          });
	        }, put: function (n, t) {
	          var r = this,
	              u = this.hook.creating.fire,
	              e = this.hook.updating.fire;return u !== f || e !== f ? this._trans(yt, function (u, f, e) {
	            var o = t || r.schema.primKey.keyPath && c(n, r.schema.primKey.keyPath);o === i ? e.tables[r.name].add(n).then(u, f) : (e._lock(), n = l(n), e.tables[r.name].where(":id").equals(o).modify(function () {
	              this.value = n;
	            }).then(function (i) {
	              return i === 0 ? e.tables[r.name].add(n, t) : o;
	            }).finally(function () {
	              e._unlock();
	            }).then(u, f));
	          }) : this._idbstore(yt, function (i, u, f) {
	            var e = t ? f.put(n, t) : f.put(n);e.onerror = o(u, ["putting", n, "into", r.name]);e.onsuccess = function (t) {
	              var r = f.keyPath;r && h(n, r, t.target.result);i(e.result);
	            };
	          });
	        }, "delete": function (n) {
	          return this.hook.deleting.subscribers.length ? this.where(":id").equals(n).delete() : this._idbstore(yt, function (t, i, r) {
	            var u = r.delete(n);u.onerror = o(i, ["deleting", n, "from", r.name]);u.onsuccess = function () {
	              t(u.result);
	            };
	          });
	        }, clear: function () {
	          return this.hook.deleting.subscribers.length ? this.toCollection().delete() : this._idbstore(yt, function (n, t, i) {
	            var r = i.clear();r.onerror = o(t, ["clearing", i.name]);r.onsuccess = function () {
	              n(r.result);
	            };
	          });
	        }, update: function (n, t) {
	          if (typeof t != "object" || Array.isArray(t)) throw new nt("db.update(keyOrObject, modifications). modifications must be an object.");if (typeof n != "object" || Array.isArray(n)) return this.where(":id").equals(n).modify(t);Object.keys(t).forEach(function (i) {
	            h(n, i, t[i]);
	          });var u = c(n, this.schema.primKey.keyPath);return u === i && r.reject(new nt("Object does not contain its primary key")), this.where(":id").equals(u).modify(t);
	        } };
	    });s(ir.prototype, { _lock: function () {
	        return ++this._reculock, this._reculock === 1 && r.PSD && (r.PSD.lockOwnerFor = this), this;
	      }, _unlock: function () {
	        if (--this._reculock == 0) for (r.PSD && (r.PSD.lockOwnerFor = null); this._blockedFuncs.length > 0 && !this._locked();) {
	          var n = this._blockedFuncs.shift();try {
	            n();
	          } catch (t) {}
	        }return this;
	      }, _locked: function () {
	        return this._reculock && (!r.PSD || r.PSD.lockOwnerFor !== this);
	      }, _nop: function (n) {
	        this.tables[this.storeNames[0]].get(0).then(n);
	      }, _promise: function (n, t, i) {
	        var f = this;return r.newPSD(function () {
	          var e;return f._locked() ? e = new r(function (r, u) {
	            f._blockedFuncs.push(function () {
	              f._promise(n, t, i).then(r, u);
	            });
	          }) : (e = f.active ? new r(function (r, e) {
	            if (!f.idbtrans && n) {
	              if (!it) throw ei ? new nt("Database not open. Following error in populate, ready or upgrade function made Dexie.open() fail: " + ei) : new nt("Database not open");var o = f.idbtrans = it.transaction(ot(f.storeNames), f.mode);o.onerror = function (n) {
	                f.on("error").fire(n && n.target.error);n.preventDefault();f.abort();
	              };o.onabort = function (n) {
	                y(function () {
	                  f.on("error").fire(new nt("Transaction aborted for unknown reason"));
	                });f.active = !1;f.on("abort").fire(n);
	              };o.oncomplete = function (n) {
	                f.active = !1;f.on("complete").fire(n);
	              };
	            }i && f._lock();try {
	              t(r, e, f);
	            } catch (s) {
	              u.ignoreTransaction(function () {
	                f.on("error").fire(s);
	              });f.abort();e(s);
	            }
	          }) : r.reject(ni(new nt("Transaction is inactive. Original Scope Function Source: " + f.scopeFunc.toString()))), f.active && i && e.finally(function () {
	            f._unlock();
	          })), e.onuncatched = function (n) {
	            u.ignoreTransaction(function () {
	              f.on("error").fire(n);
	            });f.abort();
	          }, e;
	        });
	      }, complete: function (n) {
	        return this.on("complete", n);
	      }, error: function (n) {
	        return this.on("error", n);
	      }, abort: function () {
	        if (this.idbtrans && this.active) try {
	          this.active = !1;this.idbtrans.abort();this.on.error.fire(new nt("Transaction Aborted"));
	        } catch (n) {}
	      }, table: function (n) {
	        if (!this.tables.hasOwnProperty(n)) throw new nt("Table " + n + " not in transaction");return this.tables[n];
	      } });s(li.prototype, function () {
	      function n(n, t) {
	        try {
	          throw t;
	        } catch (i) {
	          n._ctx.error = i;
	        }return n;
	      }function t(n) {
	        return Array.prototype.slice.call(n.length === 1 && Array.isArray(n[0]) ? n[0] : n);
	      }function r(n) {
	        return n === "next" ? function (n) {
	          return n.toUpperCase();
	        } : function (n) {
	          return n.toLowerCase();
	        };
	      }function u(n) {
	        return n === "next" ? function (n) {
	          return n.toLowerCase();
	        } : function (n) {
	          return n.toUpperCase();
	        };
	      }function f(n, t, i, r, u, f) {
	        for (var h, s = Math.min(n.length, r.length), o = -1, e = 0; e < s; ++e) {
	          if ((h = t[e], h !== r[e])) return u(n[e], i[e]) < 0 ? n.substr(0, e) + i[e] + i.substr(e + 1) : u(n[e], r[e]) < 0 ? n.substr(0, e) + r[e] + i.substr(e + 1) : o >= 0 ? n.substr(0, o) + t[o] + i.substr(o + 1) : null;u(n[e], h) < 0 && (o = e);
	        }return s < r.length && f === "next" ? n + i.substr(n.length) : s < n.length && f === "prev" ? n.substr(0, i.length) : o < 0 ? null : n.substr(0, o) + r[o] + i.substr(o + 1);
	      }function i(n, t, i) {
	        function a(n) {
	          s = r(n);e = u(n);h = n === "next" ? ii : fr;c = s(i);o = e(i);l = n;
	        }var s, e, h, c, o, l;a("next");n._ondirectionchange = function (n) {
	          a(n);
	        };n._addAlgorithm(function (n, i, r) {
	          var u = n.key,
	              s,
	              a;return typeof u != "string" ? !1 : (s = e(u), t(s, o) ? (i(function () {
	            n.continue();
	          }), !0) : (a = f(u, s, c, o, h, l), a ? i(function () {
	            n.continue(a);
	          }) : i(r), !1));
	        });
	      }return { between: function (n, t, i, r) {
	          return (i = i !== !1, r = r === !0, n > t || n === t && (i || r) && !(i && r)) ? new this._ctx.collClass(this, function () {
	            return kt.only(n);
	          }).limit(0) : new this._ctx.collClass(this, function () {
	            return kt.bound(n, t, !i, !r);
	          });
	        }, equals: function (n) {
	          return new this._ctx.collClass(this, function () {
	            return kt.only(n);
	          });
	        }, above: function (n) {
	          return new this._ctx.collClass(this, function () {
	            return kt.lowerBound(n, !0);
	          });
	        }, aboveOrEqual: function (n) {
	          return new this._ctx.collClass(this, function () {
	            return kt.lowerBound(n);
	          });
	        }, below: function (n) {
	          return new this._ctx.collClass(this, function () {
	            return kt.upperBound(n, !0);
	          });
	        }, belowOrEqual: function (n) {
	          return new this._ctx.collClass(this, function () {
	            return kt.upperBound(n);
	          });
	        }, startsWith: function (t) {
	          return typeof t != "string" ? n(new this._ctx.collClass(this), new yi("String expected")) : this.between(t, t + String.fromCharCode(65535), !0, !0);
	        }, startsWithIgnoreCase: function (t) {
	          if (typeof t != "string") return n(new this._ctx.collClass(this), new yi("String expected"));if (t === "") return this.startsWith(t);var r = new this._ctx.collClass(this, function () {
	            return kt.bound(t.toUpperCase(), t.toLowerCase() + String.fromCharCode(65535));
	          });return i(r, function (n, t) {
	            return n.indexOf(t) === 0;
	          }, t), r._ondirectionchange = function () {
	            n(r, new nt("reverse() not supported with WhereClause.startsWithIgnoreCase()"));
	          }, r;
	        }, equalsIgnoreCase: function (t) {
	          if (typeof t != "string") return n(new this._ctx.collClass(this), new yi("String expected"));var r = new this._ctx.collClass(this, function () {
	            return kt.bound(t.toUpperCase(), t.toLowerCase());
	          });return i(r, function (n, t) {
	            return n === t;
	          }, t), r;
	        }, anyOf: function () {
	          var f = this._ctx,
	              e = f.table.schema,
	              o = f.index ? e.idxByName[f.index] : e.primKey,
	              s = o && o.compound,
	              n = t(arguments),
	              i = s ? er(ii) : ii,
	              u,
	              r;return (n.sort(i), n.length === 0) ? new this._ctx.collClass(this, function () {
	            return kt.only("");
	          }).limit(0) : (u = new this._ctx.collClass(this, function () {
	            return kt.bound(n[0], n[n.length - 1]);
	          }), u._ondirectionchange = function (t) {
	            i = t === "next" ? ii : fr;s && (i = er(i));n.sort(i);
	          }, r = 0, u._addAlgorithm(function (t, u, f) {
	            for (var e = t.key; i(e, n[r]) > 0;) if ((++r, r === n.length)) return u(f), !1;return i(e, n[r]) === 0 ? (u(function () {
	              t.continue();
	            }), !0) : (u(function () {
	              t.continue(n[r]);
	            }), !1);
	          }), u);
	        }, notEqual: function (n) {
	          return this.below(n).or(this._ctx.index).above(n);
	        }, noneOf: function () {
	          var i = this._ctx,
	              f = i.table.schema,
	              e = i.index ? f.idxByName[i.index] : f.primKey,
	              h = e && e.compound,
	              n = t(arguments),
	              o,
	              r,
	              s,
	              u;return n.length === 0 ? new this._ctx.collClass(this) : (o = h ? er(ii) : ii, n.sort(o), r = n.reduce(function (n, t) {
	            return n ? n.concat([[n[n.length - 1][1], t]]) : [[null, t]];
	          }, null), r.push([n[n.length - 1], null]), s = this, u = i.index, r.reduce(function (n, t) {
	            return n ? t[1] === null ? n.or(u).above(t[0]) : n.or(u).between(t[0], t[1], !1, !1) : s.below(t[1]);
	          }, null));
	        }, startsWithAnyOf: function () {
	          function h(n) {
	            return n > f[r];
	          }function c(n) {
	            return n < i[r];
	          }var s = this._ctx,
	              i = t(arguments),
	              f,
	              u,
	              r,
	              e,
	              o;return i.every(function (n) {
	            return typeof n == "string";
	          }) ? i.length === 0 ? new s.collClass(this, function () {
	            return kt.only("");
	          }).limit(0) : (f = i.map(function (n) {
	            return n + String.fromCharCode(65535);
	          }), u = ii, i.sort(u), r = 0, e = h, o = new s.collClass(this, function () {
	            return kt.bound(i[0], i[i.length - 1] + String.fromCharCode(65535));
	          }), o._ondirectionchange = function (n) {
	            n === "next" ? (e = h, u = ii) : (e = c, u = fr);i.sort(u);f.sort(u);
	          }, o._addAlgorithm(function (n, t, o) {
	            for (var s = n.key; e(s);) if ((++r, r === i.length)) return t(o), !1;return s >= i[r] && s <= f[r] ? (t(function () {
	              n.continue();
	            }), !0) : (t(function () {
	              u === ii ? n.continue(i[r]) : n.continue(f[r]);
	            }), !1);
	          }), o) : n(new s.collClass(this), new yi("startsWithAnyOf() only works with strings"));
	        } };
	    });s(ai.prototype, function () {
	      function n(n, t) {
	        n.filter = ki(n.filter, t);
	      }function s(n, t) {
	        n.isMatch = ki(n.isMatch, t);
	      }function u(n, t) {
	        if (n.isPrimKey) return t;var i = n.table.schema.idxByName[n.index];if (!i) throw new nt("KeyPath " + n.index + " on object store " + t.name + " is not indexed");return n.isPrimKey ? t : t.index(i.name);
	      }function f(n, t) {
	        return u(n, t)[n.op](n.range || null, n.dir + n.unique);
	      }function i(n, t, i, r, u) {
	        n.or ? (function () {
	          function e() {
	            ++c == 2 && i();
	          }function h(n, i, u) {
	            if (!o || o(i, u, e, r)) {
	              var f = i.primaryKey.toString();s.hasOwnProperty(f) || (s[f] = !0, t(n, i, u));
	            }
	          }var o = n.filter,
	              s = {},
	              l = n.table.schema.primKey.keyPath,
	              c = 0;n.or._iterate(h, e, r, u);bi(f(n, u), n.algorithm, h, e, r, n.table.hook.reading.fire);
	        })() : bi(f(n, u), ki(n.algorithm, n.filter), t, i, r, n.table.hook.reading.fire);
	      }function t(n) {
	        return n.table.schema.instanceTemplate;
	      }return { _read: function (n, t) {
	          var i = this._ctx;return i.error ? i.table._trans(null, function (n, t) {
	            t(i.error);
	          }) : i.table._idbstore(ti, n).then(t);
	        }, _write: function (n) {
	          var t = this._ctx;return t.error ? t.table._trans(null, function (n, i) {
	            i(t.error);
	          }) : t.table._idbstore(yt, n, "locked");
	        }, _addAlgorithm: function (n) {
	          var t = this._ctx;t.algorithm = ki(t.algorithm, n);
	        }, _iterate: function (n, t, r, u) {
	          return i(this._ctx, n, t, r, u);
	        }, each: function (n) {
	          var r = this._ctx;return e && n(t(r)), this._read(function (t, u, f) {
	            i(r, n, t, u, f);
	          });
	        }, count: function (n) {
	          var s, t, f;return e ? r.resolve(0).then(n) : (s = this, t = this._ctx, t.filter || t.algorithm || t.or ? (f = 0, this._read(function (n, r, u) {
	            i(t, function () {
	              return ++f, !1;
	            }, function () {
	              n(f);
	            }, r, u);
	          }, n)) : this._read(function (n, i, r) {
	            var f = u(t, r),
	                e = t.range ? f.count(t.range) : f.count();e.onerror = o(i, ["calling", "count()", "on", s.name]);e.onsuccess = function (i) {
	              n(Math.min(i.target.result, Math.max(0, t.limit - t.offset)));
	            };
	          }, n));
	        }, sortBy: function (n, t) {
	          function r(n, t) {
	            return t ? r(n[i[t]], t - 1) : n[e];
	          }function o(n, t) {
	            var i = r(n, u),
	                e = r(t, u);return i < e ? -f : i > e ? f : 0;
	          }var s = this._ctx,
	              i = n.split(".").reverse(),
	              e = i[0],
	              u = i.length - 1,
	              f = this._ctx.dir === "next" ? 1 : -1;return this.toArray(function (n) {
	            return n.sort(o);
	          }).then(t);
	        }, toArray: function (n) {
	          var r = this._ctx;return this._read(function (n, u, f) {
	            e && n([t(r)]);var o = [];i(r, function (n) {
	              o.push(n);
	            }, function () {
	              n(o);
	            }, u, f);
	          }, n);
	        }, offset: function (t) {
	          var i = this._ctx;return t <= 0 ? this : (i.offset += t, i.or || i.algorithm || i.filter ? n(i, function () {
	            return --t < 0;
	          }) : n(i, function (n, i) {
	            return t === 0 ? !0 : t === 1 ? (--t, !1) : (i(function () {
	              n.advance(t);t = 0;
	            }), !1);
	          }), this);
	        }, limit: function (t) {
	          return this._ctx.limit = Math.min(this._ctx.limit, t), n(this._ctx, function (n, i, r) {
	            return --t <= 0 && i(r), t >= 0;
	          }), this;
	        }, until: function (i, r) {
	          var u = this._ctx;return e && i(t(u)), n(this._ctx, function (n, t, u) {
	            return i(n.value) ? (t(u), r) : !0;
	          }), this;
	        }, first: function (n) {
	          return this.limit(1).toArray(function (n) {
	            return n[0];
	          }).then(n);
	        }, last: function (n) {
	          return this.reverse().first(n);
	        }, and: function (i) {
	          return e && i(t(this._ctx)), n(this._ctx, function (n) {
	            return i(n.value);
	          }), s(this._ctx, i), this;
	        }, or: function (n) {
	          return new li(this._ctx.table, n, this);
	        }, reverse: function () {
	          return this._ctx.dir = this._ctx.dir === "prev" ? "next" : "prev", this._ondirectionchange && this._ondirectionchange(this._ctx.dir), this;
	        }, desc: function () {
	          return this.reverse();
	        }, eachKey: function (n) {
	          var i = this._ctx;return e && n(c(t(this._ctx), this._ctx.index ? this._ctx.table.schema.idxByName[this._ctx.index].keyPath : this._ctx.table.schema.primKey.keyPath)), i.isPrimKey || (i.op = "openKeyCursor"), this.each(function (t, i) {
	            n(i.key, i);
	          });
	        }, eachUniqueKey: function (n) {
	          return this._ctx.unique = "unique", this.eachKey(n);
	        }, keys: function (n) {
	          var i = this._ctx,
	              t;return (i.isPrimKey || (i.op = "openKeyCursor"), t = [], e) ? new r(this.eachKey.bind(this)).then(function (n) {
	            return [n];
	          }).then(n) : this.each(function (n, i) {
	            t.push(i.key);
	          }).then(function () {
	            return t;
	          }).then(n);
	        }, uniqueKeys: function (n) {
	          return this._ctx.unique = "unique", this.keys(n);
	        }, firstKey: function (n) {
	          return this.limit(1).keys(function (n) {
	            return n[0];
	          }).then(n);
	        }, lastKey: function (n) {
	          return this.reverse().firstKey(n);
	        }, distinct: function () {
	          var t = {};return n(this._ctx, function (n) {
	            var i = n.primaryKey.toString(),
	                r = t.hasOwnProperty(i);return t[i] = !0, !r;
	          }), this;
	        } };
	    });p(rr).from(ai).extend({ modify: function (n) {
	        var a = this,
	            t = this._ctx,
	            r = t.table.hook,
	            i = r.updating.fire,
	            u = r.deleting.fire;return e && typeof n == "function" && n.call({ value: t.table.schema.instanceTemplate }, t.table.schema.instanceTemplate), this._write(function (r, e, v, y) {
	          function st(n, i) {
	            var r, u, f;if ((et = i.primaryKey, r = { primKey: i.primaryKey, value: n }, w.call(r, n) !== !1)) u = !r.hasOwnProperty("value"), f = u ? i.delete() : i.update(r.value), ++ut, f.onerror = o(function (n) {
	              if ((p.push(n), nt.push(r.primKey), r.onerror)) r.onerror(n);return tt(), !0;
	            }, u ? ["deleting", n, "from", t.table.name] : ["modifying", n, "on", t.table.name]), f.onsuccess = function () {
	              if (r.onsuccess) r.onsuccess(r.value);++b;tt();
	            };else if (r.onsuccess) r.onsuccess(r.value);
	          }function ot(n) {
	            return n && (p.push(n), nt.push(et)), e(new g("Error modifying one or more objects", p, b, nt));
	          }function tt() {
	            ft && b + p.length === ut && (p.length > 0 ? ot() : r(b));
	          }var w, k, it, d;typeof n == "function" ? w = i === f && u === f ? n : function (t) {
	            var f = l(t),
	                e,
	                r;if (n.call(this, t) === !1) return !1;this.hasOwnProperty("value") ? (e = gt(f, this.value), r = i.call(this, e, this.primKey, f, y), r && (t = this.value, Object.keys(r).forEach(function (n) {
	              h(t, n, r[n]);
	            }))) : u.call(this, this.primKey, t, y);
	          } : i === f ? (k = Object.keys(n), it = k.length, w = function (t) {
	            for (var i, u, f = !1, r = 0; r < it; ++r) i = k[r], u = n[i], c(t, i) !== u && (h(t, i, u), f = !0);return f;
	          }) : (d = n, n = rt(d), w = function (t) {
	            var u = !1,
	                r = i.call(this, n, this.primKey, l(t), y);return r && s(n, r), Object.keys(n).forEach(function (i) {
	              var r = n[i];c(t, i) !== r && (h(t, i, r), u = !0);
	            }), r && (n = rt(d)), u;
	          });var ut = 0,
	              b = 0,
	              ft = !1,
	              p = [],
	              nt = [],
	              et = null;a._iterate(st, function () {
	            ft = !0;tt();
	          }, ot, v);
	        });
	      }, "delete": function () {
	        return this.modify(function () {
	          delete this.value;
	        });
	      } });s(this, { Collection: ai, Table: oi, Transaction: ir, Version: gi, WhereClause: li, WriteableCollection: rr, WriteableTable: wi });cr();hr.forEach(function (n) {
	      n(b);
	    });
	  }function f() {}function tt(n) {
	    return n;
	  }function lt(n, t) {
	    return n === tt ? t : function (i) {
	      return t(n(i));
	    };
	  }function b(n, t) {
	    return function () {
	      n.apply(this, arguments);t.apply(this, arguments);
	    };
	  }function at(n, t) {
	    return n === f ? t : function () {
	      var f = n.apply(this, arguments),
	          r,
	          u,
	          e;return f !== i && (arguments[0] = f), r = this.onsuccess, u = this.onerror, delete this.onsuccess, delete this.onerror, e = t.apply(this, arguments), r && (this.onsuccess = this.onsuccess ? b(r, this.onsuccess) : r), u && (this.onerror = this.onerror ? b(u, this.onerror) : u), e !== i ? e : f;
	    };
	  }function vt(n, t) {
	    return n === f ? t : function () {
	      var r = n.apply(this, arguments),
	          f,
	          e,
	          u;return r !== i && s(arguments[0], r), f = this.onsuccess, e = this.onerror, delete this.onsuccess, delete this.onerror, u = t.apply(this, arguments), f && (this.onsuccess = this.onsuccess ? b(f, this.onsuccess) : f), e && (this.onerror = this.onerror ? b(e, this.onerror) : e), r === i ? u === i ? i : u : u === i ? r : s(r, u);
	    };
	  }function yt(n, t) {
	    return n === f ? t : function () {
	      return n.apply(this, arguments) === !1 ? !1 : t.apply(this, arguments);
	    };
	  }function pt(n, t) {
	    return n === f ? t : function () {
	      return t.apply(this, arguments) === !1 ? !1 : n.apply(this, arguments);
	    };
	  }function wt(n, t) {
	    return n === f ? t : function () {
	      n.apply(this, arguments);t.apply(this, arguments);
	    };
	  }function bt(n, t) {
	    return n === f ? t : function () {
	      var i = n.apply(this, arguments),
	          r,
	          u;return i && typeof i.then == "function" ? (r = this, u = arguments, i.then(function () {
	        return t.apply(r, u);
	      })) : t.apply(this, arguments);
	    };
	  }function v(t) {
	    function i(n, t, i) {
	      if (Array.isArray(n)) return c(n);if (typeof n == "object") return h(n);t || (t = yt);i || (i = f);var r = { subscribers: [], fire: i, subscribe: function (n) {
	          r.subscribers.push(n);r.fire = t(r.fire, n);
	        }, unsubscribe: function (n) {
	          r.subscribers = r.subscribers.filter(function (t) {
	            return t !== n;
	          });r.fire = r.subscribers.reduce(t, i);
	        } };return u[n] = e[n] = r, r;
	    }function h(t) {
	      Object.keys(t).forEach(function (r) {
	        var f = t[r],
	            u;if (Array.isArray(f)) i(r, t[r][0], t[r][1]);else if (f === "asap") u = i(r, null, function () {
	          var t = arguments;u.subscribers.forEach(function (i) {
	            y(function () {
	              i.apply(n, t);
	            });
	          });
	        }), u.subscribe = function (n) {
	          u.subscribers.indexOf(n) === -1 && u.subscribers.push(n);
	        }, u.unsubscribe = function (n) {
	          var t = u.subscribers.indexOf(n);t !== -1 && u.subscribers.splice(t, 1);
	        };else throw new Error("Invalid event config");
	      });
	    }function c(n) {
	      function r() {
	        if (t) return !1;t = !0;
	      }var t = !1;n.forEach(function (n) {
	        i(n).subscribe(r);
	      });
	    }var o = arguments,
	        u = {},
	        e = function (n, i) {
	      if (i) {
	        var f = [].slice.call(arguments, 1),
	            r = u[n];return r.subscribe.apply(r, f), t;
	      }if (typeof n == "string") return u[n];
	    },
	        r,
	        s;for (e.addEventType = i, r = 1, s = o.length; r < s; ++r) i(o[r]);return e;
	  }function kt(n) {
	    if (!n) throw new Error("Assertion failed");
	  }function y(t) {
	    n.setImmediate ? setImmediate(t) : setTimeout(t, 0);
	  }function it(n) {
	    var t = setTimeout(n, 1e3);clearTimeout(t);
	  }function d(n, t, i) {
	    return function () {
	      var u = r.PSD;r.PSD = i;try {
	        n.apply(this, arguments);
	      } catch (f) {
	        t(f);
	      } finally {
	        r.PSD = u;
	      }
	    };
	  }function c(n, t) {
	    var f, r, o, s, u, e;if (n.hasOwnProperty(t)) return n[t];if (!t) return n;if (typeof t != "string") {
	      for (f = [], r = 0, o = t.length; r < o; ++r) s = c(n, t[r]), f.push(s);return f;
	    }return (u = t.indexOf("."), u !== -1) ? (e = n[t.substr(0, u)], e === i ? i : c(e, t.substr(u + 1))) : i;
	  }function h(n, t, r) {
	    var u, c, e, f, s, o;if (n && t !== i) if (typeof t != "string" && "length" in t) for (kt(typeof r != "string" && ("length" in r)), u = 0, c = t.length; u < c; ++u) h(n, t[u], r[u]);else e = t.indexOf("."), e !== -1 ? (f = t.substr(0, e), s = t.substr(e + 1), s === "" ? r === i ? delete n[f] : n[f] = r : (o = n[f], o || (o = n[f] = {}), h(o, s, r))) : r === i ? delete n[t] : n[t] = r;
	  }function dt(n, t) {
	    typeof t == "string" ? h(n, t, i) : "length" in t && [].map.call(t, function (t) {
	      h(n, t, i);
	    });
	  }function rt(n) {
	    var i = {};for (var t in n) n.hasOwnProperty(t) && (i[t] = n[t]);return i;
	  }function l(n) {
	    var t, i, u, r;if (!n || typeof n != "object") return n;if (Array.isArray(n)) for (t = [], i = 0, u = n.length; i < u; ++i) t.push(l(n[i]));else if (n instanceof Date) t = new Date(), t.setTime(n.getTime());else {
	      t = n.constructor ? Object.create(n.constructor.prototype) : {};for (r in n) n.hasOwnProperty(r) && (t[r] = l(n[r]));
	    }return t;
	  }function gt(n, t) {
	    var u = {};for (var r in n) n.hasOwnProperty(r) && (t.hasOwnProperty(r) ? n[r] !== t[r] && JSON.stringify(n[r]) != JSON.stringify(t[r]) && (u[r] = t[r]) : u[r] = i);for (r in t) t.hasOwnProperty(r) && !n.hasOwnProperty(r) && (u[r] = t[r]);return u;
	  }function st(n) {
	    if (typeof n == "function") return new n();if (Array.isArray(n)) return [st(n[0])];if (n && typeof n == "object") {
	      var t = {};return ut(t, n), t;
	    }return n;
	  }function ut(n, t) {
	    Object.keys(t).forEach(function (i) {
	      var r = st(t[i]);n[i] = r;
	    });
	  }function o(n, t) {
	    return function (i) {
	      var r = i && i.target.error || new Error(),
	          u;return t && (u = " occurred when " + t.map(function (n) {
	        switch (typeof n) {case "function":
	            return n();case "string":
	            return n;default:
	            return JSON.stringify(n);}
	      }).join(" "), r.name ? r.toString = function () {
	        return r.name + u + (r.message ? ". " + r.message : "");
	      } : r = r + u), n(r), i && (i.stopPropagation && i.stopPropagation(), i.preventDefault && i.preventDefault()), !1;
	    };
	  }function ni(n) {
	    try {
	      throw n;
	    } catch (t) {
	      return t;
	    }
	  }function ht(n) {
	    n.preventDefault();
	  }function ft(n) {
	    var t,
	        i = u.dependencies.localStorage;if (!i) return n([]);try {
	      t = JSON.parse(i.getItem("Dexie.DatabaseNames") || "[]");
	    } catch (r) {
	      t = [];
	    }n(t) && i.setItem("Dexie.DatabaseNames", JSON.stringify(t));
	  }function a(n, t, i, r, u, f, e) {
	    this.name = n;this.keyPath = t;this.unique = i;this.multi = r;this.auto = u;this.compound = f;this.dotted = e;var o = typeof t == "string" ? t : t && "[" + [].join.call(t, "+") + "]";this.src = (i ? "&" : "") + (r ? "*" : "") + (u ? "++" : "") + o;
	  }function et(n, t, i, r) {
	    this.name = n;this.primKey = t || new a();this.indexes = i || [new a()];this.instanceTemplate = r;this.mappedClass = null;this.idxByName = i.reduce(function (n, t) {
	      return n[t.name] = t, n;
	    }, {});
	  }function g(n, t, i, r) {
	    this.name = "ModifyError";this.failures = t;this.failedKeys = r;this.successCount = i;this.message = t.join("\n");
	  }function ot(n) {
	    return n.length === 1 ? n[0] : n;
	  }function ct() {
	    var n = u.dependencies.indexedDB,
	        t = n && (n.getDatabaseNames || n.webkitGetDatabaseNames);return t && t.bind(n);
	  }var r = (function () {
	    function l(n) {
	      u.push([n, c.call(arguments, 1)]);
	    }function p() {
	      var r = u,
	          t,
	          f,
	          i;for (u = [], t = 0, f = r.length; t < f; ++t) i = r[t], i[0].apply(n, i[1]);
	    }function t(n) {
	      if (typeof this != "object") throw new TypeError("Promises must be constructed via new");if (typeof n != "function") throw new TypeError("not a function");this._state = null;this._value = null;this._deferreds = [];this._catched = !1;var r = this,
	          u = !0;this._PSD = t.PSD;try {
	        k(this, n, function (n) {
	          u ? i(a, r, n) : a(r, n);
	        }, function (n) {
	          return u ? (i(h, r, n), !1) : h(r, n);
	        });
	      } finally {
	        u = !1;
	      }
	    }function s(n, f) {
	      var h, s, a, v, b, c;if (n._state === null) {
	        n._deferreds.push(f);return;
	      }if ((h = n._state ? f.onFulfilled : f.onRejected, h === null)) return (n._state ? f.resolve : f.reject)(n._value);a = r;r = !1;i = l;try {
	        v = t.PSD;t.PSD = n._PSD;s = h(n._value);n._state || s && typeof s.then == "function" && s._state === !1 || w(n);f.resolve(s);
	      } catch (y) {
	        if ((b = f.reject(y), !b && n.onuncatched)) try {
	          n.onuncatched(y);
	        } catch (y) {}
	      } finally {
	        if ((t.PSD = v, a)) {
	          do {
	            while (u.length > 0) p();if ((c = e.pop(), c)) try {
	              c();
	            } catch (y) {}
	          } while (e.length > 0 || u.length > 0);i = o;r = !0;
	        }
	      }
	    }function d(n) {
	      var f = r,
	          t;r = !1;i = l;try {
	        n();
	      } finally {
	        if (f) {
	          do {
	            while (u.length > 0) p();if ((t = e.pop(), t)) try {
	              t();
	            } catch (s) {}
	          } while (e.length > 0 || u.length > 0);i = o;r = !0;
	        }
	      }
	    }function w(n) {
	      n._catched = !0;n._parent && w(n._parent);
	    }function a(n, i) {
	      var r = t.PSD;t.PSD = n._PSD;try {
	        if (i === n) throw new TypeError("A promise cannot be resolved with itself.");if (i && (typeof i == "object" || typeof i == "function") && typeof i.then == "function") {
	          k(n, function (n, t) {
	            i.then(n, t);
	          }, function (t) {
	            a(n, t);
	          }, function (t) {
	            h(n, t);
	          });return;
	        }n._state = !0;n._value = i;b.call(n);
	      } catch (u) {
	        h(u);
	      } finally {
	        t.PSD = r;
	      }
	    }function h(n, i) {
	      var r = t.PSD;if ((t.PSD = n._PSD, n._state = !1, n._value = i, b.call(n), !n._catched)) try {
	        if (n.onuncatched) n.onuncatched(n._value);t.on.error.fire(n._value);
	      } catch (u) {}return t.PSD = r, n._catched;
	    }function b() {
	      for (var n = 0, t = this._deferreds.length; n < t; n++) s(this, this._deferreds[n]);this._deferreds = [];
	    }function y(n, t, i, r) {
	      this.onFulfilled = typeof n == "function" ? n : null;this.onRejected = typeof t == "function" ? t : null;this.resolve = i;this.reject = r;
	    }function k(n, t, i, r) {
	      var u = !1;try {
	        t(function (n) {
	          u || (u = !0, i(n));
	        }, function (t) {
	          return u ? n._catched : (u = !0, r(t));
	        });
	      } catch (f) {
	        return u ? void 0 : r(f);
	      }
	    }var c = [].slice,
	        o = typeof setImmediate == "undefined" ? function (t) {
	      var i = arguments;setTimeout(function () {
	        t.apply(n, c.call(i, 1));
	      }, 0);
	    } : setImmediate;it(function () {
	      o = i = l = function (t) {
	        var i = arguments;setTimeout(function () {
	          t.apply(n, c.call(i, 1));
	        }, 0);
	      };
	    });var i = o,
	        r = !0,
	        u = [],
	        e = [];return t.on = v(null, "error"), t.all = function () {
	      var n = Array.prototype.slice.call(arguments.length === 1 && Array.isArray(arguments[0]) ? arguments[0] : arguments);return new t(function (t, i) {
	        function f(r, e) {
	          try {
	            if (e && (typeof e == "object" || typeof e == "function")) {
	              var o = e.then;if (typeof o == "function") {
	                o.call(e, function (n) {
	                  f(r, n);
	                }, i);return;
	              }
	            }n[r] = e;--u == 0 && t(n);
	          } catch (s) {
	            i(s);
	          }
	        }var u, r;if (n.length === 0) return t([]);for (u = n.length, r = 0; r < n.length; r++) f(r, n[r]);
	      });
	    }, t.prototype.then = function (n, r) {
	      var f = this,
	          u = new t(function (t, u) {
	        f._state === null ? s(f, new y(n, r, t, u)) : i(s, f, new y(n, r, t, u));
	      });return u._PSD = this._PSD, u.onuncatched = this.onuncatched, u._parent = this, u;
	    }, t.prototype._then = function (n, t) {
	      s(this, new y(n, t, f, f));
	    }, t.prototype["catch"] = function (n) {
	      if (arguments.length === 1) return this.then(null, n);var i = arguments[0],
	          r = arguments[1];return typeof i == "function" ? this.then(null, function (n) {
	        return n instanceof i ? r(n) : t.reject(n);
	      }) : this.then(null, function (n) {
	        return n && n.name === i ? r(n) : t.reject(n);
	      });
	    }, t.prototype["finally"] = function (n) {
	      return this.then(function (t) {
	        return n(), t;
	      }, function (i) {
	        return n(), t.reject(i);
	      });
	    }, t.prototype.onuncatched = null, t.resolve = function (n) {
	      var i = new t(function () {});return i._state = !0, i._value = n, i;
	    }, t.reject = function (n) {
	      var i = new t(function () {});return i._state = !1, i._value = n, i;
	    }, t.race = function (n) {
	      return new t(function (t, i) {
	        n.map(function (n) {
	          n.then(t, i);
	        });
	      });
	    }, t.PSD = null, t.newPSD = function (n) {
	      var i = t.PSD;t.PSD = i ? Object.create(i) : {};try {
	        return n();
	      } finally {
	        t.PSD = i;
	      }
	    }, t._rootExec = d, t._tickFinalize = function (n) {
	      if (r) throw new Error("Not in a virtual tick");e.push(n);
	    }, t;
	  })(),
	      k = function () {},
	      e = !1,
	      nt;p(g).from(Error);u.delete = function (n) {
	    var t = new u(n),
	        i = t.delete();return i.onblocked = function (n) {
	      t.on("blocked", n);return this;
	    }, i;
	  };u.exists = function (n) {
	    return new u(n).open().then(function (n) {
	      return n.close(), !0;
	    }, function () {
	      return !1;
	    });
	  };u.getDatabaseNames = function (n) {
	    return new r(function (n, t) {
	      var r = ct(),
	          i;r ? (i = r(), i.onsuccess = function (t) {
	        n([].slice.call(t.target.result, 0));
	      }, i.onerror = o(t)) : ft(function (t) {
	        return n(t), !1;
	      });
	    }).then(n);
	  };u.defineClass = function (n) {
	    function t(t) {
	      t ? s(this, t) : e && ut(this, n);
	    }return t;
	  };u.ignoreTransaction = function (n) {
	    return r.newPSD(function () {
	      return r.PSD.trans = null, n();
	    });
	  };u.spawn = function () {
	    return n.console && console.warn("Dexie.spawn() is deprecated. Use Dexie.ignoreTransaction() instead."), u.ignoreTransaction.apply(this, arguments);
	  };u.vip = function (n) {
	    return r.newPSD(function () {
	      return r.PSD.letThrough = !0, n();
	    });
	  };Object.defineProperty(u, "currentTransaction", { get: function () {
	      return r.PSD && r.PSD.trans || null;
	    } });u.Promise = r;u.derive = p;u.extend = s;u.override = w;u.events = v;u.getByKeyPath = c;u.setByKeyPath = h;u.delByKeyPath = dt;u.shallowClone = rt;u.deepClone = l;u.addons = [];u.fakeAutoComplete = k;u.asap = y;u.ModifyError = g;u.MultiModifyError = g;u.IndexSpec = a;u.TableSchema = et;nt = n.idbModules && n.idbModules.shimIndexedDB ? n.idbModules : {};u.dependencies = { indexedDB: nt.shimIndexedDB || n.indexedDB || n.mozIndexedDB || n.webkitIndexedDB || n.msIndexedDB, IDBKeyRange: nt.IDBKeyRange || n.IDBKeyRange || n.webkitIDBKeyRange, IDBTransaction: nt.IDBTransaction || n.IDBTransaction || n.webkitIDBTransaction, Error: n.Error || String, SyntaxError: n.SyntaxError || String, TypeError: n.TypeError || String, DOMError: n.DOMError || String, localStorage: (typeof chrome != "undefined" && chrome !== null ? chrome.storage : void 0) != null ? null : n.localStorage };u.version = 1.2;t("Dexie", u);it(function () {
	    u.fakeAutoComplete = k = it;u.fake = e = !0;
	  });
	}).apply(null,  true ? [self || window, function (n, t) {
	  !(__WEBPACK_AMD_DEFINE_RESULT__ = function () {
	    return t;
	  }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}] : typeof global != "undefined" && typeof module != "undefined" && module.exports ? [global, function (n, t) {
	  module.exports = t;
	}] : [self || window, function (n, t) {
	  (self || window)[n] = t;
	}]);
	//# sourceMappingURL=Dexie.min.js.map
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).setImmediate))

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(3).nextTick;
	var apply = Function.prototype.apply;
	var slice = Array.prototype.slice;
	var immediateIds = {};
	var nextImmediateId = 0;

	// DOM APIs, for completeness

	exports.setTimeout = function() {
	  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
	};
	exports.setInterval = function() {
	  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
	};
	exports.clearTimeout =
	exports.clearInterval = function(timeout) { timeout.close(); };

	function Timeout(id, clearFn) {
	  this._id = id;
	  this._clearFn = clearFn;
	}
	Timeout.prototype.unref = Timeout.prototype.ref = function() {};
	Timeout.prototype.close = function() {
	  this._clearFn.call(window, this._id);
	};

	// Does not start the time, just sets up the members needed.
	exports.enroll = function(item, msecs) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = msecs;
	};

	exports.unenroll = function(item) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = -1;
	};

	exports._unrefActive = exports.active = function(item) {
	  clearTimeout(item._idleTimeoutId);

	  var msecs = item._idleTimeout;
	  if (msecs >= 0) {
	    item._idleTimeoutId = setTimeout(function onTimeout() {
	      if (item._onTimeout)
	        item._onTimeout();
	    }, msecs);
	  }
	};

	// That's not how node.js implements it but the exposed api is the same.
	exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
	  var id = nextImmediateId++;
	  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

	  immediateIds[id] = true;

	  nextTick(function onNextTick() {
	    if (immediateIds[id]) {
	      // fn.call() is faster so we optimize for the common use-case
	      // @see http://jsperf.com/call-apply-segu
	      if (args) {
	        fn.apply(null, args);
	      } else {
	        fn.call(null);
	      }
	      // Prevent ids from leaking
	      exports.clearImmediate(id);
	    }
	  });

	  return id;
	};

	exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
	  delete immediateIds[id];
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).setImmediate, __webpack_require__(2).clearImmediate))

/***/ },
/* 3 */
/***/ function(module, exports) {

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// Hprose for HTML5 v2.0.3
	// Copyright (c) 2008-2015 http://hprose.com
	// Hprose is freely distributable under the MIT license.
	// For all details and documentation:
	// https://github.com/hprose/hprose-html5

	function TimeoutError(e) {
	  Error.call(this), this.message = e, this.name = TimeoutError.name, "function" == typeof Error.captureStackTrace && Error.captureStackTrace(this, TimeoutError);
	}!(function (e) {
	  "use strict";
	  e.hprose = Object.create(null);
	})((function () {
	  return this || (1, eval)("this");
	})()), (function (e) {
	  "use strict";
	  var t = "WeakMap" in e,
	      r = "Map" in e,
	      n = !0;if ((r && (n = "forEach" in new e.Map()), !(t && r && n))) {
	    var i = Object.create(null),
	        a = 0,
	        s = function (e) {
	      var t = Object.create(null),
	          r = e.valueOf;Object.defineProperty(e, "valueOf", { value: function (n, a) {
	          return this === e && a in i && i[a] === n ? (a in t || (t[a] = Object.create(null)), t[a]) : r.apply(this, arguments);
	        }, writable: !0, configurable: !0, enumerable: !1 });
	    };if ((t || (e.WeakMap = function l() {
	      var e = Object.create(null),
	          t = a++;i[t] = e;var r = function (r) {
	        if (r !== Object(r)) throw new Error("value is not a non-null object");var n = r.valueOf(e, t);return n !== r.valueOf() ? n : (s(r), r.valueOf(e, t));
	      },
	          n = Object.create(l.prototype, { get: { value: function (e) {
	            return r(e).value;
	          } }, set: { value: function (e, t) {
	            r(e).value = t;
	          } }, has: { value: function (e) {
	            return "value" in r(e);
	          } }, "delete": { value: function (e) {
	            return delete r(e).value;
	          } }, clear: { value: function () {
	            delete i[t], t = a++, i[t] = e;
	          } } });if (arguments.length > 0 && Array.isArray(arguments[0])) for (var u = arguments[0], o = 0, c = u.length; c > o; o++) n.set(u[o][0], u[o][1]);return n;
	    }), !r)) {
	      var u = function () {
	        var e = Object.create(null),
	            t = a++,
	            r = Object.create(null);i[t] = e;var n = function (n) {
	          if (null === n) return r;var i = n.valueOf(e, t);return i !== n.valueOf() ? i : (s(n), n.valueOf(e, t));
	        };return { get: function (e) {
	            return n(e).value;
	          }, set: function (e, t) {
	            n(e).value = t;
	          }, has: function (e) {
	            return "value" in n(e);
	          }, "delete": function (e) {
	            return delete n(e).value;
	          }, clear: function () {
	            delete i[t], t = a++, i[t] = e;
	          } };
	      },
	          o = function () {
	        var e = Object.create(null);return { get: function () {
	            return e.value;
	          }, set: function (t, r) {
	            e.value = r;
	          }, has: function () {
	            return "value" in e;
	          }, "delete": function () {
	            return delete e.value;
	          }, clear: function () {
	            e = Object.create(null);
	          } };
	      },
	          c = function () {
	        var e = Object.create(null);return { get: function (t) {
	            return e[t];
	          }, set: function (t, r) {
	            e[t] = r;
	          }, has: function (t) {
	            return t in e;
	          }, "delete": function (t) {
	            return delete e[t];
	          }, clear: function () {
	            e = Object.create(null);
	          } };
	      };e.Map = function h() {
	        var e = { number: c(), string: c(), "boolean": c(), object: u(), "function": u(), unknown: u(), undefined: o(), "null": o() },
	            t = 0,
	            r = [],
	            n = Object.create(h.prototype, { size: { get: function () {
	              return t;
	            } }, get: { value: function (t) {
	              return e[typeof t].get(t);
	            } }, set: { value: function (n, i) {
	              this.has(n) || (r.push(n), t++), e[typeof n].set(n, i);
	            } }, has: { value: function (t) {
	              return e[typeof t].has(t);
	            } }, "delete": { value: function (n) {
	              return this.has(n) ? (t--, r.splice(r.indexOf(n), 1), e[typeof n]["delete"](n)) : !1;
	            } }, clear: { value: function () {
	              r.length = 0;for (var n in e) e[n].clear();t = 0;
	            } }, forEach: { value: function (e, t) {
	              for (var n = 0, i = r.length; i > n; n++) e.call(t, this.get(r[n]), r[n], this);
	            } } });if (arguments.length > 0 && Array.isArray(arguments[0])) for (var i = arguments[0], a = 0, s = i.length; s > a; a++) n.set(i[a][0], i[a][1]);return n;
	      };
	    }if (!n) {
	      var f = e.Map;e.Map = function g() {
	        var e = new f(),
	            t = 0,
	            r = [],
	            n = Object.create(g.prototype, { size: { get: function () {
	              return t;
	            } }, get: { value: function (t) {
	              return e.get(t);
	            } }, set: { value: function (n, i) {
	              e.has(n) || (r.push(n), t++), e.set(n, i);
	            } }, has: { value: function (t) {
	              return e.has(t);
	            } }, "delete": { value: function (n) {
	              return e.has(n) ? (t--, r.splice(r.indexOf(n), 1), e["delete"](n)) : !1;
	            } }, clear: { value: function () {
	              if ("clear" in e) e.clear();else for (var n = 0, i = r.length; i > n; n++) e["delete"](r[n]);r.length = 0, t = 0;
	            } }, forEach: { value: function (e, t) {
	              for (var n = 0, i = r.length; i > n; n++) e.call(t, this.get(r[n]), r[n], this);
	            } } });if (arguments.length > 0 && Array.isArray(arguments[0])) for (var i = arguments[0], a = 0, s = i.length; s > a; a++) n.set(i[a][0], i[a][1]);return n;
	      };
	    }
	  }
	})((function () {
	  return this || (1, eval)("this");
	})()), TimeoutError.prototype = Object.create(Error.prototype), TimeoutError.prototype.constructor = TimeoutError, (function (e, t) {
	  "use strict";
	  function r(e) {
	    var r = c(arguments, 1);return function () {
	      e.apply(t, r);
	    };
	  }function n(t) {
	    if (v) e.setTimeout(r(n, t), 0);else {
	      var i = g[t];if (i) {
	        v = !0;try {
	          i();
	        } finally {
	          a(t), v = !1;
	        }
	      }
	    }
	  }function i(e) {
	    return g[h] = r.apply(t, e), h++;
	  }function a(e) {
	    delete g[e];
	  }function s() {
	    if (e.postMessage && !e.importScripts) {
	      var t = !0,
	          r = e.onmessage;return e.onmessage = function () {
	        t = !1;
	      }, e.postMessage("", "*"), e.onmessage = r, t;
	    }
	  }var u = e.navigator && /Trident/.test(e.navigator.userAgent);if (!u && (e.msSetImmediate || e.setImmediate)) return void (e.setImmediate || (e.setImmediate = e.msSetImmediate, e.clearImmediate = e.msClearImmediate));var o = e.document,
	      c = Function.prototype.call.bind(Array.prototype.slice),
	      f = Function.prototype.call.bind(Object.prototype.toString),
	      l = {},
	      h = 1,
	      g = {},
	      v = !1;l.messageChannel = function () {
	    var t = new e.MessageChannel();return t.port1.onmessage = function (e) {
	      n(Number(e.data));
	    }, function () {
	      var e = i(arguments);return t.port2.postMessage(e), e;
	    };
	  }, l.nextTick = function () {
	    return function () {
	      var t = i(arguments);return e.process.nextTick(r(n, t)), t;
	    };
	  }, l.postMessage = function () {
	    var t = "setImmediate$" + Math.random() + "$",
	        r = function (r) {
	      r.source === e && "string" == typeof r.data && 0 === r.data.indexOf(t) && n(Number(r.data.slice(t.length)));
	    };return e.addEventListener ? e.addEventListener("message", r, !1) : e.attachEvent("onmessage", r), function () {
	      var r = i(arguments);return e.postMessage(t + r, "*"), r;
	    };
	  }, l.readyStateChange = function () {
	    var e = o.documentElement;return function () {
	      var t = i(arguments),
	          r = o.createElement("script");return r.onreadystatechange = function () {
	        n(t), r.onreadystatechange = null, e.removeChild(r), r = null;
	      }, e.appendChild(r), t;
	    };
	  }, l.setTimeout = function () {
	    return function () {
	      var t = i(arguments);return e.setTimeout(r(n, t), 0), t;
	    };
	  };var y = Object.getPrototypeOf && Object.getPrototypeOf(e);y = y && y.setTimeout ? y : e, u ? y.setImmediate = l.setTimeout() : "[object process]" === f(e.process) ? y.setImmediate = l.nextTick() : s() ? y.setImmediate = l.postMessage() : e.MessageChannel ? y.setImmediate = l.messageChannel() : o && "onreadystatechange" in o.createElement("script") ? y.setImmediate = l.readyStateChange() : y.setImmediate = l.setTimeout(), y.msSetImmediate = y.setImmediate, y.clearImmediate = a, y.msClearImmediate = a;
	})((function () {
	  return this || (1, eval)("this");
	})()), (function (e, t) {
	  "use strict";
	  function r(e) {
	    Object.defineProperties(this, { _subscribers: { value: [] }, resolve: { value: this.resolve.bind(this) }, reject: { value: this.reject.bind(this) } });var t = this;"function" == typeof e && M(function () {
	      try {
	        t.resolve(e());
	      } catch (r) {
	        t.reject(r);
	      }
	    });
	  }function n(e) {
	    return e instanceof r;
	  }function i(t) {
	    return n(t) || I && t instanceof e.Promise && typeof ("function" === t.then);
	  }function a(e, t) {
	    var n = "function" == typeof t ? t : function () {
	      return t;
	    },
	        i = new r();return F(function () {
	      try {
	        i.resolve(n());
	      } catch (e) {
	        i.reject(e);
	      }
	    }, e), i;
	  }function s(e) {
	    var t = new r();return t.reject(e), t;
	  }function u(e) {
	    var t = new r();return t.resolve(e), t;
	  }function o(e) {
	    try {
	      var t = e();return u(t);
	    } catch (r) {
	      return s(r);
	    }
	  }function c(e) {
	    var t = new r();return e(t.resolve, t.reject), t;
	  }function f(e) {
	    var t = 0;return P(e, function () {
	      ++t;
	    }), t;
	  }function l(e) {
	    return e = i(e) ? e : u(e), e.then(function (e) {
	      var t = e.length,
	          n = f(e),
	          a = new Array(t);if (0 === n) return u(a);var s = new r();return P(e, function (e, t) {
	        var r = i(e) ? e : u(e);r.then(function (e) {
	          a[t] = e, 0 === --n && s.resolve(a);
	        }, s.reject);
	      }), s;
	    });
	  }function h() {
	    return l(arguments);
	  }function g(e) {
	    return e = i(e) ? e : u(e), e.then(function (e) {
	      var t = new r();return P(e, function (e) {
	        var r = i(e) ? e : u(e);r.then(t.resolve, t.reject);
	      }), t;
	    });
	  }function v(e) {
	    return e = i(e) ? e : u(e), e.then(function (e) {
	      var t = e.length,
	          n = f(e);if (0 === n) throw new RangeError("any(): array must not be empty");var a = new Array(t),
	          s = new r();return P(e, function (e, t) {
	        var r = i(e) ? e : u(e);r.then(s.resolve, function (e) {
	          a[t] = e, 0 === --n && s.reject(a);
	        });
	      }), s;
	    });
	  }function y(e) {
	    return e = i(e) ? e : u(e), e.then(function (e) {
	      var t = e.length,
	          n = f(e),
	          a = new Array(t);if (0 === n) return u(a);var s = new r();return P(e, function (e, t) {
	        var r = i(e) ? e : u(e);r.whenComplete(function () {
	          a[t] = r.inspect(), 0 === --n && s.resolve(a);
	        });
	      }), s;
	    });
	  }function p(e) {
	    var r = x(arguments, 1);return l(r).then(function (r) {
	      return e.apply(t, r);
	    });
	  }function d(e, t) {
	    var r = x(arguments, 2);return l(r).then(function (r) {
	      return e.apply(t, r);
	    });
	  }function w(e, t) {
	    return function () {
	      return l(arguments).then(function (r) {
	        return e.apply(t, r);
	      });
	    };
	  }function m(e, t, r) {
	    return l(e).then(function (e) {
	      return e.forEach(t, r);
	    });
	  }function T(e, t, r) {
	    return l(e).then(function (e) {
	      return e.every(t, r);
	    });
	  }function b(e, t, r) {
	    return l(e).then(function (e) {
	      return e.some(t, r);
	    });
	  }function _(e, t, r) {
	    return l(e).then(function (e) {
	      return e.filter(t, r);
	    });
	  }function B(e, t, r) {
	    return l(e).then(function (e) {
	      return e.map(t, r);
	    });
	  }function S(e, t, r) {
	    return arguments.length > 2 ? l(e).then(function (e) {
	      return i(r) || (r = u(r)), r.then(function (r) {
	        return e.reduce(t, r);
	      });
	    }) : l(e).then(function (e) {
	      return e.reduce(t);
	    });
	  }function E(e, t, r) {
	    return arguments.length > 2 ? l(e).then(function (e) {
	      return i(r) || (r = u(r)), r.then(function (r) {
	        return e.reduceRight(t, r);
	      });
	    }) : l(e).then(function (e) {
	      return e.reduceRight(t);
	    });
	  }function O(e, t, r) {
	    M(function () {
	      try {
	        var n = e(r);t.resolve(n);
	      } catch (i) {
	        t.reject(i);
	      }
	    });
	  }function j(e, t, r) {
	    e ? O(e, t, r) : t.reject(r);
	  }function A(e, t, r, n, a) {
	    function s(i) {
	      A(e, t, r, n, i);
	    }function u(e) {
	      j(t, n, e);
	    }if (i(a)) return a === r ? void u(new TypeError("Self resolution")) : void a.then(s, u);if (null !== a && "object" == typeof a || "function" == typeof a) {
	      var o;try {
	        o = a.then;
	      } catch (c) {
	        return void u(c);
	      }if ("function" == typeof o) {
	        var f = !0;try {
	          return void o.call(a, function (e) {
	            f && (f = !1, s(e));
	          }, function (e) {
	            f && (f = !1, u(e));
	          });
	        } catch (c) {
	          f && (f = !1, u(c));
	        }return;
	      }
	    }e ? O(e, n, a) : n.resolve(a);
	  }function C() {
	    var e = new r();Object.defineProperties(this, { future: { value: e }, complete: { value: e.resolve }, completeError: { value: e.reject }, isCompleted: { get: function () {
	          return e._state !== k;
	        } } });
	  }var k = 0,
	      R = 1,
	      U = 2,
	      I = "Promise" in e,
	      M = e.setImmediate,
	      F = e.setTimeout,
	      N = e.clearTimeout,
	      P = Function.prototype.call.bind(Array.prototype.forEach),
	      x = Function.prototype.call.bind(Array.prototype.slice);Object.defineProperties(r, { delayed: { value: a }, error: { value: s }, sync: { value: o }, value: { value: u }, all: { value: l }, race: { value: g }, resolve: { value: u }, reject: { value: s }, promise: { value: c }, isFuture: { value: n }, isPromise: { value: i }, join: { value: h }, any: { value: v }, settle: { value: y }, attempt: { value: p }, run: { value: d }, wrap: { value: w }, forEach: { value: m }, every: { value: T }, some: { value: b }, filter: { value: _ }, map: { value: B }, reduce: { value: S }, reduceRight: { value: E } }), Object.defineProperties(r.prototype, { _value: { writable: !0 }, _reason: { writable: !0 }, _state: { value: k, writable: !0 }, resolve: { value: function (e) {
	        if (this._state === k) {
	          this._state = R, this._value = e;for (var t = this._subscribers; t.length > 0;) {
	            var r = t.shift();A(r.onfulfill, r.onreject, this, r.next, e);
	          }
	        }
	      } }, reject: { value: function (e) {
	        if (this._state === k) {
	          this._state = U, this._reason = e;for (var t = this._subscribers; t.length > 0;) {
	            var r = t.shift();r.onreject ? O(r.onreject, r.next, e) : r.next.reject(e);
	          }
	        }
	      } }, then: { value: function (e, t) {
	        if (("function" != typeof e && (e = null), "function" != typeof t && (t = null), e || t)) {
	          var n = new r();return this._state === R ? e ? A(e, t, this, n, this._value) : n.resolve(this._value) : this._state === U ? t ? O(t, n, this._reason) : n.reject(this._reason) : this._subscribers.push({ onfulfill: e, onreject: t, next: n }), n;
	        }return this;
	      } }, inspect: { value: function () {
	        switch (this._state) {case k:
	            return { state: "pending" };case R:
	            return { state: "fulfilled", value: this._value };case U:
	            return { state: "rejected", reason: this._reason };}
	      } }, catchError: { value: function (e, t) {
	        if ("function" == typeof t) {
	          var r = this;return this["catch"](function (n) {
	            if (t(n)) return r["catch"](e);throw n;
	          });
	        }return this["catch"](e);
	      } }, "catch": { value: function (e) {
	        return this.then(null, e);
	      } }, whenComplete: { value: function (e) {
	        return this.then(function (r) {
	          var n = e();return n === t ? r : (n = i(n) ? n : u(n), n.then(function () {
	            return r;
	          }));
	        }, function (r) {
	          var n = e();if (n === t) throw r;return n = i(n) ? n : u(n), n.then(function () {
	            throw r;
	          });
	        });
	      } }, timeout: { value: function (e, t) {
	        var n = new r(),
	            i = F(function () {
	          n.reject(t || new TimeoutError("timeout"));
	        }, e);return this.whenComplete(function () {
	          N(i);
	        }).then(n.resolve, n.reject), n;
	      } }, delay: { value: function (e) {
	        var t = new r();return this.then(function (r) {
	          F(function () {
	            t.resolve(r);
	          }, e);
	        }, t.reject), t;
	      } }, tap: { value: function (e, t) {
	        return this.then(function (r) {
	          return e.call(t, r), r;
	        });
	      } }, spread: { value: function (e, t) {
	        return this.then(function (r) {
	          return e.apply(t, r);
	        });
	      } }, get: { value: function (e) {
	        return this.then(function (t) {
	          return t[e];
	        });
	      } }, set: { value: function (e, t) {
	        return this.then(function (r) {
	          return r[e] = t, r;
	        });
	      } }, apply: { value: function (e, t) {
	        return t = t || [], this.then(function (r) {
	          return l(t).then(function (t) {
	            return r[e].apply(r, t);
	          });
	        });
	      } }, call: { value: function (e) {
	        var t = x(arguments, 1);return this.then(function (r) {
	          return l(t).then(function (t) {
	            return r[e].apply(r, t);
	          });
	        });
	      } }, bind: { value: function (e) {
	        var t = x(arguments);{
	          if (!Array.isArray(e)) {
	            t.shift();var r = this;return Object.defineProperty(this, e, { value: function () {
	                var n = x(arguments);return r.then(function (r) {
	                  return l(t.concat(n)).then(function (t) {
	                    return r[e].apply(r, t);
	                  });
	                });
	              } }), this;
	          }for (var n = 0, i = e.length; i > n; ++n) t[0] = e[n], this.bind.apply(this, t);
	        }
	      } }, forEach: { value: function (e, t) {
	        return m(this, e, t);
	      } }, every: { value: function (e, t) {
	        return T(this, e, t);
	      } }, some: { value: function (e, t) {
	        return b(this, e, t);
	      } }, filter: { value: function (e, t) {
	        return _(this, e, t);
	      } }, map: { value: function (e, t) {
	        return B(this, e, t);
	      } }, reduce: { value: function (e, t) {
	        return arguments.length > 1 ? S(this, e, t) : S(this, e);
	      } }, reduceRight: { value: function (e, t) {
	        return arguments.length > 1 ? E(this, e, t) : E(this, e);
	      } } }), e.hprose.Future = r, e.hprose.Completer = C, e.hprose.resolved = u, e.hprose.rejected = s, e.hprose.deferred = function () {
	    var e = new r();return Object.create(null, { promise: { value: e }, resolve: { value: e.resolve }, reject: { value: e.reject } });
	  }, I || (e.Promise = function (e) {
	    r.call(this), e(this.resolve, this.reject);
	  }, e.Promise.prototype = Object.create(r.prototype), e.Promise.prototype.constructor = r, Object.defineProperties(e.Promise, { all: { value: l }, race: { value: g }, resolve: { value: u }, reject: { value: s } }));
	})((function () {
	  return this || (1, eval)("this");
	})()), (function (e, t) {
	  "use strict";
	  function r(e, t, r) {
	    return e[t++] = r >>> 24 & 255, e[t++] = r >>> 16 & 255, e[t++] = r >>> 8 & 255, e[t++] = 255 & r, t;
	  }function n(e, t, r) {
	    return e[t++] = 255 & r, e[t++] = r >>> 8 & 255, e[t++] = r >>> 16 & 255, e[t++] = r >>> 24 & 255, t;
	  }function i(e, t, r) {
	    for (var n = r.length, i = 0; n > i; ++i) {
	      var a = r.charCodeAt(i);if (128 > a) e[t++] = a;else if (2048 > a) e[t++] = 192 | a >> 6, e[t++] = 128 | 63 & a;else {
	        if (!(55296 > a || a > 57343)) {
	          if (n > i + 1) {
	            var s = r.charCodeAt(i + 1);if (56320 > a && s >= 56320 && 57343 >= s) {
	              var u = ((1023 & a) << 10 | 1023 & s) + 65536;e[t++] = 240 | u >> 18, e[t++] = 128 | u >> 12 & 63, e[t++] = 128 | u >> 6 & 63, e[t++] = 128 | 63 & u, ++i;continue;
	            }
	          }throw new Error("Malformed string");
	        }e[t++] = 224 | a >> 12, e[t++] = 128 | a >> 6 & 63, e[t++] = 128 | 63 & a;
	      }
	    }return t;
	  }function a(e, t) {
	    for (var r = new Uint16Array(t), n = 0, i = 0, a = e.length; t > n && a > i; n++) {
	      var s = e[i++];switch (s >> 4) {case 0:case 1:case 2:case 3:case 4:case 5:case 6:case 7:
	          r[n] = s;break;case 12:case 13:
	          if (!(a > i)) throw new Error("Unfinished UTF-8 octet sequence");r[n] = (31 & s) << 6 | 63 & e[i++];break;case 14:
	          if (!(a > i + 1)) throw new Error("Unfinished UTF-8 octet sequence");r[n] = (15 & s) << 12 | (63 & e[i++]) << 6 | 63 & e[i++];break;case 15:
	          if (!(a > i + 2)) throw new Error("Unfinished UTF-8 octet sequence");var u = ((7 & s) << 18 | (63 & e[i++]) << 12 | (63 & e[i++]) << 6 | 63 & e[i++]) - 65536;if (!(u >= 0 && 1048575 >= u)) throw new Error("Character outside valid Unicode range: 0x" + u.toString(16));r[n++] = u >> 10 & 1023 | 55296, r[n] = 1023 & u | 56320;break;default:
	          throw new Error("Bad UTF-8 encoding 0x" + s.toString(16));}
	    }return t > n && (r = r.subarray(0, n)), [String.fromCharCode.apply(String, r), i];
	  }function s(e, t) {
	    for (var r = [], n = new Uint16Array(65535), i = 0, a = 0, s = e.length; t > i && s > a; i++) {
	      var u = e[a++];switch (u >> 4) {case 0:case 1:case 2:case 3:case 4:case 5:case 6:case 7:
	          n[i] = u;break;case 12:case 13:
	          if (!(s > a)) throw new Error("Unfinished UTF-8 octet sequence");n[i] = (31 & u) << 6 | 63 & e[a++];break;case 14:
	          if (!(s > a + 1)) throw new Error("Unfinished UTF-8 octet sequence");n[i] = (15 & u) << 12 | (63 & e[a++]) << 6 | 63 & e[a++];break;case 15:
	          if (!(s > a + 2)) throw new Error("Unfinished UTF-8 octet sequence");var o = ((7 & u) << 18 | (63 & e[a++]) << 12 | (63 & e[a++]) << 6 | 63 & e[a++]) - 65536;if (!(o >= 0 && 1048575 >= o)) throw new Error("Character outside valid Unicode range: 0x" + o.toString(16));n[i++] = o >> 10 & 1023 | 55296, n[i] = 1023 & o | 56320;break;default:
	          throw new Error("Bad UTF-8 encoding 0x" + u.toString(16));}if (i >= 65534) {
	        var c = i + 1;r.push(String.fromCharCode.apply(String, n.subarray(0, c))), t -= c, i = -1;
	      }
	    }return i > 0 && r.push(String.fromCharCode.apply(String, n.subarray(0, i))), [r.join(""), a];
	  }function u(e, r) {
	    return (r === t || null === r || 0 > r) && (r = e.length), 0 === r ? ["", 0] : 1e5 > r ? a(e, r) : s(e, r);
	  }function o(e, r) {
	    if ((r === t && (r = e.length), 0 === r)) return h;for (var n = 0, i = 0, a = e.length; r > n && a > i; n++) {
	      var s = e[i++];switch (s >> 4) {case 0:case 1:case 2:case 3:case 4:case 5:case 6:case 7:
	          break;case 12:case 13:
	          if (!(a > i)) throw new Error("Unfinished UTF-8 octet sequence");i++;break;case 14:
	          if (!(a > i + 1)) throw new Error("Unfinished UTF-8 octet sequence");i += 2;break;case 15:
	          if (!(a > i + 2)) throw new Error("Unfinished UTF-8 octet sequence");var u = ((7 & s) << 18 | (63 & e[i++]) << 12 | (63 & e[i++]) << 6 | 63 & e[i++]) - 65536;if (!(u >= 0 && 1048575 >= u)) throw new Error("Character outside valid Unicode range: 0x" + u.toString(16));n++;break;default:
	          throw new Error("Bad UTF-8 encoding 0x" + s.toString(16));}
	    }return [e.subarray(0, i), i];
	  }function c(e) {
	    return --e, e |= e >> 1, e |= e >> 2, e |= e >> 4, e |= e >> 8, e |= e >> 16, e + 1;
	  }function f() {
	    var e = arguments;switch (e.length) {case 1:
	        switch (e[0].constructor) {case Uint8Array:
	            this._bytes = e[0], this._length = e[0].length;break;case f:
	            this._bytes = e[0].toBytes(), this._length = e[0].length;break;case String:
	            this.writeString(e[0]);break;case Number:
	            this._bytes = new Uint8Array(e[0]);break;default:
	            this._bytes = new Uint8Array(e[0]), this._length = this._bytes.length;}break;case 2:
	        this._bytes = new Uint8Array(e[0], e[1]), this._length = e[1];break;case 3:
	        this._bytes = new Uint8Array(e[0], e[1], e[2]), this._length = e[2];}this.mark();
	  }function l(e) {
	    if (0 === e.length) return "";switch (e.constructor) {case String:
	        return e;case f:
	        e = e.bytes;case ArrayBuffer:
	        e = new Uint8Array(e);case Uint8Array:
	        return u(e, e.length)[0];default:
	        return String.fromCharCode.apply(String, e);}
	  }var h = (e.hprose.Future, new Uint8Array(0)),
	      g = 1024,
	      v = Function.prototype.call.bind(Array.prototype.indexOf);Object.defineProperties(f.prototype, { _bytes: { value: null, writable: !0 }, _length: { value: 0, writable: !0 }, _wmark: { value: 0, writable: !0 }, _off: { value: 0, writable: !0 }, _rmark: { value: 0, writable: !0 }, _grow: { value: function (e) {
	        var t = this._bytes,
	            r = this._length + e,
	            n = c(r);if (t) {
	          if ((n *= 2, n > t.length)) {
	            var i = new Uint8Array(n);i.set(t), this._bytes = i;
	          }
	        } else n = Math.max(n, g), this._bytes = new Uint8Array(n);
	      } }, length: { get: function () {
	        return this._length;
	      } }, capacity: { get: function () {
	        return this._bytes ? this._bytes.length : 0;
	      } }, position: { get: function () {
	        return this._off;
	      } }, bytes: { get: function () {
	        return null === this._bytes ? h : this._bytes.subarray(0, this._length);
	      } }, mark: { value: function () {
	        this._wmark = this._length, this._rmark = this._off;
	      } }, reset: { value: function () {
	        this._length = this._wmark, this._off = this._rmark;
	      } }, clear: { value: function () {
	        this._bytes = null, this._length = 0, this._wmark = 0, this._off = 0, this._rmark = 0;
	      } }, writeByte: { value: function (e) {
	        this._grow(1), this._bytes[this._length++] = e;
	      } }, writeInt32BE: { value: function (e) {
	        if (e === (0 | e) && 2147483647 >= e) return this._grow(4), void (this._length = r(this._bytes, this._length, e));throw new TypeError("value is out of bounds");
	      } }, writeUInt32BE: { value: function (e) {
	        if (e === (0 | e) && e >= 0) return this._grow(4), void (this._length = r(this._bytes, this._length, e));throw new TypeError("value is out of bounds");
	      } }, writeInt32LE: { value: function (e) {
	        if (e === (0 | e) && 2147483647 >= e) return this._grow(4), void (this._length = n(this._bytes, this._length, e));throw new TypeError("value is out of bounds");
	      } }, writeUInt32LE: { value: function (e) {
	        if (e === (0 | e) && e >= 0) return this._grow(4), void (this._length = n(this._bytes, this._length, e));throw new TypeError("value is out of bounds");
	      } }, write: { value: function (e) {
	        var t = e.byteLength || e.length;if (0 !== t) {
	          this._grow(t);var r = this._bytes,
	              n = this._length;switch (e.constructor) {case ArrayBuffer:
	              r.set(new Uint8Array(e), n);break;case Uint8Array:
	              r.set(e, n);break;case f:
	              r.set(e.bytes, n);break;default:
	              for (var i = 0; t > i; i++) r[n + i] = e[i];}this._length += t;
	        }
	      } }, writeAsciiString: { value: function (e) {
	        var t = e.length;if (0 !== t) {
	          this._grow(t);for (var r = this._bytes, n = this._length, i = 0; t > i; ++i, ++n) r[n] = e.charCodeAt(i);this._length = n;
	        }
	      } }, writeString: { value: function (e) {
	        var t = e.length;0 !== t && (this._grow(3 * t), this._length = i(this._bytes, this._length, e));
	      } }, readByte: { value: function () {
	        return this._off < this._length ? this._bytes[this._off++] : -1;
	      } }, readInt32BE: { value: function () {
	        var e = this._bytes,
	            t = this._off;if (t + 3 < this._length) {
	          var r = e[t++] << 24 | e[t++] << 16 | e[t++] << 8 | e[t++];return this._off = t, r;
	        }throw new Error("EOF");
	      } }, readUInt32BE: { value: function () {
	        var e = this.readInt32BE();return 0 > e ? (2147483647 & e) + 2147483648 : e;
	      } }, readInt32LE: { value: function () {
	        var e = this._bytes,
	            t = this._off;if (t + 3 < this._length) {
	          var r = e[t++] | e[t++] << 8 | e[t++] << 16 | e[t++] << 24;return this._off = t, r;
	        }throw new Error("EOF");
	      } }, readUInt32LE: { value: function () {
	        var e = this.readInt32LE();return 0 > e ? (2147483647 & e) + 2147483648 : e;
	      } }, read: { value: function (e) {
	        return this._off + e > this._length && (e = this._length - this._off), 0 === e ? h : this._bytes.subarray(this._off, this._off += e);
	      } }, skip: { value: function (e) {
	        return this._off + e > this._length ? (e = this._length - this._off, this._off = this._length) : this._off += e, e;
	      } }, readBytes: { value: function (e) {
	        var t,
	            r = v(this._bytes, e, this._off);return -1 === r ? (t = this._bytes.subarray(this._off, this._length), this._off = this._length) : (t = this._bytes.subarray(this._off, r + 1), this._off = r + 1), t;
	      } }, readUntil: { value: function (e) {
	        var t = v(this._bytes, e, this._off),
	            r = "";return t === this._off ? this._off++ : -1 === t ? (r = u(this._bytes.subarray(this._off, this._length))[0], this._off = this._length) : (r = u(this._bytes.subarray(this._off, t))[0], this._off = t + 1), r;
	      } }, readAsciiString: { value: function (e) {
	        if ((this._off + e > this._length && (e = this._length - this._off), 0 === e)) return "";var t = this._bytes.subarray(this._off, this._off += e);if (1e5 > e) return String.fromCharCode.apply(String, t);for (var r = 65535 & e, n = e >> 16, i = new Array(r ? n + 1 : n), a = 0; n > a; ++a) i[a] = String.fromCharCode.apply(String, t.subarray(a << 16, a + 1 << 16));return r && (i[n] = String.fromCharCode.apply(String, t.subarray(n << 16, e))), i.join("");
	      } }, readStringAsBytes: { value: function (e) {
	        var t = o(this._bytes.subarray(this._off, this._length), e);return this._off += t[1], t[0];
	      } }, readString: { value: function (e) {
	        var t = u(this._bytes.subarray(this._off, this._length), e);return this._off += t[1], t[0];
	      } }, takeBytes: { value: function () {
	        var e = this.bytes;return this.clear(), e;
	      } }, toBytes: { value: function () {
	        return new Uint8Array(this.bytes);
	      } }, toString: { value: function () {
	        return u(this.bytes, this._length)[0];
	      } }, clone: { value: function () {
	        return new f(this.toBytes());
	      } }, trunc: { value: function () {
	        this._bytes = this._bytes.subarray(this._off, this._length), this._length = this._bytes.length, this._off = 0, this._wmark = 0, this._rmark = 0;
	      } } }), Object.defineProperty(f, "toString", { value: l }), e.hprose.BytesIO = f;
	})((function () {
	  return this || (1, eval)("this");
	})()), (function (e) {
	  "use strict";
	  e.hprose.Tags = { TagInteger: 105, TagLong: 108, TagDouble: 100, TagNull: 110, TagEmpty: 101, TagTrue: 116, TagFalse: 102, TagNaN: 78, TagInfinity: 73, TagDate: 68, TagTime: 84, TagUTC: 90, TagBytes: 98, TagUTF8Char: 117, TagString: 115, TagGuid: 103, TagList: 97, TagMap: 109, TagClass: 99, TagObject: 111, TagRef: 114, TagPos: 43, TagNeg: 45, TagSemicolon: 59, TagOpenbrace: 123, TagClosebrace: 125, TagQuote: 34, TagPoint: 46, TagFunctions: 70, TagCall: 67, TagResult: 82, TagArgument: 65, TagError: 69, TagEnd: 122 };
	})((function () {
	  return this || (1, eval)("this");
	})()), (function (e) {
	  "use strict";
	  function t(e, t) {
	    s.set(e, t), a[t] = e;
	  }function r(e) {
	    return s.get(e);
	  }function n(e) {
	    return a[e];
	  }var i = e.WeakMap,
	      a = Object.create(null),
	      s = new i();e.hprose.ClassManager = Object.create(null, { register: { value: t }, getClassAlias: { value: r }, getClass: { value: n } }), e.hprose.register = t, t(Object, "Object");
	})((function () {
	  return this || (1, eval)("this");
	})()), (function (e, t) {
	  "use strict";
	  function r(e) {
	    var t = e.constructor,
	        r = O.getClassAlias(t);if (r) return r;if (t.name) r = t.name;else {
	      var n = t.toString();if ((r = n.substr(0, n.indexOf("(")).replace(/(^\s*function\s*)|(\s*$)/gi, ""), "" === r || "Object" === r)) return "function" == typeof e.getClassName ? e.getClassName() : "Object";
	    }return "Object" !== r && O.register(t, r), r;
	  }function n(e) {
	    Object.defineProperties(this, { _stream: { value: e }, _ref: { value: new B(), writable: !0 } });
	  }function i(e) {
	    return new n(e);
	  }function a(e, t) {
	    Object.defineProperties(this, { stream: { value: e }, _classref: { value: Object.create(null), writable: !0 }, _fieldsref: { value: [], writable: !0 }, _refer: { value: t ? j : i(e) } });
	  }function s(e, n) {
	    var i = e.stream;if (n === t || null === n) return void i.writeByte(E.TagNull);switch (n.constructor) {case Function:
	        return void i.writeByte(E.TagNull);case Number:
	        return void u(e, n);case Boolean:
	        return void f(e, n);case String:
	        switch (n.length) {case 0:
	            return void i.writeByte(E.TagEmpty);case 1:
	            return i.writeByte(E.TagUTF8Char), void i.writeString(n);}return void e.writeStringWithRef(n);case Date:
	        return void e.writeDateWithRef(n);case B:
	        return void e.writeMapWithRef(n);case ArrayBuffer:case Uint8Array:case S:
	        return void e.writeBytesWithRef(n);case Int8Array:case Int16Array:case Int32Array:case Uint16Array:case Uint32Array:
	        return void d(e, n);case Float32Array:case Float64Array:
	        return void w(e, n);default:
	        if (Array.isArray(n)) e.writeListWithRef(n);else {
	          var a = r(n);"Object" === a ? e.writeMapWithRef(n) : e.writeObjectWithRef(n);
	        }}
	  }function u(e, t) {
	    var r = e.stream;t = t.valueOf(), t === (0 | t) ? t >= 0 && 9 >= t ? r.writeByte(t + 48) : (r.writeByte(E.TagInteger), r.writeAsciiString("" + t), r.writeByte(E.TagSemicolon)) : isNaN(t) ? r.writeByte(E.TagNaN) : isFinite(t) ? (r.writeByte(E.TagDouble), r.writeAsciiString("" + t), r.writeByte(E.TagSemicolon)) : (r.writeByte(E.TagInfinity), r.writeByte(t > 0 ? E.TagPos : E.TagNeg));
	  }function o(e, t) {
	    var r = e.stream;t >= 0 && 9 >= t ? r.writeByte(t + 48) : (-2147483648 > t || t > 2147483647 ? r.writeByte(E.TagLong) : r.writeByte(E.TagInteger), r.writeAsciiString("" + t), r.writeByte(E.TagSemicolon));
	  }function c(e, t) {
	    var r = e.stream;isNaN(t) ? r.writeByte(E.TagNaN) : isFinite(t) ? (r.writeByte(E.TagDouble), r.writeAsciiString("" + t), r.writeByte(E.TagSemicolon)) : (r.writeByte(E.TagInfinity), r.writeByte(t > 0 ? E.TagPos : E.TagNeg));
	  }function f(e, t) {
	    e.stream.writeByte(t.valueOf() ? E.TagTrue : E.TagFalse);
	  }function l(e, t) {
	    e._refer.set(t);var r = e.stream,
	        n = ("0000" + t.getUTCFullYear()).slice(-4),
	        i = ("00" + (t.getUTCMonth() + 1)).slice(-2),
	        a = ("00" + t.getUTCDate()).slice(-2),
	        s = ("00" + t.getUTCHours()).slice(-2),
	        u = ("00" + t.getUTCMinutes()).slice(-2),
	        o = ("00" + t.getUTCSeconds()).slice(-2),
	        c = ("000" + t.getUTCMilliseconds()).slice(-3);r.writeByte(E.TagDate), r.writeAsciiString(n + i + a), r.writeByte(E.TagTime), r.writeAsciiString(s + u + o), "000" !== c && (r.writeByte(E.TagPoint), r.writeAsciiString(c)), r.writeByte(E.TagUTC);
	  }function h(e, t) {
	    e._refer.set(t);var r = e.stream,
	        n = ("0000" + t.getFullYear()).slice(-4),
	        i = ("00" + (t.getMonth() + 1)).slice(-2),
	        a = ("00" + t.getDate()).slice(-2),
	        s = ("00" + t.getHours()).slice(-2),
	        u = ("00" + t.getMinutes()).slice(-2),
	        o = ("00" + t.getSeconds()).slice(-2),
	        c = ("000" + t.getMilliseconds()).slice(-3);"00" === s && "00" === u && "00" === o && "000" === c ? (r.writeByte(E.TagDate), r.writeAsciiString(n + i + a)) : "1970" === n && "01" === i && "01" === a ? (r.writeByte(E.TagTime), r.writeAsciiString(s + u + o), "000" !== c && (r.writeByte(E.TagPoint), r.writeAsciiString(c))) : (r.writeByte(E.TagDate), r.writeAsciiString(n + i + a), r.writeByte(E.TagTime), r.writeAsciiString(s + u + o), "000" !== c && (r.writeByte(E.TagPoint), r.writeAsciiString(c))), r.writeByte(E.TagSemicolon);
	  }function g(e, t) {
	    e._refer.set(t);var r = e.stream,
	        n = ("00" + t.getHours()).slice(-2),
	        i = ("00" + t.getMinutes()).slice(-2),
	        a = ("00" + t.getSeconds()).slice(-2),
	        s = ("000" + t.getMilliseconds()).slice(-3);r.writeByte(E.TagTime), r.writeAsciiString(n + i + a), "000" !== s && (r.writeByte(E.TagPoint), r.writeAsciiString(s)), r.writeByte(E.TagSemicolon);
	  }function v(e, t) {
	    e._refer.set(t);var r = e.stream;r.writeByte(E.TagBytes);var n = t.byteLength || t.length;n > 0 && r.writeAsciiString("" + n), r.writeByte(E.TagQuote), n > 0 && r.write(t), r.writeByte(E.TagQuote);
	  }function y(e, t) {
	    e._refer.set(t);var r = e.stream,
	        n = t.length;r.writeByte(E.TagString), n > 0 && r.writeAsciiString("" + n), r.writeByte(E.TagQuote), n > 0 && r.writeString(t), r.writeByte(E.TagQuote);
	  }function p(e, t, r) {
	    e._refer.set(t);var n = e.stream,
	        i = t.length;n.writeByte(E.TagList), i > 0 && n.writeAsciiString("" + i), n.writeByte(E.TagOpenbrace);for (var a = 0; i > a; a++) r(e, t[a]);n.writeByte(E.TagClosebrace);
	  }function d(e, t) {
	    e._refer.write(t) || p(e, t, o);
	  }function w(e, t) {
	    e._refer.write(t) || p(e, t, c);
	  }function m(e, t) {
	    e._refer.set(t);var r = e.stream,
	        n = [];for (var i in t) t.hasOwnProperty(i) && "function" != typeof t[i] && (n[n.length] = i);var a = n.length;r.writeByte(E.TagMap), a > 0 && r.writeAsciiString("" + a), r.writeByte(E.TagOpenbrace);for (var u = 0; a > u; u++) s(e, n[u]), s(e, t[n[u]]);r.writeByte(E.TagClosebrace);
	  }function T(e, t) {
	    e._refer.set(t);var r = e.stream,
	        n = t.size;r.writeByte(E.TagMap), n > 0 && r.writeAsciiString("" + n), r.writeByte(E.TagOpenbrace), t.forEach(function (t, r) {
	      s(e, r), s(e, t);
	    }), r.writeByte(E.TagClosebrace);
	  }function b(e, t) {
	    var n,
	        i,
	        a = e.stream,
	        u = r(t);if (u in e._classref) i = e._classref[u], n = e._fieldsref[i];else {
	      n = [];for (var o in t) t.hasOwnProperty(o) && "function" != typeof t[o] && (n[n.length] = o.toString());i = _(e, u, n);
	    }a.writeByte(E.TagObject), a.writeAsciiString("" + i), a.writeByte(E.TagOpenbrace), e._refer.set(t);for (var c = n.length, f = 0; c > f; f++) s(e, t[n[f]]);a.writeByte(E.TagClosebrace);
	  }function _(e, t, r) {
	    var n = e.stream,
	        i = r.length;n.writeByte(E.TagClass), n.writeAsciiString("" + t.length), n.writeByte(E.TagQuote), n.writeString(t), n.writeByte(E.TagQuote), i > 0 && n.writeAsciiString("" + i), n.writeByte(E.TagOpenbrace);for (var a = 0; i > a; a++) y(e, r[a]);n.writeByte(E.TagClosebrace);var s = e._fieldsref.length;return e._classref[t] = s, e._fieldsref[s] = r, s;
	  }var B = e.Map,
	      S = e.hprose.BytesIO,
	      E = e.hprose.Tags,
	      O = e.hprose.ClassManager,
	      j = Object.create(null, { set: { value: function () {} }, write: { value: function () {
	        return !1;
	      } }, reset: { value: function () {} } });Object.defineProperties(n.prototype, { _refcount: { value: 0, writable: !0 }, set: { value: function (e) {
	        this._ref.set(e, this._refcount++);
	      } }, write: { value: function (e) {
	        var r = this._ref.get(e);return r !== t ? (this._stream.writeByte(E.TagRef), this._stream.writeString("" + r), this._stream.writeByte(E.TagSemicolon), !0) : !1;
	      } }, reset: { value: function () {
	        this._ref = new B(), this._refcount = 0;
	      } } }), Object.defineProperties(a.prototype, { serialize: { value: function (e) {
	        s(this, e);
	      } }, writeInteger: { value: function (e) {
	        o(this, e);
	      } }, writeDouble: { value: function (e) {
	        c(this, e);
	      } }, writeBoolean: { value: function (e) {
	        f(this, e);
	      } }, writeUTCDate: { value: function (e) {
	        l(this, e);
	      } }, writeUTCDateWithRef: { value: function (e) {
	        this._refer.write(e) || l(this, e);
	      } }, writeDate: { value: function (e) {
	        h(this, e);
	      } }, writeDateWithRef: { value: function (e) {
	        this._refer.write(e) || h(this, e);
	      } }, writeTime: { value: function (e) {
	        g(this, e);
	      } }, writeTimeWithRef: { value: function (e) {
	        this._refer.write(e) || g(this, e);
	      } }, writeBytes: { value: function (e) {
	        v(this, e);
	      } }, writeBytesWithRef: { value: function (e) {
	        this._refer.write(e) || v(this, e);
	      } }, writeString: { value: function (e) {
	        y(this, e);
	      } }, writeStringWithRef: { value: function (e) {
	        this._refer.write(e) || y(this, e);
	      } }, writeList: { value: function (e) {
	        p(this, e, s);
	      } }, writeListWithRef: { value: function (e) {
	        this._refer.write(e) || p(this, e, s);
	      } }, writeMap: { value: function (e) {
	        e instanceof B ? T(this, e) : m(this, e);
	      } }, writeMapWithRef: { value: function (e) {
	        this._refer.write(e) || (e instanceof B ? T(this, e) : m(this, e));
	      } }, writeObject: { value: function (e) {
	        b(this, e);
	      } }, writeObjectWithRef: { value: function (e) {
	        this._refer.write(e) || b(this, e);
	      } }, reset: { value: function () {
	        this._classref = Object.create(null), this._fieldsref.length = 0, this._refer.reset();
	      } } }), e.hprose.Writer = a;
	})((function () {
	  return this || (1, eval)("this");
	})()), (function (e, t) {
	  "use strict";
	  function r(e, t) {
	    if (e && t) {
	      var r = "";throw (r = "number" == typeof t ? String.fromCharCode(t) : String.fromCharCode.apply(String, t), new Error('Tag "' + r + '" expected, but "' + String.fromCharCode(e) + '" found in stream'));
	    }throw e ? new Error('Unexpected serialize tag "' + String.fromCharCode(e) + '" in stream') : new Error("No byte found in stream");
	  }function n(e) {
	    var t = new Z();return i(e, t), t.bytes;
	  }function i(e, t) {
	    a(e, t, e.readByte());
	  }function a(e, t, n) {
	    switch ((t.writeByte(n), n)) {case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:case ee.TagNull:case ee.TagEmpty:case ee.TagTrue:case ee.TagFalse:case ee.TagNaN:
	        break;case ee.TagInfinity:
	        t.writeByte(e.readByte());break;case ee.TagInteger:case ee.TagLong:case ee.TagDouble:case ee.TagRef:
	        s(e, t);break;case ee.TagDate:case ee.TagTime:
	        u(e, t);break;case ee.TagUTF8Char:
	        o(e, t);break;case ee.TagBytes:
	        c(e, t);break;case ee.TagString:
	        f(e, t);break;case ee.TagGuid:
	        l(e, t);break;case ee.TagList:case ee.TagMap:case ee.TagObject:
	        h(e, t);break;case ee.TagClass:
	        h(e, t), i(e, t);break;case ee.TagError:
	        i(e, t);break;default:
	        r(n);}
	  }function s(e, t) {
	    var r;do r = e.readByte(), t.writeByte(r); while (r !== ee.TagSemicolon);
	  }function u(e, t) {
	    var r;do r = e.readByte(), t.writeByte(r); while (r !== ee.TagSemicolon && r !== ee.TagUTC);
	  }function o(e, t) {
	    t.writeString(e.readString(1));
	  }function c(e, t) {
	    var r = 0,
	        n = 48;do r *= 10, r += n - 48, n = e.readByte(), t.writeByte(n); while (n !== ee.TagQuote);t.write(e.read(r + 1));
	  }function f(e, t) {
	    var r = 0,
	        n = 48;do r *= 10, r += n - 48, n = e.readByte(), t.writeByte(n); while (n !== ee.TagQuote);t.write(e.readStringAsBytes(r + 1));
	  }function l(e, t) {
	    t.write(e.read(38));
	  }function h(e, t) {
	    var r;do r = e.readByte(), t.writeByte(r); while (r !== ee.TagOpenbrace);for (; (r = e.readByte()) !== ee.TagClosebrace;) a(e, t, r);t.writeByte(r);
	  }function g(e) {
	    Object.defineProperties(this, { stream: { value: e }, readRaw: { value: function () {
	          return n(e);
	        } } });
	  }function v() {
	    Object.defineProperties(this, { ref: { value: [] } });
	  }function y() {
	    return new v();
	  }function p(r) {
	    var n,
	        i = e,
	        a = r.split(".");for (n = 0; n < a.length; n++) if ((i = i[a[n]], i === t)) return null;return i;
	  }function d(e, t, r, n) {
	    if (r < t.length) {
	      var i = t[r];e[i] = n;var a = d(e, t, r + 1, ".");return r + 1 < t.length && null === a && (a = d(e, t, r + 1, "_")), a;
	    }var s = e.join("");try {
	      var u = p(s);return "function" == typeof u ? u : null;
	    } catch (o) {
	      return null;
	    }
	  }function w(e) {
	    var t = te.getClass(e);if (t) return t;if ((t = p(e), "function" == typeof t)) return te.register(t, e), t;for (var r = [], n = e.indexOf("_"); n >= 0;) r[r.length] = n, n = e.indexOf("_", n + 1);if (r.length > 0) {
	      var i = e.split("");if ((t = d(i, r, 0, "."), null === t && (t = d(i, r, 0, "_")), "function" == typeof t)) return te.register(t, e), t;
	    }return t = function () {}, Object.defineProperty(t.prototype, "getClassName", { value: function () {
	        return e;
	      } }), te.register(t, e), t;
	  }function m(e, t) {
	    var r = e.readUntil(t);return 0 === r.length ? 0 : parseInt(r, 10);
	  }function T(e) {
	    var t = e.stream,
	        n = t.readByte();switch (n) {case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:
	        return n - 48;case ee.TagInteger:
	        return b(t);case ee.TagLong:
	        return B(t);case ee.TagDouble:
	        return E(t);case ee.TagNull:
	        return null;case ee.TagEmpty:
	        return "";case ee.TagTrue:
	        return !0;case ee.TagFalse:
	        return !1;case ee.TagNaN:
	        return NaN;case ee.TagInfinity:
	        return j(t);case ee.TagDate:
	        return C(e);case ee.TagTime:
	        return R(e);case ee.TagBytes:
	        return I(e);case ee.TagUTF8Char:
	        return F(e);case ee.TagString:
	        return P(e);case ee.TagGuid:
	        return W(e);case ee.TagList:
	        return D(e);case ee.TagMap:
	        return e.useHarmonyMap ? Q(e) : z(e);case ee.TagClass:
	        return $(e), Y(e);case ee.TagObject:
	        return J(e);case ee.TagRef:
	        return V(e);case ee.TagError:
	        throw new Error(x(e));default:
	        r(n);}
	  }function b(e) {
	    return m(e, ee.TagSemicolon);
	  }function _(e) {
	    var t = e.readByte();switch (t) {case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:
	        return t - 48;case ee.TagInteger:
	        return b(e);default:
	        r(t);}
	  }function B(e) {
	    var t = e.readUntil(ee.TagSemicolon),
	        r = parseInt(t, 10);return r.toString() === t ? r : t;
	  }function S(e) {
	    var t = e.readByte();switch (t) {case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:
	        return t - 48;case ee.TagInteger:case ee.TagLong:
	        return B(e);default:
	        r(t);}
	  }function E(e) {
	    return parseFloat(e.readUntil(ee.TagSemicolon));
	  }function O(e) {
	    var t = e.readByte();switch (t) {case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:
	        return t - 48;case ee.TagInteger:case ee.TagLong:case ee.TagDouble:
	        return E(e);case ee.TagNaN:
	        return NaN;case ee.TagInfinity:
	        return j(e);default:
	        r(t);}
	  }function j(e) {
	    return e.readByte() === ee.TagNeg ? -(1 / 0) : 1 / 0;
	  }function A(e) {
	    var t = e.readByte();switch (t) {case ee.TagTrue:
	        return !0;case ee.TagFalse:
	        return !1;default:
	        r(t);}
	  }function C(e) {
	    var t,
	        r = e.stream,
	        n = parseInt(r.readAsciiString(4), 10),
	        i = parseInt(r.readAsciiString(2), 10) - 1,
	        a = parseInt(r.readAsciiString(2), 10),
	        s = r.readByte();if (s === ee.TagTime) {
	      var u = parseInt(r.readAsciiString(2), 10),
	          o = parseInt(r.readAsciiString(2), 10),
	          c = parseInt(r.readAsciiString(2), 10),
	          f = 0;s = r.readByte(), s === ee.TagPoint && (f = parseInt(r.readAsciiString(3), 10), s = r.readByte(), s >= 48 && 57 >= s && (r.skip(2), s = r.readByte(), s >= 48 && 57 >= s && (r.skip(2), s = r.readByte()))), t = s === ee.TagUTC ? new Date(Date.UTC(n, i, a, u, o, c, f)) : new Date(n, i, a, u, o, c, f);
	    } else t = s === ee.TagUTC ? new Date(Date.UTC(n, i, a)) : new Date(n, i, a);return e.refer.set(t), t;
	  }function k(e) {
	    var t = e.stream.readByte();switch (t) {case ee.TagNull:
	        return null;case ee.TagDate:
	        return C(e);case ee.TagRef:
	        return V(e);default:
	        r(t);}
	  }function R(e) {
	    var t,
	        r = e.stream,
	        n = parseInt(r.readAsciiString(2), 10),
	        i = parseInt(r.readAsciiString(2), 10),
	        a = parseInt(r.readAsciiString(2), 10),
	        s = 0,
	        u = r.readByte();return u === ee.TagPoint && (s = parseInt(r.readAsciiString(3), 10), u = r.readByte(), u >= 48 && 57 >= u && (r.skip(2), u = r.readByte(), u >= 48 && 57 >= u && (r.skip(2), u = r.readByte()))), t = u === ee.TagUTC ? new Date(Date.UTC(1970, 0, 1, n, i, a, s)) : new Date(1970, 0, 1, n, i, a, s), e.refer.set(t), t;
	  }function U(e) {
	    var t = e.stream.readByte();switch (t) {case ee.TagNull:
	        return null;case ee.TagTime:
	        return R(e);case ee.TagRef:
	        return V(e);default:
	        r(t);}
	  }function I(e) {
	    var t = e.stream,
	        r = m(t, ee.TagQuote),
	        n = t.read(r);return t.skip(1), e.refer.set(n), n;
	  }function M(e) {
	    var t = e.stream.readByte();switch (t) {case ee.TagNull:
	        return null;case ee.TagEmpty:
	        return new Uint8Array(0);case ee.TagBytes:
	        return I(e);case ee.TagRef:
	        return V(e);default:
	        r(t);}
	  }function F(e) {
	    return e.stream.readString(1);
	  }function N(e) {
	    var t = e.stream,
	        r = t.readString(m(t, ee.TagQuote));return t.skip(1), r;
	  }function P(e) {
	    var t = N(e);return e.refer.set(t), t;
	  }function x(e) {
	    var t = e.stream.readByte();switch (t) {case ee.TagNull:
	        return null;case ee.TagEmpty:
	        return "";case ee.TagUTF8Char:
	        return F(e);case ee.TagString:
	        return P(e);case ee.TagRef:
	        return V(e);default:
	        r(t);}
	  }function W(e) {
	    var t = e.stream;t.skip(1);var r = t.readAsciiString(36);return t.skip(1), e.refer.set(r), r;
	  }function L(e) {
	    var t = e.stream.readByte();switch (t) {case ee.TagNull:
	        return null;case ee.TagGuid:
	        return W(e);case ee.TagRef:
	        return V(e);default:
	        r(t);}
	  }function D(e) {
	    var t = e.stream,
	        r = [];e.refer.set(r);for (var n = m(t, ee.TagOpenbrace), i = 0; n > i; i++) r[i] = T(e);return t.skip(1), r;
	  }function H(e) {
	    var t = e.stream.readByte();switch (t) {case ee.TagNull:
	        return null;case ee.TagList:
	        return D(e);case ee.TagRef:
	        return V(e);default:
	        r(t);}
	  }function z(e) {
	    var t = e.stream,
	        r = {};e.refer.set(r);for (var n = m(t, ee.TagOpenbrace), i = 0; n > i; i++) {
	      var a = T(e),
	          s = T(e);r[a] = s;
	    }return t.skip(1), r;
	  }function q(e) {
	    var t = e.stream.readByte();switch (t) {case ee.TagNull:
	        return null;case ee.TagMap:
	        return z(e);case ee.TagRef:
	        return V(e);default:
	        r(t);}
	  }function Q(e) {
	    var t = e.stream,
	        r = new K();e.refer.set(r);for (var n = m(t, ee.TagOpenbrace), i = 0; n > i; i++) {
	      var a = T(e),
	          s = T(e);r.set(a, s);
	    }return t.skip(1), r;
	  }function G(e) {
	    var t = e.stream.readByte();switch (t) {case ee.TagNull:
	        return null;case ee.TagMap:
	        return Q(e);case ee.TagRef:
	        return V(e);default:
	        r(t);}
	  }function J(e) {
	    var t = e.stream,
	        r = e.classref[m(t, ee.TagOpenbrace)],
	        n = new r.classname();e.refer.set(n);for (var i = 0; i < r.count; i++) n[r.fields[i]] = T(e);return t.skip(1), n;
	  }function Y(e) {
	    var t = e.stream.readByte();switch (t) {case ee.TagNull:
	        return null;case ee.TagClass:
	        return $(e), Y(e);case ee.TagObject:
	        return J(e);case ee.TagRef:
	        return V(e);default:
	        r(t);}
	  }function $(e) {
	    for (var t = e.stream, r = N(e), n = m(t, ee.TagOpenbrace), i = [], a = 0; n > a; a++) i[a] = x(e);t.skip(1), r = w(r), e.classref.push({ classname: r, count: n, fields: i });
	  }function V(e) {
	    return e.refer.read(m(e.stream, ee.TagSemicolon));
	  }function X(e, t, r) {
	    g.call(this, e), this.useHarmonyMap = !!r, Object.defineProperties(this, { classref: { value: [] }, refer: { value: t ? re : y() } });
	  }var K = e.Map,
	      Z = e.hprose.BytesIO,
	      ee = e.hprose.Tags,
	      te = e.hprose.ClassManager;e.hprose.RawReader = g;var re = Object.create(null, { set: { value: function () {} }, read: { value: function () {
	        r(ee.TagRef);
	      } }, reset: { value: function () {} } });Object.defineProperties(v.prototype, { set: { value: function (e) {
	        this.ref.push(e);
	      } }, read: { value: function (e) {
	        return this.ref[e];
	      } }, reset: { value: function () {
	        this.ref.length = 0;
	      } } }), X.prototype = Object.create(g.prototype), X.prototype.constructor = X, Object.defineProperties(X.prototype, { useHarmonyMap: { value: !1, writable: !0 }, checkTag: { value: function (e, n) {
	        n === t && (n = this.stream.readByte()), n !== e && r(n, e);
	      } }, checkTags: { value: function (e, n) {
	        return n === t && (n = this.stream.readByte()), e.indexOf(n) >= 0 ? n : void r(n, e);
	      } }, unserialize: { value: function () {
	        return T(this);
	      } }, readInteger: { value: function () {
	        return _(this.stream);
	      } }, readLong: { value: function () {
	        return S(this.stream);
	      } }, readDouble: { value: function () {
	        return O(this.stream);
	      } }, readBoolean: { value: function () {
	        return A(this.stream);
	      } }, readDateWithoutTag: { value: function () {
	        return C(this);
	      } }, readDate: { value: function () {
	        return k(this);
	      } }, readTimeWithoutTag: { value: function () {
	        return R(this);
	      } }, readTime: { value: function () {
	        return U(this);
	      } }, readBytesWithoutTag: { value: function () {
	        return I(this);
	      } }, readBytes: { value: function () {
	        return M(this);
	      } }, readStringWithoutTag: { value: function () {
	        return P(this);
	      } }, readString: { value: function () {
	        return x(this);
	      } }, readGuidWithoutTag: { value: function () {
	        return W(this);
	      } }, readGuid: { value: function () {
	        return L(this);
	      } }, readListWithoutTag: { value: function () {
	        return D(this);
	      } }, readList: { value: function () {
	        return H(this);
	      } }, readMapWithoutTag: { value: function () {
	        return this.useHarmonyMap ? Q(this) : z(this);
	      } }, readMap: { value: function () {
	        return this.useHarmonyMap ? G(this) : q(this);
	      } }, readObjectWithoutTag: { value: function () {
	        return J(this);
	      } }, readObject: { value: function () {
	        return Y(this);
	      } }, reset: { value: function () {
	        this.classref.length = 0, this.refer.reset();
	      } } }), e.hprose.Reader = X;
	})((function () {
	  return this || (1, eval)("this");
	})()), (function (e) {
	  "use strict";
	  function t(e, t) {
	    var r = new n(),
	        a = new i(r, t);return a.serialize(e), r;
	  }function r(e, t, r) {
	    return e instanceof n || (e = new n(e)), new a(e, t, r).unserialize();
	  }var n = e.hprose.BytesIO,
	      i = e.hprose.Writer,
	      a = e.hprose.Reader;e.hprose.Formatter = { serialize: function (e, r) {
	      return t(e, r).bytes;
	    }, unserialize: r }, e.hprose.serialize = t, e.hprose.unserialize = r;
	})((function () {
	  return this || (1, eval)("this");
	})()), (function (e) {
	  "use strict";
	  e.hprose.ResultMode = { Normal: 0, Serialized: 1, Raw: 2, RawWithEndTag: 3 }, e.hprose.Normal = e.hprose.ResultMode.Normal, e.hprose.Serialized = e.hprose.ResultMode.Serialized, e.hprose.Raw = e.hprose.ResultMode.Raw, e.hprose.RawWithEndTag = e.hprose.ResultMode.RawWithEndTag;
	})((function () {
	  return this || (1, eval)("this");
	})()), (function (e, t) {
	  "use strict";
	  function r() {}function n(n, i, a) {
	    function T(e, t) {
	      for (var r = 0, n = He.length; n > r; r++) e = He[r].outputFilter(e, t);return e;
	    }function b(e, t) {
	      for (var r = He.length - 1; r >= 0; r--) e = He[r].inputFilter(e, t);return e;
	    }function _(e, t) {
	      return e = T(e, t), Ke(e, t).then(function (e) {
	        return t.oneway ? void 0 : b(e, t);
	      });
	    }function B(e, t) {
	      return nt.sendAndReceive(e, t);
	    }function S(e, t, r, n) {
	      Xe(e, t).then(r, function (i) {
	        E(e, t, r, n) || n(i);
	      });
	    }function E(t, r, n, i) {
	      if ((r.failswitch && ++Re >= ke.length && (Re = 0, Ce = ke[Re]), r.idempotent && --r.retry >= 0)) {
	        var a = 500 * (10 - r.retry);return r.retry > 10 && (a = 500), e.setTimeout(function () {
	          S(t, r, n, i);
	        }, a), !0;
	      }return !1;
	    }function O(e) {
	      var t = { retry: Fe, idempotent: !0, failswitch: !0, timeout: Me, client: nt, userdata: {} },
	          r = function (t) {
	        var r = null;try {
	          var n = new c(t),
	              i = new l(n, !0),
	              a = n.readByte();switch (a) {case u.TagError:
	              r = new Error(i.readString());break;case u.TagFunctions:
	              var s = i.readList();i.checkTag(u.TagEnd), C(e, s);break;default:
	              r = new Error("Wrong Response:\r\n" + c.toString(t));}
	        } catch (o) {
	          r = o;
	        }null !== r ? Qe.reject(r) : Qe.resolve(e);
	      };S(v, t, r, Qe.reject);
	    }function j(e, t) {
	      return function () {
	        return ze ? F(e, t, g(arguments), !0) : h.all(arguments).then(function (r) {
	          return F(e, t, r, !1);
	        });
	      };
	    }function A(e, r, n, i, a) {
	      if (r[i] === t && (r[i] = {}, (typeof a === p || a.constructor === Object) && (a = [a]), Array.isArray(a))) for (var s = 0; s < a.length; s++) {
	        var u = a[s];if (typeof u === p) r[i][u] = j(e, n + i + "_" + u);else for (var o in u) A(e, r[i], i + "_", o, u[o]);
	      }
	    }function C(e, r) {
	      for (var n = 0; n < r.length; n++) {
	        var i = r[n];if (typeof i === p) e[i] === t && (e[i] = j(e, i));else for (var a in i) A(e, e, "", a, i[a]);
	      }
	    }function k(e, t) {
	      for (var r = Math.min(e.length, t.length), n = 0; r > n; ++n) t[n] = e[n];
	    }function R(e) {
	      return e ? { mode: o.Normal, byref: Ue, simple: Ie, onsuccess: t, onerror: t, useHarmonyMap: Le, client: nt, userdata: {} } : { mode: o.Normal, byref: Ue, simple: Ie, timeout: Me, retry: Fe, idempotent: Ne, failswitch: Pe, oneway: !1, sync: !1, onsuccess: t, onerror: t, useHarmonyMap: Le, client: nt, userdata: {} };
	    }function U(e, t, r, n) {
	      var i = R(n);if (t in e) {
	        var a = e[t];for (var s in a) s in i && (i[s] = a[s]);
	      }for (var u = 0, o = r.length; o > u && typeof r[u] !== w; ++u);if (u === o) return i;var c = r.splice(u, o - u);for (i.onsuccess = c[0], o = c.length, u = 1; o > u; ++u) {
	        var f = c[u];switch (typeof f) {case w:
	            i.onerror = f;break;case y:
	            i.byref = f;break;case d:
	            i.mode = f;break;case m:
	            for (var l in f) l in i && (i[l] = f[l]);}
	      }return i;
	    }function I(e, t, r) {
	      var n = new c();n.writeByte(u.TagCall);var i = new f(n, r.simple);return i.writeString(e), (t.length > 0 || r.byref) && (i.reset(), i.writeList(t), r.byref && i.writeBoolean(!0)), n;
	    }function M(e, t, r, n) {
	      return xe ? h.promise(function (i, a) {
	        We.push({ batch: n, name: e, args: t, context: r, resolve: i, reject: a });
	      }) : n ? D(e, t, r) : L(e, t, r);
	    }function F(e, t, r, n) {
	      return M(t, r, U(e, t, r, n), n);
	    }function N(e, t, r, n) {
	      try {
	        r.onerror ? r.onerror(e, t) : De(e, t), n(t);
	      } catch (i) {
	        n(i);
	      }
	    }function P(e, t, r) {
	      var n = r.name,
	          i = r.args,
	          a = r.context,
	          s = I(n, i, a);s.writeByte(u.TagEnd), S(s.bytes, a, function (n) {
	        if (a.oneway) return void e();var s = null,
	            f = null;try {
	          if (a.mode === o.RawWithEndTag) s = n;else if (a.mode === o.Raw) s = n.subarray(0, n.byteLength - 1);else {
	            var h = new c(n),
	                g = new l(h, !1, a.useHarmonyMap),
	                v = h.readByte();if (v === u.TagResult) {
	              if ((s = a.mode === o.Serialized ? g.readRaw() : g.unserialize(), v = h.readByte(), v === u.TagArgument)) {
	                g.reset();var y = g.readList();k(y, i), v = h.readByte();
	              }
	            } else v === u.TagError && (f = new Error(g.readString()), v = h.readByte());v !== u.TagEnd && (f = new Error("Wrong Response:\r\n" + c.toString(n)));
	          }if (f) throw f;
	        } catch (p) {
	          f = p;
	        }f ? t(f, r) : e(s, r);
	      }, t);
	    }function x(t, r, n) {
	      return r.length > 0 && r[r.length - 1] && "function" == typeof r[r.length - 1].handler ? h.promise(function (e, i) {
	        var a = r[r.length - 1],
	            s = { name: t, args: r.slice(0, r.length - 1), udata: a, invoke: P, context: n };for (var u in a) "handler" != u && a.hasOwnProperty(u) && (s[u] = a[u]);a.handler(s, e, i);
	      }) : "function" == typeof e.hprose.userdefInvoke ? h.promise(function (i, a) {
	        var s = { name: t, args: r, udata: null, invoke: P, context: n };e.hprose.userdefInvoke(s, i, a);
	      }) : h.promise(function (e, i) {
	        var a = { name: t, args: r, context: n };P(e, i, a);
	      });
	    }function W(e) {
	      return function () {
	        e && (xe = !1, s(function (e) {
	          e.forEach(function (e) {
	            "settings" in e ? Q(e.settings).then(e.resolve, e.reject) : M(e.name, e.args, e.context, e.batch).then(e.resolve, e.reject);
	          });
	        }, We), We = []);
	      };
	    }function L(e, t, r) {
	      r.sync && (xe = !0);var n = h.promise(function (n, i) {
	        $e(e, t, r).then(function (a) {
	          try {
	            if (r.onsuccess) try {
	              r.onsuccess(a, t);
	            } catch (s) {
	              r.onerror && r.onerror(e, s), i(s);
	            }n(a);
	          } catch (s) {
	            i(s);
	          }
	        }, function (t) {
	          N(e, t, r, i);
	        });
	      });return n.whenComplete(W(r.sync)), n;
	    }function D(e, t, r) {
	      return h.promise(function (n, i) {
	        qe.push({ args: t, name: e, context: r, resolve: n, reject: i });
	      });
	    }function H(e) {
	      var t = { timeout: Me, retry: Fe, idempotent: Ne, failswitch: Pe, oneway: !1, sync: !1, client: nt, userdata: {} };for (var r in e) r in t && (t[r] = e[r]);return t;
	    }function z(e, t) {
	      var r = e.reduce(function (e, t) {
	        return e.write(I(t.name, t.args, t.context)), e;
	      }, new c());return r.writeByte(u.TagEnd), h.promise(function (n, i) {
	        S(r.bytes, t, function (r) {
	          if (t.oneway) return void n(e);var a = -1,
	              s = new c(r),
	              f = new l(s, !1),
	              h = s.readByte();try {
	            for (; h !== u.TagEnd;) {
	              var g = null,
	                  v = null,
	                  y = e[++a].context.mode;if ((y >= o.Raw && (g = new c()), h === u.TagResult)) {
	                if ((y === o.Serialized ? g = f.readRaw() : y >= o.Raw ? (g.writeByte(u.TagResult), g.write(f.readRaw())) : (f.useHarmonyMap = e[a].context.useHarmonyMap, f.reset(), g = f.unserialize()), h = s.readByte(), h === u.TagArgument)) {
	                  if (y >= o.Raw) g.writeByte(u.TagArgument), g.write(f.readRaw());else {
	                    f.reset();var p = f.readList();k(p, e[a].args);
	                  }h = s.readByte();
	                }
	              } else h === u.TagError && (y >= o.Raw ? (g.writeByte(u.TagError), g.write(f.readRaw())) : (f.reset(), v = new Error(f.readString())), h = s.readByte());if ([u.TagEnd, u.TagResult, u.TagError].indexOf(h) < 0) return void i(new Error("Wrong Response:\r\n" + c.toString(r)));y >= o.Raw ? (y === o.RawWithEndTag && g.writeByte(u.TagEnd), e[a].result = g.bytes) : e[a].result = g, e[a].error = v;
	            }
	          } catch (d) {
	            return void i(d);
	          }n(e);
	        }, i);
	      });
	    }function q() {
	      ze = !0;
	    }function Q(e) {
	      if ((e = e || {}, ze = !1, xe)) return h.promise(function (t, r) {
	        We.push({ batch: !0, settings: e, resolve: t, reject: r });
	      });var t = qe.length;if (0 !== t) {
	        var r = H(e);r.sync && (xe = !0);var n = qe;qe = [];var i = h.promise(function (e, t) {
	          Ve(n, r).then(function (t) {
	            t.forEach(function (e) {
	              if (e.error) N(e.name, e.error, e.context, e.reject);else try {
	                if (e.context.onsuccess) try {
	                  e.context.onsuccess(e.result, e.args);
	                } catch (t) {
	                  e.context.onerror && e.context.onerror(e.name, t), e.reject(t);
	                }e.resolve(e.result);
	              } catch (t) {
	                e.reject(t);
	              }delete e.context, delete e.resolve, delete e.reject;
	            }), e(t);
	          }, function (e) {
	            n.forEach(function (t) {
	              "reject" in t && N(t.name, e, t.context, t.reject);
	            }), t(e);
	          });
	        });return i.whenComplete(W(r.sync)), i;
	      }
	    }function G() {
	      return De;
	    }function J(e) {
	      typeof e === w && (De = e);
	    }function Y() {
	      return Ce;
	    }function $() {
	      return Pe;
	    }function V(e) {
	      Pe = !!e;
	    }function X() {
	      return Me;
	    }function K(e) {
	      Me = "number" == typeof e ? 0 | e : 0;
	    }function Z() {
	      return Fe;
	    }function ee(e) {
	      Fe = "number" == typeof e ? 0 | e : 0;
	    }function te() {
	      return Ne;
	    }function re(e) {
	      Ne = !!e;
	    }function ne(e) {
	      Ye = !!e;
	    }function ie() {
	      return Ye;
	    }function ae() {
	      return Ue;
	    }function se(e) {
	      Ue = !!e;
	    }function ue() {
	      return Ie;
	    }function oe(e) {
	      Ie = !!e;
	    }function ce() {
	      return Le;
	    }function fe(e) {
	      Le = !!e;
	    }function le() {
	      return 0 === He.length ? null : 1 === He.length ? He[0] : He.slice();
	    }function he(e) {
	      He.length = 0, Array.isArray(e) ? e.forEach(function (e) {
	        ge(e);
	      }) : ge(e);
	    }function ge(e) {
	      e && "function" == typeof e.inputFilter && "function" == typeof e.outputFilter && He.push(e);
	    }function ve(e) {
	      var t = He.indexOf(e);return -1 === t ? !1 : (He.splice(t, 1), !0);
	    }function ye(e, r, n) {
	      n === t && (typeof r === y && (n = r, r = !1), r || (typeof e === y ? (n = e, e = !1) : (e && e.constructor === Object || Array.isArray(e)) && (r = e, e = !1)));var i = nt;return n && (i = {}), e || Ce ? (e && (Ce = e), (typeof r === p || r && r.constructor === Object) && (r = [r]), Array.isArray(r) ? (C(i, r), Qe.resolve(i), i) : (s(O, i), Qe)) : new Error("You should set server uri first!");
	    }function pe(e, t, n) {
	      var i = arguments.length;if (1 > i || typeof e !== p) throw new Error("name must be a string");if ((1 === i && (t = []), 2 === i && !Array.isArray(t))) {
	        var a = [];typeof t !== w && a.push(r), a.push(t), t = a;
	      }if (i > 2) {
	        typeof n !== w && t.push(r);for (var s = 2; i > s; s++) t.push(arguments[s]);
	      }return F(nt, e, t, ze);
	    }function de(e, t) {
	      return Qe.then(e, t);
	    }function we(e, t, r) {
	      if (Ge[e]) {
	        var n = Ge[e];return n[t] ? n[t] : null;
	      }return r && (Ge[e] = Object.create(null)), null;
	    }function me(e, r, n, i) {
	      if (typeof e !== p) throw new TypeError("topic name must be a string.");if (r === t || null === r) {
	        if (typeof n !== w) throw new TypeError("callback must be a function.");r = n;
	      }if (typeof r === w) return i = n, n = r, null === Je && (Je = Be()), void Je.then(function (t) {
	        me(e, t, n, i);
	      });if (typeof n !== w) throw new TypeError("callback must be a function.");if (h.isPromise(r)) return void r.then(function (t) {
	        me(e, t, n, i);
	      });i === t && (i = Me);var a = we(e, r, !0);if (null === a) {
	        var s = function () {
	          F(nt, e, [r, a.handler, s, { idempotent: !0, failswitch: !1, timeout: i }], !1);
	        };a = { handler: function (t) {
	            var n = we(e, r, !1);if (n) {
	              if (null !== t) for (var i = n.callbacks, a = 0, u = i.length; u > a; ++a) try {
	                i[a](t);
	              } catch (o) {}null !== we(e, r, !1) && s();
	            }
	          }, callbacks: [n] }, Ge[e][r] = a, s();
	      } else a.callbacks.indexOf(n) < 0 && a.callbacks.push(n);
	    }function Te(e, t, r) {
	      if (e) if (typeof r === w) {
	        var n = e[t];if (n) {
	          var i = n.callbacks,
	              a = i.indexOf(r);a >= 0 && (i[a] = i[i.length - 1], i.length--), 0 === i.length && delete e[t];
	        }
	      } else delete e[t];
	    }function be(e, r, n) {
	      if (typeof e !== p) throw new TypeError("topic name must be a string.");if (r === t || null === r) {
	        if (typeof n !== w) return void delete Ge[e];r = n;
	      }if ((typeof r === w && (n = r, r = null), null === r)) {
	        if (null === Je) {
	          if (Ge[e]) {
	            var i = Ge[e];for (r in i) Te(i, r, n);
	          }
	        } else Je.then(function (t) {
	          be(e, t, n);
	        });
	      } else h.isPromise(r) ? r.then(function (t) {
	        be(e, t, n);
	      }) : Te(Ge[e], r, n);
	    }function _e() {
	      return Je;
	    }function Be() {
	      return F(nt, "#", [], !1);
	    }function Se(e) {
	      Ze.push(e), $e = Ze.reduceRight(function (e, t) {
	        return function (r, n, i) {
	          try {
	            var a = t(r, n, i, e);return h.isFuture(a) ? a : h.value(a);
	          } catch (s) {
	            return h.error(s);
	          }
	        };
	      }, x);
	    }function Ee(e) {
	      et.push(e), Ve = et.reduceRight(function (e, t) {
	        return function (r, n) {
	          try {
	            var i = t(r, n, e);return h.isFuture(i) ? i : h.value(i);
	          } catch (a) {
	            return h.error(a);
	          }
	        };
	      }, z);
	    }function Oe(e) {
	      tt.push(e), Xe = tt.reduceRight(function (e, t) {
	        return function (r, n) {
	          try {
	            var i = t(r, n, e);return h.isFuture(i) ? i : h.value(i);
	          } catch (a) {
	            return h.error(a);
	          }
	        };
	      }, _);
	    }function je(e) {
	      rt.push(e), Ke = rt.reduceRight(function (e, t) {
	        return function (r, n) {
	          try {
	            var i = t(r, n, e);return h.isFuture(i) ? i : h.value(i);
	          } catch (a) {
	            return h.error(a);
	          }
	        };
	      }, B);
	    }function Ae(e) {
	      return Se(e), nt;
	    }var Ce,
	        ke = [],
	        Re = -1,
	        Ue = !1,
	        Ie = !1,
	        Me = 3e4,
	        Fe = 10,
	        Ne = !1,
	        Pe = !1,
	        xe = !1,
	        We = [],
	        Le = !1,
	        De = r,
	        He = [],
	        ze = !1,
	        qe = [],
	        Qe = new h(),
	        Ge = Object.create(null),
	        Je = null,
	        Ye = !0,
	        $e = x,
	        Ve = z,
	        Xe = _,
	        Ke = B,
	        Ze = [],
	        et = [],
	        tt = [],
	        rt = [],
	        nt = this;Be.sync = !0, Be.idempotent = !0, Be.failswitch = !0;var it = Object.create(null, { begin: { value: q }, end: { value: Q }, use: { value: function (e) {
	          return Ee(e), it;
	        } } }),
	        at = Object.create(null, { use: { value: function (e) {
	          return Oe(e), at;
	        } } }),
	        st = Object.create(null, { use: { value: function (e) {
	          return je(e), st;
	        } } });Object.defineProperties(this, { "#": { value: Be }, onError: { get: G, set: J }, onerror: { get: G, set: J }, uri: { get: Y }, id: { get: _e }, failswitch: { get: $, set: V }, timeout: { get: X, set: K }, retry: { get: Z, set: ee }, idempotent: { get: te, set: re }, keepAlive: { get: ie, set: ne }, byref: { get: ae, set: se }, simple: { get: ue, set: oe }, useHarmonyMap: { get: ce, set: fe }, filter: { get: le, set: he }, addFilter: { value: ge }, removeFilter: { value: ve }, useService: { value: ye }, invoke: { value: pe }, ready: { value: de }, subscribe: { value: me }, unsubscribe: { value: be }, use: { value: Ae }, batch: { value: it }, beforeFilter: { value: at }, afterFilter: { value: st } }), a && typeof a === m && ["failswitch", "timeout", "retry", "idempotent", "keepAlive", "byref", "simple", "useHarmonyMap", "filter"].forEach(function (e) {
	      e in a && (nt[e] = a[e]);
	    }), typeof n === p ? (ke = [n], Re = 0, ye(n, i)) : Array.isArray(n) && (ke = n, Re = Math.floor(Math.random() * ke.length), ye(ke[Re], i));
	  }function i(e) {
	    var t = document.createElement("a");if ((t.href = e, "http:" !== t.protocol && "https:" !== t.protocol && "ws:" !== t.protocol && "wss:" !== t.protocol)) throw new Error("The " + t.protocol + " client isn't implemented.");
	  }function a(t, r, n) {
	    try {
	      return e.hprose.HttpClient.create(t, r, n);
	    } catch (a) {}try {
	      return e.hprose.WebSocketClient.create(t, r, n);
	    } catch (a) {}if ("string" == typeof t) i(t);else if (Array.isArray(t)) throw (t.forEach(function (e) {
	      i(e);
	    }), new Error("Not support multiple protocol."));throw new Error("You should set server uri first!");
	  }var s = e.setImmediate,
	      u = e.hprose.Tags,
	      o = e.hprose.ResultMode,
	      c = e.hprose.BytesIO,
	      f = e.hprose.Writer,
	      l = e.hprose.Reader,
	      h = e.hprose.Future,
	      g = Function.prototype.call.bind(Array.prototype.slice),
	      v = new Uint8Array(1);v[0] = u.TagEnd;var y = "boolean",
	      p = "string",
	      d = "number",
	      w = "function",
	      m = "object";Object.defineProperty(n, "create", { value: a }), e.hprose.Client = n;
	})((function () {
	  return this || (1, eval)("this");
	})()), (function (e, t) {
	  "use strict";
	  function r() {}function n(i, a, o) {
	    function c(n, i) {
	      var a = new XMLHttpRequest();a.open("POST", m.uri, !0), e.location !== t && "file:" !== e.location.protocol && (a.withCredentials = "true"), a.responseType = "arraybuffer";for (var s in p) a.setRequestHeader(s, p[s]);return a.onload = function () {
	        a.onload = r, a.status && (200 === a.status ? i.resolve(new Uint8Array(a.response)) : i.reject(new Error(a.status + ":" + a.statusText)));
	      }, a.onerror = function () {
	        i.reject(new Error("error"));
	      }, a.upload !== t && (a.upload.onprogress = d), a.onprogress = w, n.constructor === String || ArrayBuffer.isView ? a.send(n) : n.buffer.slice ? a.send(n.buffer.slice(0, n.length)) : a.send(n.buffer), a;
	    }function f(e, t) {
	      var n = new u(),
	          i = c(e, n);return t.timeout > 0 && (n = n.timeout(t.timeout).catchError(function (e) {
	        throw (i.onload = r, i.onerror = r, i.abort(), e);
	      }, function (e) {
	        return e instanceof TimeoutError;
	      })), t.oneway && n.resolve(), n;
	    }function l(e) {
	      "function" == typeof e && (d = e);
	    }function h() {
	      return d;
	    }function g(e) {
	      "function" == typeof e && (w = e);
	    }function v() {
	      return w;
	    }function y(e, t) {
	      "content-type" !== e.toLowerCase() && "content-length" !== e.toLowerCase() && (t ? p[e] = t : delete p[e]);
	    }if (this.constructor !== n) return new n(i, a, o);s.call(this, i, a, o);var p = Object.create(null),
	        d = r,
	        w = r,
	        m = this;Object.defineProperties(this, { onProgress: { get: h, set: l }, onprogress: { get: h, set: l }, onRequestProgress: { get: h, set: l }, onResponseProgress: { get: v, set: g }, setHeader: { value: y }, sendAndReceive: { value: f } });
	  }function i(e) {
	    var t = document.createElement("a");if ((t.href = e, "http:" !== t.protocol && "https:" !== t.protocol)) throw new Error("This client desn't support " + t.protocol + " scheme.");
	  }function a(e, t, r) {
	    if ("string" == typeof e) i(e);else {
	      if (!Array.isArray(e)) return new Error("You should set server uri first!");e.forEach(function (e) {
	        i(e);
	      });
	    }return new n(e, t, r);
	  }var s = e.hprose.Client,
	      u = e.hprose.Future;Object.defineProperty(n, "create", { value: a }), e.hprose.HttpClient = n;
	})((function () {
	  return this || (1, eval)("this");
	})()), (function (e, t) {
	  "use strict";
	  function r() {}function n(e, i, a) {
	    function c() {
	      return 2147483647 > d ? ++d : d = 0;
	    }function f(e, t) {
	      var r = new u();r.writeInt32BE(e), t.constructor === String ? r.writeString(t) : r.write(t);var n = r.bytes;ArrayBuffer.isView ? _.send(n) : n.buffer.slice ? _.send(n.buffer.slice(0, n.length)) : _.send(n.buffer);
	    }function l(e) {
	      b.resolve(e);
	    }function h(e) {
	      var r = new u(e.data),
	          n = r.readInt32BE(),
	          i = m[n];if ((delete m[n], i !== t && (--w, i.resolve(r.read(r.length - 4))), 100 > w && T.length > 0)) {
	        ++w;var a = T.shift();b.then(function () {
	          f(a[0], a[1]);
	        });
	      }0 === w && (B.keepAlive || p());
	    }function g(e) {
	      m.forEach(function (t, r) {
	        t.reject(new Error(e.code + ":" + e.reason)), delete m[r];
	      }), w = 0, _ = null;
	    }function v() {
	      b = new o(), _ = new WebSocket(B.uri), _.binaryType = "arraybuffer", _.onopen = l, _.onmessage = h, _.onerror = r, _.onclose = g;
	    }function y(e, t) {
	      (null === _ || _.readyState === WebSocket.CLOSING || _.readyState === WebSocket.CLOSED) && v();var r = c(),
	          n = new o();return m[r] = n, B.timeout > 0 && (n = n.timeout(B.timeout).catchError(function (e) {
	        throw (delete m[r], --w, e);
	      }, function (e) {
	        return e instanceof TimeoutError;
	      })), 100 > w ? (++w, b.then(function () {
	        f(r, e);
	      })) : T.push([r, e]), t.oneway && n.resolve(), n;
	    }function p() {
	      null !== _ && (_.onopen = r, _.onmessage = r, _.onclose = r, _.close());
	    }if (this.constructor !== n) return new n(e, i, a);s.call(this, e, i, a);var d = 0,
	        w = 0,
	        m = [],
	        T = [],
	        b = null,
	        _ = null,
	        B = this;Object.defineProperties(this, { sendAndReceive: { value: y }, close: { value: p } });
	  }function i(e) {
	    var t = document.createElement("a");if ((t.href = e, "ws:" !== t.protocol && "wss:" !== t.protocol)) throw new Error("This client desn't support " + t.protocol + " scheme.");
	  }function a(e, t, r) {
	    if ("string" == typeof e) i(e);else {
	      if (!Array.isArray(e)) return new Error("You should set server uri first!");e.forEach(function (e) {
	        i(e);
	      });
	    }return new n(e, t, r);
	  }var s = e.hprose.Client,
	      u = e.hprose.BytesIO,
	      o = e.hprose.Future;Object.defineProperty(n, "create", { value: a }), e.hprose.WebSocketClient = n;
	})((function () {
	  return this || (1, eval)("this");
	})()), (function (e) {
	  "use strict";
	  function t(e) {
	    this.version = e || "2.0";
	  }var r = e.hprose.Tags,
	      n = e.hprose.BytesIO,
	      i = e.hprose.Writer,
	      a = e.hprose.Reader,
	      s = 1;t.prototype.inputFilter = function (e, t) {
	    var a = n.toString(e);"{" === a.charAt(0) && (a = "[" + a + "]");for (var s = JSON.parse(a), u = new n(), o = new i(u, !0), c = 0, f = s.length; f > c; ++c) {
	      var l = s[c];l.error ? (u.writeByte(r.TagError), o.writeString(l.error.message)) : (u.writeByte(r.TagResult), o.serialize(l.result));
	    }return u.writeByte(r.TagEnd), u.bytes;
	  }, t.prototype.outputFilter = function (e, t) {
	    var i = [],
	        u = new n(e),
	        o = new a(u, !1, !1),
	        c = u.readByte();do {
	      var f = {};c === r.TagCall && (f.method = o.readString(), c = u.readByte(), c === r.TagList && (f.params = o.readListWithoutTag(), c = u.readByte()), c === r.TagTrue && (c = u.readByte())), "1.1" === this.version ? f.version = "1.1" : "2.0" === this.version && (f.jsonrpc = "2.0"), f.id = s++, i.push(f);
	    } while (c === r.TagCall);return i.length > 1 ? JSON.stringify(i) : JSON.stringify(i[0]);
	  }, e.hprose.JSONRPCClientFilter = t;
	})((function () {
	  return this || (1, eval)("this");
	})()), (function (e) {
	  "use strict";
	  e.hprose.common = { Completer: e.hprose.Completer, Future: e.hprose.Future, ResultMode: e.hprose.ResultMode }, e.hprose.io = { BytesIO: e.hprose.BytesIO, ClassManager: e.hprose.ClassManager, Tags: e.hprose.Tags, RawReader: e.hprose.RawReader, Reader: e.hprose.Reader, Writer: e.hprose.Writer, Formatter: e.hprose.Formatter }, e.hprose.client = { Client: e.hprose.Client, HttpClient: e.hprose.HttpClient, WebSocketClient: e.hprose.WebSocketClient }, e.hprose.filter = { JSONRPCClientFilter: e.hprose.JSONRPCClientFilter }, "function" == "function" && (__webpack_require__(5).cmd ? !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (e.hprose), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)) : __webpack_require__(6) && !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
	    return e.hprose;
	  }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))), "object" == typeof module && "object" == typeof module.exports && (module.exports = e.hprose);
	})((function () {
	  return this || (1, eval)("this");
	})());

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = function() { throw new Error("define cannot be used indirect"); };


/***/ },
/* 6 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {module.exports = __webpack_amd_options__;

	/* WEBPACK VAR INJECTION */}.call(exports, {}))

/***/ }
/******/ ]);