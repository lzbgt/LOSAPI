'use strict';
function getUrlPara() {
  var url = location.href;
  var paraObj = {};
  var paramMark = url.indexOf("?");
  if (paramMark != -1) {
    var routeMark = url.indexOf("#");
    if (routeMark != -1) {
      if (paramMark < routeMark) {
        url = url.slice(0, routeMark);
      }
    }
    var paraString = url.substring(paramMark + 1, url.length).split("&");
    for (i = 0; j = paraString[i]; i++) {
      paraObj[j.substring(0, j.indexOf("="))] = j.substring(j.indexOf("=") + 1, j.length);
    }
  }
  return paraObj;
}

function LoadLeither(I) {
  var urlParam = getUrlPara();
  //debugger;
  for (var name in urlParam) {
    if (name == "ip") {
      I["IPList"] = [urlParam[name]];
    } else if (name == "bid") {
      I["SystemBid"] = urlParam[name];
    } else {
      I[name] = urlParam[name];
    }
  }

  if (I.clearcache) {
    console.log("clear cache")
    indexedDB.deleteDatabase("LeitherApi");
    localStorage.clear();
  }
  console.log(I);
  IP = I.IPList[I.IPNum]; //这样好象没检查ip
  if (typeof(RunApp) == "function") {
    RunApp(I, 0);
    return;
  }
  leitherApi = localStorage["leitherApi"];
  if (leitherApi) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.textContent = localStorage["leitherApi"];
    document.getElementsByTagName("head")[0].appendChild(script);
    RunApp(I, 0);
    return;
  }
  LoadJsByIpAndName(IP, I.SystemBid, "LeitherApi", "last", function() {
    RunApp(I, 0);
  }, getFuncFail(I));

};

function getFuncFail(I) {
  return function() {
    I.IPNum++;
    if (I.IPNum >= I.IPList.length) {
      console.log("Leither 初始化失败");
      return;
    }
    LoadLeither(I);
  };
};

function LoadJsByURL(url, Success, Fail) {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.async = "async";
  if (script.readyState) {
    script.onreadystatechange = function() {
      if (script.readyState == "loaded" || script.readyState == "complete") {
        script.onreadystatechange = null;
        Success();
      };
    };
  } else {
    script.onload = function() {
      Success();
    };
  };
  script.addEventListener("error", function() {
    Fail();
  });
  script.src = url;
  document.getElementsByTagName("head")[0].appendChild(script); //load Leither first
};

function LoadJsByIpAndName(ip, bid, name, ver, Success, Fail) {
  url = 'http://' + ip + '/loadres?type=application/javascript&bid=' + bid + '&name=' + name + '&ver=' + ver;
  LoadJsByURL(url, Success, Fail);
};
LoadLeither(getInitG());