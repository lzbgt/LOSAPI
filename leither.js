var Dexie = require("./Dexie.min.js");
require("./hprose-html5.js");

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
    param.invoke(function(s, param) {
      //debug.log("loaded from server: ", param, s);
      var flag = TargetAPIs.some(function(e) {
        return param.name.indexOf(e) !== -1;
      });

      var reason = flag;
      if (param.ttl !== undefined && param.ttl <= 0) {
        flag = false;
        reason = "disabled"
      }

      debug.log("do cache?: ", reason, param.name, param.args, param.udata, s);
      if (!flag || param.nocache || s === null) {
        return resolve(s);
      }

      var obj = null;
      if (typeof(s) == "string" && s[0] == "{") {
        var json = JSON.parse(s);
        obj = {
          __is: "string",
          value: json
        };
        //debug.log("got string: ");
      } else if (typeof(s) == "object" && s != null) {
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
        icache.db[icache.table].put(obj).then(function(s) {
          //debug.log("saved to db", s);
        }, function(e) {
          debug.warn("save to db error: ", e);
        });
      }
      if (param.skipResolve) {
        //debug.log("resolve skipped");
        if (typeof(param.asyncCall) == "function") {
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
    var flag = TargetAPIs.some(function(e) {
      return param.name.indexOf(e) !== -1;
    });

    if (flag) {
      key = buildKeyForIdbObj(param);
    }

    if (key) {
      icache.db[icache.table].get(key).then(function(s) {
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
          if (param.background ||
            (typeof(param.background) == 'undefined' && icache.background)) {
            debug.log("fetching from icache.db with background enabled: ", key, value, param.name, param.args);
            resolve(value);
            param.skipResolve = true;
            doInvoke(param, resolve, reject);
            return;
          }

          // check ttl
          if (typeof(param.ttl) == "undefined") {
            if (typeof(s.__ttl) == "undefined") {
              s.__ttl = icache.DEFAULT_TTL;
            }
            //debug.log("icache using default ttl: ", icache.DEFAULT_TTL);
          } else {
            s.__ttl = param.ttl;
          }

          if (s.__ttl < (Date.now() - s.__ts)) {
            doInvoke(param, resolve, reject);
          } else {
            debug.log("fetching from icache.db: ", key, value, param.name, param.args);
            resolve(value);
          }
        }
      }, function(e) {
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
  icache.tools.makeurl = function(ipport, appname, appbid, uid) {
    return "http://" + ipport + "/loadres?type=text/html&AppName=" + appname + "&AppBid=" + appbid +
      "&ip=" + ipport + "&bid=" + G.SystemBid + "&name=AppTemplate&ver=last&userid=" + uid;
  };
}

// originals
var api = function(ip) {
  if (ip.substr(0, 7) == "http://") {
    ip = ip.substr(7);
    var i = ip.indexOf("/");
    if (i > 0) {
      ip = ip.substr(0, i);
    }
  }
  var ayapi = ["login", "register", "getvar", "act", "setdata", "set", "get", "del", "expire", "hmclear", "hset", "hget", "hdel", "hlen", "hkeys",
    "hgetall", "hmset", "hmget", "exit", "restart", "lpush", "lpop", "rpush", "rpop", "lrange", "zadd", "zrange",
    "sadd", "scard", "sclear", "sdiff", "sinter", "smclear", "smembers", "srem", "sunion",
    "sendmsg", "readmsg", "pullmsg", "invite", "accept", "test", "veni", "sethostip", "proxyget",
    "createinvcode", "getinvcodeinfo", "updateinvcode", "deleteinvcode",
    "setinvtemplate", "getinvtemplate", "getappdownloadkey", "getresbyname", "getgshorturlkey", "getlshorturlkey",
    "incr", "zcard", "zcount", "zrem", "zscore", "zrank", "zrangebyscore",
    "lindex", "lexpire", "lexpireat", "lttl", "lpersist", "llen", "sendmail", "lset"
  ];
  var apiurl = "ws://" + ip + "/ws/";
  if (navigator.userAgent.indexOf("Firefox") != -1) {
    apiurl = "http://" + ip + "/webapi/";
  }
  return hprose.Client.create(apiurl, ayapi);
};

var apiLogLevels = ['log', 'info', 'warn', 'error'];
window.debug = {};

function setLog(logLvl) {
  // default to warn
  var getLoglevel = function(levl){
    // for compatibility of old api
    var lvl = 2;
    if (typeof levl === 'boolean') {
      if (!logLvl) {
        lvl = apiLogLevels.length;
      }
    } else if (typeof levl === 'number') {
      lvl = logLvl;
    }

    return lvl;
  };

  var lvl = 0;

  if (typeof logLvl === 'string') {
    try{
      lvl = eval(logLvl);

    } catch(e){
      lvl = 2
    }
  }

  lvl = getLoglevel(lvl);

  console.log("loglevel: ", lvl);

  var __no_op = function() {};
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
  return function(e) {
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
  if (typeof(InitErrFunc) == "function") {
    InitErrFunc();
  }
  if (typeof(main) == "undefined") {
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
  if (typeof(def) != "undefined") {
    localStorage[key] = JSON.stringify(def);
  }
  return def;
}

function saveLoginInfo(uid, ppt) {
  debug.log("saveLoginInfo uid:", uid, "ppt:", ppt);
  if (typeof(uid) != "string") {
    uid = "";
  }
  if (typeof(ppt) != "string") {
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
  request.onerror = function(e) {
    debug.error(e.currentTarget.error.message);
    future.reject(e);
  };

  request.onsuccess = function(e) {
    debug.log("InitDb ok");
    var db = e.target.result;
    G.LeitherDb = db;
    future.resolve(db);
  };

  request.onupgradeneeded = function(e) {
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
  request.onerror = function(e) {
    future.reject(e);
  };
  request.onsuccess = function(e) {
    future.resolve(e.target.result);
    debug.log('getdbdata2 ', e.target.result);
  };
  return future;
}

function SetDbData(value) {
  var tr = G.LeitherDb.transaction("res", 'readwrite');
  var store = tr.objectStore("res");
  var future = new hprose.Future();
  request = store.put(value);
  request.onerror = function(e) {
    debug.log('setdbdata err', e);
    future.reject(e)
  };
  request.onsuccess = function(e) {
    future.resolve(e.target.result);
    debug.log('setdbdata: ', e.target.result)
  };
  return future;
}

function RunApp(I, ipnum) {
  // CompilerFix:  workaround for undefined RunApp
  if(arguments.length == 0) return;

  if(typeof I.Log === "undefined") {
    setLog(false)
  }else{
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
    return
  }
  var ip = G.IPList[ipnum];
  RunAppByIP(ip);
}

window.RunApp = RunApp;
// CompilerFix:  workaround for undefined RunApp
window.RunApp()

function processManifest(appBid, ver, data) {
  //debug.log("in processManifest");
  var future = new hprose.Future();
  var m = JSON.parse(data);
  var getList = function(res, version) {
    var thisVer = "last";
    if (version == "last" || version == "release") {
      thisVer = res[version];
    }
    return res['ResFile'][thisVer];
  };

  var list = getList(m, ver);
  var getFs = function(i) {
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
    Future.all(fs).then(function(values) {
      debug.log("all promise", values);
      //setMain("processManifest loaded all resfiles");
      //if (i < list.length) {
      //    getFs(i);
      //}
      future.resolve();
    }, function(e) {
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
  InitDb().then(function(db) {
    debug.log("hprose ready", db);
    G.api.ready(function(stub) {
      debug.log("hprose ready ok");
      debug.log("G.uid=", G.uid);
      LoadApp(stub, G.AppName, G.AppBid, G.AppVer).then(function() {
        var errfunc = PE("login");
        G.postLogin = postLogin;
        if (typeof ENABLE_UAC !== 'undefined' && ENABLE_UAC) {
          setMain("UAC enabled, must redirect to the login page first");
        } else {
          stub.login(G.uid, G.userppt).then(function(reply) {
            debug.log("login ok");
            postLogin(reply);
            G.swarm = reply.swarm;
            debug.log("LeitherIsOK:", LeitherIsOK());
            debug.log("login ok sid=", reply.sid);
            debug.log("user= ", reply.user);
            debug.log("swarm=", reply.swarm);
            debug.log("appName=", G.AppName);
            setMain("after loaded app and logedin");
          }, errfunc);
        }

        if (!G.Local) {
          debug.log("use remote files");
          //check newest api and app manifest
          stub.getresbyname(G.sid, G.SystemBid, "LeitherApi", G.AppVer, {
              handler: icache.handler,
              ttl: 0
            })
            .then(function(data) {
              var r = new FileReader();
              r.onload = function(e) {
                debug.log("leitherApi re get ok");
                localStorage["leitherApi"] = e.target.result;
              };
              r.readAsText(new Blob([data]));
            });
          stub.hget(G.sid, G.AppBid, "applist", G.AppName, {
              handler: icache.handler,
              ttl: 0
            })
            .then(function(data) {
              debug.log("manifest re hget ok");
              SetDbData({
                id: G.AppName,
                data: data,
                tbname: G.ApptbName
              }).then();
            });
        }
      });
    }, PE("api.ready"))
  }, PE("InitDb"));
}

function loadJS(appBid, key) {
  var future = new hprose.Future();
  var script = document.createElement("script");
  script.type = "text/javascript";
  GetDbData(key).then(function(d) {
    if (d) {
      debug.log("load js from db: ", key);
      script.textContent = d.data;
      document.getElementsByTagName("head")[0].appendChild(script);
      future.resolve(key);
    } else {
      debug.log("check leither");
      if ((typeof(LeitherIsOK) == "function") && LeitherIsOK()) {
        debug.log("check leither ok");
        var ff = function(reason) {
          debug.error(reason);
          future.reject(key);
        };
        G.api.ready(function(stub) {
          stub.get("", appBid, key, function(data) {
            debug.log("load js from server: ", appBid, key);
            if (data) {
              var r = new FileReader();
              r.onload = function(e) {
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
  }, function(e) {
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

  GetDbData(appName).then(function(manifest) {
    if (manifest) {
      debug.log('get app manifest from db successed: ', appName);
      processManifest(appBid, version, manifest.data).then(function() {
        future.resolve();
      }, function(e) {
        debug.warn("LoadApp: ", e);
        future.reject(e);
      });
    } else {
      debug.log("app :", appName, " resfiles not found in DB, fetching ... ");
      losApi.hget("", appBid, "applist", appName).then(function(data) {
        var tbName = appBid + "_" + appName;
        SetDbData({
          id: appName,
          data: data,
          tbname: tbName
        });
        processManifest(appBid, version, data).then(function(s) {
          future.resolve();
        }, function(e) {
          debug.warn("LoadApp 2: ", e);
          future.reject(e);
        });
      })
    }
  }, function(e) {
    debug.error(e);
  });
  return future;
}