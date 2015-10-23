//thid = "D1DG3LKrjJV1--NAjBq8t9vx0gdo-wcnzsv1BBANJPY" //阿里云
//twid = "UFpI8YQ1-hdSMmzHnkrvaK3rvHPEKtqCa3wwDObsEuU" //阿里云上的李四保帐号

if (!window.localStorage) {
    alert('This browser does NOT support localStorage');
}
var resid = ""
function FVPair() { }
function ScorePair() { }
function Message() { }
//var hosturl = window.location.host
var onlineHost
var client;
//debug.log(hosturl);
//client.timeout = 200000;
/*
function InitServerIp(sid) {
    if (hosturl.indexOf("127.0.0.1") == 0 || hosturl.indexOf("http://127.0.0.1") == 0) {
        //获取主站的外网ip，如果没有则进入测试代码部分
        debug.log("localhost")
        client.getvar(sid, "hosturl", function (hosturl) {
            debug.log(hosturl);
            if (hosturl.length == 0) {
                debug.log("check serverip");
                client.proxyget(sid, "http://1111.ip138.com/ic.asp", function (strbody) {
                    ip = getipfromip368(strbody)
                    if (ip.length > 0) {
                        client.sethostip(sid, ip)
                    }
                }, function (name, err) {
                    debug.log(name + ":" + err);
                })
            }
        }, function (name, err) {
            debug.log(name + ":" + err);
        })
    }
}
*/
function getipfromip368(strbody) {
    start = strbody.indexOf("[")
    if (start <= 0)
        return ""
    str = strbody.substring(start + 1)
    //debug.log("str=" +str)                      
    end = str.indexOf("]")
    if (end <= 0)
        return ""
    //debug.log("end=" + end)                      
    return str.substring(0, end)
}
errfunc = function (name, err) {
    debug.log(name, err);
}
function Login($scope) {
    bid = $scope.bid
    ppt = ""
    if ($scope.ppt != null) {
        ppt = $scope.ppt
        bid = ""
        //$scope.bid = ""
        $scope.ppt = ""
    }
    debug.log("Login:" + bid);
    client.ready(function (stub) {
    stub.login(bid, ppt, function (reply) {
        debug.log("login ok reply=", reply)
        sid = reply.sid
        $scope.sid = sid
        //      InitServerIp(sid)
        //取用户信息
        debug.log(reply.user)
        if (reply.user == null) {
            debug.log("user is null relogin, reply.swarm=", reply.swarm, reply.swarm.nodes)
            if (reply.swarm == null || reply.swarm.nodes == null || reply.swarm.nodes.length == 0) {
                debug.log("swarm is null, login fail")
                return
            }
            debug.log("relogin ", reply.swarm.nodes[0].url)
            client = api(reply.swarm.nodes[0].url)
            Login($scope)
            return
        }
        $scope.pullmsg()
        $scope.user = reply.user;
        $scope.appstatus = "running getdata ok"
        $scope.bid = reply.user.id
        $scope.$apply()

        //取版本号
        stub.getvar(sid, "ver", function (data) {
            debug.log(data)
            $scope.version = data;
            $scope.appstatus = "running getdata ok"
            $scope.$apply()
        }, function (name, err) {
            debug.log(err);
        });
        stub.getvar(sid, "onlinehost", function (data) {
            onlineHost = data
            debug.log("onlinehost:", onlineHost)

        }, function (name, err) {
            debug.log(err);
        });
        stub.getvar(sid, "hostinfo", function (hostinfo) {
            debug.log("hostinfo:", hostinfo)
            $scope.hid = hostinfo.id
            $scope.hurl = hostinfo.url
            $scope.hostbids = hostinfo.bids
            $scope.$apply()
        }, function (name, err) {
            debug.log(err);
        });
    }, function (name, err) {
        localStorage.removeItem("userid")
        debug.log(err);
        $scope.appstatus = err
        $scope.$apply()
    })
    })
}
function isNull(v) {
    return (v == null) || (typeof (v) == "undefined")
}
function UserInfoCtrl($scope, $http) {
    debug.log("UserInfoCtrl")
    client = G.api
    $scope.appstatus = "idle"
    $scope.sid = G.sid 
    $scope.bid = G.uid
    $scope.resid = ""
    $scope.host = "http://" + G.currentIP + "/"
    debug.log(G.user)
    $scope.user = G.user;
    $scope.bid = G.user.id

    client.ready(function (stub) {
        client.getvar($scope.sid, "hostinfo", function (hostinfo) {
            debug.log("hostinfo:", hostinfo)
            $scope.hid = hostinfo.id
            $scope.hurl = hostinfo.url
            $scope.hostbids = hostinfo.bids
            $scope.$apply()
        }, function (name, err) {
            debug.log(err);
        });
        //取版本号
        client.getvar($scope.sid, "ver", function (data) {
            debug.log(data)
            $scope.version = data;
            $scope.appstatus = "running getdata ok"
            $scope.$apply()
        }, function (name, err) {
            debug.log(err);
        });
        client.getvar($scope.sid, "onlinehost", function (data) {
            onlineHost = data
            debug.log("onlinehost:", onlineHost)

        }, function (name, err) {
            debug.log(err);

        });
        $scope.setdata = function () {
            ob = new Message
            ob.F = 0;
            ob.R = 0;
            client.setdata($scope.sid, $scope.bid, ob, function (data) {
                $scope.appstatus = "setdata ok.create key=[" + data + "]"
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "set error"
                $scope.$apply()
            })
        }
        $scope.zadd = function () {
            sc = new ScorePair
            sc.score = $scope.count + 1
            sc.member = $scope.count
            client.zadd($scope.sid, $scope.bid, "zkey", sc, function (data) {
                $scope.appstatus = "zadd ok. ret=[" + data + "]"
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "zadd error"
                $scope.$apply()
            })
        }
        $scope.zrange = function () {
            client.zrange($scope.sid, $scope.bid, "zkey", 0, 10, function (data) {
                for (i = 0; i < data.length; i++) {
                    debug.log("zrange sc=", data[i].score, "mem=", data[i].member)
                }
                $scope.appstatus = "zrange ok. ret=[" + data[0].score + "]"
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "zrange error"
                $scope.$apply()
            })
        }
        $scope.zrangebyscore = function () {
            //Zrangebyscore(sid, bid, key string, mins, maxs int64, offset int, count int)
            client.zrangebyscore($scope.sid, $scope.bid, "zkey", 3, 5, 1, 8, function (data) {
                for (i = 0; i < data.length; i++) {
                    debug.log("zrangebyscore sc=", data[i].score, "mem=", data[i].member)
                }
                $scope.appstatus = "zrangebyscore ok. ret=[" + data[0].score + "]"
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "zrangebyscore error"
                $scope.$apply()
            })
        }
        $scope.set = function () {
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                key = "key"
                value = $scope.count
            } else {
                splits = $scope.inputest.split(";")
                key = splits[0]
                value = splits[1]
            }
            client.set($scope.sid, $scope.bid, key, value, function () {
                $scope.appstatus = "set ok"
                debug.log($scope.appstatus);
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "set error"
                $scope.$apply()
            })
        }
        $scope.get = function () {
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                key = "key"
            } else {
                key = $scope.inputest;
            }
            client.get($scope.sid, $scope.bid, key, function (data) {
                // $scope.bid = data[0]
                $scope.appstatus = "get ok.value=[" + data + "]"
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "get error"
                $scope.$apply()
            })
        }
        $scope.del = function () {
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                key = "key"
            } else {
                key = $scope.inputest;
            }

            client.del($scope.sid, $scope.bid, key, function (data) {
                $scope.appstatus = "del ok.ret=[" + data + "]"
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "del error"
                $scope.$apply()
            })
        }
        $scope.Expire = function () {
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                key = "key"
            } else {
                key = $scope.inputest;
            }

            client.expire($scope.sid, $scope.bid, key, 20, function (data) {
                $scope.appstatus = "Expire ok.ret=[" + data + "]"
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "Expire error"
                $scope.$apply()
            })
        }
        $scope.hmclear = function () {
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                key = "key2"
            } else {
                key = $scope.inputest;
            }

            client.hmclear($scope.sid, $scope.bid, key, function (data) {
                $scope.appstatus = "hmclear ok.ret=[" + data + "]"
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "hmclear error"
                $scope.$apply()
            })
        }
        $scope.hset = function () {
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                key = "key2"
                field = "field2"
                value = $scope.count
                /*
                var msg = new Message()
                msg.from = "from"
                msg.to = "to"
                msg.num = $scope.count
                value = msg/*
                var dd = {};
                dd.a = 1;
                dd.b = "v";
                value = dd*/
            } else {
                splits = $scope.inputest.split(";")
                key = splits[0]
                field = splits[1]
                value = splits[2]
            }
            client.hset($scope.sid, $scope.bid, key, field, value, function (data) {
                $scope.appstatus = "hset ok num=" + data
                debug.log($scope.appstatus);
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "hset error"
                $scope.$apply()
            })
        }
        $scope.hlen = function () {
            debug.log("hlen sid:" + $scope.sid + "bid:" + $scope.bid);
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                key = "key2"
            } else {
                key = $scope.inputest
            }

            client.hlen($scope.sid, $scope.bid, key, function (data) {
                $scope.appstatus = "hlen ok.value=[" + data + "]"
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "hlen error"
                $scope.$apply()
            })
        }
        $scope.hkeys = function () {
            debug.log("hkeys sid:" + $scope.sid + "bid:" + $scope.bid);
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                key = "key2"
            } else {
                key = $scope.inputest
            }
            client.hkeys($scope.sid, $scope.bid, key, function (data) {
                if (data == null) {
                    debug.log("hkeys data=null")
                    return
                }
                for (i = 0; i < data.length; i++) {
                    debug.log("key:", data[i])
                }

                $scope.appstatus = "hkeys ok.len=[" + data.length + "]"
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "hlen error"
                $scope.$apply()
            })
        }
        $scope.hget = function () {
            debug.log("hget sid:" + $scope.sid + "bid:" + $scope.bid);
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                key = "key2"
                field = "field2"
            } else {
                splits = $scope.inputest.split(";")
                key = splits[0]
                field = splits[1]
            }
            client.hget($scope.sid, $scope.bid, key, field, function (data) {
                $scope.appstatus = "hget ok.value=[" + data + "]"
                $scope.$apply()
                debug.log(data);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "hget error"
                $scope.$apply()
            })
        }
        $scope.hmset = function () {
            fv1 = new FVPair
            fv2 = new FVPair
            fv1.field = "field1"
            fv1.value = 10
            fv2.field = "field2"
            fv2.value = 20
            debug.log("hmset sid:" + $scope.sid + "bid:" + $scope.bid);
            client.hmset($scope.sid, $scope.bid, "key2", fv1, fv2, function () {
                $scope.appstatus = "hmset ok"
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "hmget error"
                $scope.$apply()
            })
        }
        $scope.hmget = function () {
            debug.log("hmget sid:" + $scope.sid + "bid:" + $scope.bid);
            client.hmget($scope.sid, $scope.bid, "key2", "field0", "field1", function (data) {
                debug.log("hmget OK")
                if (data == null) {
                    debug.log("hmget data=null")
                    return
                }
                for (i = 0; i < data.length; i++) {
                    debug.log("value:", data[i])
                }
                $scope.appstatus = "hmget ok.field num=[" + data.length + "]"
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "hmget error"
                $scope.$apply()
            })
        }
        $scope.hgetall = function () {
            debug.log("hgetall sid:" + $scope.sid + "bid:" + $scope.bid);
            client.hgetall($scope.sid, $scope.bid, "key2", function (data) {
                if (data == null) {
                    debug.log("hgetall data=null")
                    return
                }
                for (i = 0; i < data.length; i++) {
                    debug.log("field ", data[i].field, "value", data[i].value)
                }
                $scope.appstatus = "hgetall ok.field num=[" + data.length + "]"
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "hgetall error"
                $scope.$apply()
            })
        }
        $scope.Sadd = function () {
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                key = "skey"
                value = $scope.count
            } else {
                splits = $scope.inputest.split(";")
                key = splits[0]
                value = splits[1]
            }
            client.sadd($scope.sid, $scope.bid, key, value, function (data) {
                $scope.appstatus = "sadd ok num=" + data
                debug.log($scope.appstatus);
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "sadd error"
                $scope.$apply()
            })
        }
        $scope.sdiff = function () {
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                key1 = "skey"
                key2 = "skey1"
            } else {
                splits = $scope.inputest.split(";")
                key1 = splits[0]
                key2 = splits[1]
            }
            client.sdiff($scope.sid, $scope.bid, key1, key2, function (list) {
                $scope.appstatus = "sdiff ok num=" + list.length
                debug.log(list);
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "sdiff error"
                $scope.$apply()
            })
        }
        $scope.sinter = function () {
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                key1 = "skey"
                key2 = "skey1"
            } else {
                splits = $scope.inputest.split(";")
                key1 = splits[0]
                key2 = splits[1]
            }
            client.sinter($scope.sid, $scope.bid, key1, key2, function (list) {
                $scope.appstatus = "sinter ok num=" + list.length
                debug.log(list);
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "sinter  error"
                $scope.$apply()
            })
        }
        $scope.sunion = function () {
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                key1 = "skey"
                key2 = "skey1"
            } else {
                splits = $scope.inputest.split(";")
                key1 = splits[0]
                key2 = splits[1]
            }
            client.sunion($scope.sid, $scope.bid, key1, key2, function (list) {
                $scope.appstatus = "sinter ok num=" + list.length
                debug.log(list);
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "sinter  error"
                $scope.$apply()
            })
        }
        /*
        $scope.rollback = function () {
        client.begin($scope.sid, $scope.bid, function () {
        client.set($scope.sid, $scope.bid, "key", $scope.count, function () {                
        $scope.appstatus = "rollback  set ok"
        debug.log($scope.appstatus);
        $scope.$apply()
        client.rollback($scope.sid, $scope.bid)
        }, function (name, err) {
        debug.log(err);
        $scope.appstatus = "rollback set error"
        $scope.$apply()
        client.rollback($scope.sid, $scope.bid)
        })
        }, function (name, err) {
        debug.log(err);
        $scope.appstatus = "begin error"
        $scope.$apply()
        })
        }*/
        $scope.exit = function () {
            client.exit(function () {
                $scope.appstatus = "stopped"
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = err
                $scope.$apply()
            })
        }
        $scope.restart = function () {
            client.restart(function () {
                $scope.appstatus = "stopped"
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = err
                $scope.$apply()
            })
        }
        $scope.add = function () {
            $scope.count = $scope.count + 1
        }
        $scope.lpush = function () {
            var msg = new Message()
            msg.from = "from"
            msg.to = "to"
            msg.num = $scope.count
            client.lpush($scope.sid, $scope.bid, "keypush", msg, msg, function (data) {
                //$scope.bid = data[0]
                $scope.appstatus = "lpush ok num" + data
                debug.log($scope.appstatus);
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "lpush error"
                $scope.$apply()
            })
        }
        $scope.lpop = function () {
            client.lpop($scope.sid, $scope.bid, "keypush", function (data) {
                //$scope.bid = data[0]
                if (data != null) {
                    $scope.appstatus = "lpop ok.value.num=[" + data.num + "]"
                } else {
                    $scope.appstatus = "lpop ok.value.num=[empty]"
                }
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "lpop error"
                $scope.$apply()
            })
        }
        $scope.rpush = function () {
            var msg = new Message()
            msg.from = "from"
            msg.to = "to"
            msg.num = $scope.count
            client.rpush($scope.sid, $scope.bid, "keypush", msg, function (data) {
                //$scope.bid = data[0]
                $scope.appstatus = "rpush ok num" + data
                debug.log($scope.appstatus);
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "rpush error"
                $scope.$apply()
            })
        }
        $scope.rpop = function () {
            client.rpop($scope.sid, $scope.bid, "keyrpush", function (data) {
                //$scope.bid = data[0]            
                if (data != null) {
                    $scope.appstatus = "rpop ok.value.num=[" + data.num + "]"
                } else {
                    $scope.appstatus = "rpop ok.value.num=[empty]"
                }
                $scope.$apply()
                debug.log("rop return" + $scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "rpop error"
                $scope.$apply()
            })
        }
        $scope.lrange = function () {
            client.lrange($scope.sid, $scope.bid, "keypush", 0, 10, function (data) {
                for (i = 0; i < data.length; i++) {
                    debug.log("lrange =", data[i])
                }
                $scope.appstatus = "lrange ok. ret=[" + data[0] + "]"
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "lrange error"
                $scope.$apply()
            })
        }
        $scope.sendmsg = function () {
            debug.log("sendmsg")

            var msg = new Message()
            msg.from = $scope.bid
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                $scope.appstatus = "sendmsg to self"
                msg.to = $scope.bid
            } else {
                msg.to = $scope.inputest
            }
            msg.Msg = "msg"
            msg.Data = $scope.count
            $scope.appstatus = "sendmsg to " + msg.to
            client.sendmsg($scope.sid, msg, function () {
                debug.log($scope.appstatus + " ok")
                $scope.appstatus = $scope.appstatus + " ok"
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "sendmsg error"
                $scope.$apply()
            })
        }
        var showmsg
        $scope.readmsg = function () {
            debug.log("readmsg")
            $scope.appstatus = "readmsg begin"
            if (showmsg == null) {
                showmsg = function () {
                    debug.log("showmsg ")
                    client.readmsg($scope.sid, function (msgs) {
                        debug.log("readmsg ok", msgs)
                        $scope.appstatus = "readmsg ok:" + msgs.length
                        if (msgs.length > 0) {
                            $scope.appstatus = $scope.appstatus + "data:" + msgs[0].Msg
                        }
                        $scope.$apply()
                        if (showmsg != null) {
                            showmsg()
                        }
                    }, function (name, err) {
                        debug.log(err);
                        $scope.appstatus = "sendmsg error"
                        $scope.$apply()
                    })
                }
                showmsg()
            }
        }
        $scope.stopreadmsg = function () {
            showmsg = null
        }
        var fpullmsg
        $scope.pullmsg = function () {
            debug.log("pullmsg")
            $scope.appstatus = "pullmsg begin"
            if (fpullmsg == null) {
                fpullmsg = function () {
                    debug.log("fpullmsg ")
                    client.pullmsg($scope.sid, 60, function (msg) {
                        debug.log("pullmsg ok", msg)
                        if (msg != null) {
                            $scope.appstatus = "pullmsg ok:" + msg.msg
                            $scope.$apply()
                            if (msg.msg == "Other user login") {
                                return
                            }
                        }
                        if (fpullmsg != null) {
                            fpullmsg()
                        }
                    }, function (name, err) {
                        debug.log(err);
                        $scope.appstatus = "pullmsg error"
                        $scope.$apply()
                    })
                }
                fpullmsg()
            }
        }
        $scope.pullmsg()
        $scope.stopullmsg = function () {
            fpullmsg = null
        }

        $scope.invite = function () {
            debug.log("invite")
            $scope.appstatus = "invite begin"
            //debug.log($scope.inputest)
            client.invite($scope.sid, $scope.inputest, function (txt) {
                debug.log("invite ok", txt)
                $scope.appstatus = "invite ok:"
                $scope.inputest = txt
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "invite error"
                $scope.$apply()
            })
        }
        $scope.accept = function () {
            debug.log("accept")
            $scope.appstatus = "accept begin"
            //debug.log($scope.inputest)        
            client.accept($scope.sid, $scope.inputest, function () {
                debug.log("accept ok")
                $scope.appstatus = "accept ok:"
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "accept error"
                $scope.$apply()
            })
        }
        $scope.veni = function () {
            //veni函数的参数已经变了，仅限于主机之间的通讯
            debug.log("veni函数的参数已经变了，仅限于主机之间的通讯,测试案例要重写了")
            return
            $scope.appstatus = "accept begin"
            //debug.log($scope.inputest)        
            hid = "-N4gYKVkB6T5kTsRKiVY5AnTIPyfaY-Zh1itfrQxFHA"
            client.veni($scope.sid, hid, $scope.inputest, function () {
                debug.log("veni ok")
                $scope.appstatus = "veni ok:"
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "veni error"
                $scope.$apply()
            })
        }
        function getNearby(nid) {
            client.getvar($scope.sid, "usernearby", nid, function (data) {
                var len = 0
                if (data != null) {
                    len = data.length
                }
                for (i = 0; i < len; i++) {
                    debug.log(data[i])
                }
                $scope.appstatus = "get nearby friend len=[" + len + "]"
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "get nearby error"
                $scope.$apply()
            })
        }
        $scope.nearby = function () {
            getNearby("")
            for (i = 0; i < onlineHost.length; i++) {
                getNearby(onlineHost[i].id)
            }
        }
        $scope.checkbids = function () {
            /*bid = twid
            if ($scope.inputest != null && $scope.inputest.length > 0) {
            bid = $scope.inputest
            }*/
            client.getvar($scope.sid, "checkbids", "6OkFeZw0sk3p0S0UrAPX0TJfhpabpgNIr-IgVGoRiZQ", function (data) {
                var len = 0
                if (data != null) {
                    len = data.length
                }
                for (i = 0; i < len; i++) {
                    debug.log(data[i])
                }
                $scope.appstatus = "checkbids find count=[" + len + "]"
                $scope.$apply()
                debug.log($scope.appstatus);
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "checkbids error"
                $scope.$apply()
            })
        }
        $scope.upload = function () {
            var x = document.getElementById("fileName").files[0];
            var r = new FileReader();
            r.onloadend = function (e) {
                debug.log(e.target.result.byteLength);
                client.setdata($scope.sid, $scope.bid, e.target.result, function (data) {
                    $scope.resid = data
                    $scope.appstatus = "upload ok"
                    debug.log("upload ok")
                    client.getgshorturlkey($scope.sid, $scope.bid, "", data, function (k) {
                        debug.log("getgshorturlkey ok. k=", k);
                        debug.log(k);
                    }, function (name, err) {
                        debug.log("getshorturlkey error", err);
                        $scope.appstatus = "getgshorturlkey error"
                        $scope.$apply()
                    })
                    debug.log("upload ok 2")
                    $scope.$apply()
                    debug.log($scope.appstatus);
                }, function (name, err) {
                    debug.log(err);
                    $scope.appstatus = "upload error"
                    $scope.$apply()
                })
            }
            r.readAsArrayBuffer(x);
            debug.log("good");
        }
        $scope.getswarms = function () {
            debug.log("getswarms");
            client.getvar($scope.sid, "swarms", function (swarms) {
                debug.log(swarms)
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "getvar swarms error"
                $scope.$apply()
            }
       )
        }
        $scope.getswarm = function () {
            var bid = $scope.bid
            if ($scope.inputest != null && $scope.inputest.length > 0) {
                bid = $scope.inputest
            }
            debug.log("getswarm bid=", bid);
            client.getvar($scope.sid, "swarm", bid, function (swarm) {
                debug.log(swarm)
                debug.log("Token:", swarm.token)
                for (i = 0; i < swarm.nodes.length; i++) {
                    debug.log("host[", i, "]id=", swarm.nodes[i].id, ",url=", swarm.nodes[i].url)
                }
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "getvar swarm error"
                $scope.$apply()
            }
       )
        }
        $scope.setip = function () {
            var bid = $scope.bid
            var ip = $scope.inputest
            client.sethostip($scope.sid, ip, function (name, err) {
                debug.log(err);
                $scope.appstatus = "test error"
                $scope.$apply()
            })
        }
        $scope.checkip = function () {
            debug.log("proxyget")
            client.proxyget($scope.sid, "http://1111.ip138.com/ic.asp", function (strbody) {
                //debug.log(strbody)                      
                ip = getipfromip368(strbody)
                if (ip.length > 0) {
                    client.sethostip($scope.sid, ip, function () {
                        debug.log("sethostio ok ip:" + ip)
                    })
                }
            }, function (name, err) {
                debug.log(name + ":" + err);
            })

        }
        $scope.relogin = function () {
            debug.log("relogin")
            $scope.bid = $scope.inputest
            Login($scope)
        }

        $scope.pptlogin = function () {
            debug.log("pptlogin")
            $scope.ppt = $scope.inputest
            Login($scope)
        }
        $scope.getppt = function () {
            debug.log("getppt")
            client.getvar($scope.sid, "ppt", function (ppt) {
                debug.log("ppt=" + ppt)
                $scope.inputest = ppt
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "relogin error"
                $scope.$apply()
            }
       )
        }
        /*
        $scope.gethostid = function () {
        debug.log("gethostid")
        client.getvar($scope.sid, "hostid", function (hostid) {
        debug.log("hostid=" + hostid)
        $scope.inputest = hostid
        $scope.$apply()
        }, function (name, err) {
        debug.log(err);
        $scope.appstatus = "relogin error"
        $scope.$apply()
        }
        )
        }*/
        $scope.getdns = function () {
            debug.log("getdns")
            client.getvar($scope.sid, "dns", function (dns) {
                debug.log("dns ", dns)
                for (id in dns) {
                    debug.log("id=", id, ";url=", dns[id])
                }
                $scope.inputest = "get dns ok"
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
                $scope.appstatus = "relogin error"
                $scope.$apply()
            }
       )
        }
        $scope.onlinehost = function () {
            debug.log("onlinehost")
            client.getvar($scope.sid, "onlinehost", function (data) {
                debug.log("onlinehost:", data)
            }, function (name, err) {
                debug.log(err);
            });
        }
        $scope.addhost = function () {
            debug.log("addhost")
            splits = $scope.inputest.split(";")
            client.act($scope.sid, "addhost", splits[0], splits[1], function () {
                debug.log("addhost ok")
            }, function (name, err) {
                debug.log(err);
            });
        }
        $scope.removehost = function () {
            debug.log("removehost")
            hid = $scope.inputest
            client.act($scope.sid, "removehost", hid, function () {
                debug.log("removehost ok")
            }, function (name, err) {
                debug.log(err);
            });
        }
        $scope.copyuser = function () {
            debug.log("copyuser ...")
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                debug.log("inputtest null")
                hostid = thid;
                wid = twid;
            } else {
                debug.log("inputtest =", $scope.inputest)
                splits = $scope.inputest.split(";")
                hostid = splits[0];
                wid = splits[1];
            }

            client.act($scope.sid, "copyuser", hostid, wid, function () {
                debug.log("copyuser ok")
            }, function (name, err) {
                debug.log(err);
            });
        }
        $scope.removeuser = function () {
            debug.log("removeuser")
            uid = $scope.inputest
            client.act($scope.sid, "removeuser", uid, function () {
                debug.log("removeuser ok")
            }, function (name, err) {
                debug.log(err);
            });
        }
        $scope.copyswarm = function () {
            debug.log("copyswarm")
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                hostid = thid;
                wid = twid;
            } else {
                splits = $scope.inputest.split(";")
                hostid = splits[0];
                wid = splits[1];
            }

            client.act($scope.sid, "copyswarm", hostid, wid, function () {
                debug.log("copyswarm ok")
            }, function (name, err) {
                debug.log(err);
            });
        }

        $scope.syncswarm = function () {
            debug.log("syncswarm")
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                hostid = thid;
                bid = twid;
            } else {
                splits = $scope.inputest.split(";")
                hostid = splits[0];
                bid = splits[1];
            }

            client.act($scope.sid, "syncblock", hostid, bid, "1", function () {
                debug.log("syncswarm ok")
            }, function (name, err) {
                debug.log(err);
            });
        }
        $scope.checkswarm = function () {
            debug.log("check swarm")
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                hostid = thid;
                wid = twid;
            } else {
                splits = $scope.inputest.split(";")
                hostid = splits[0];
                wid = splits[1];
            }

            client.act($scope.sid, "checkswarm", hostid, wid, function () {
                debug.log("checkswarm ok")
            }, function (name, err) {
                debug.log(err);
            });
        }
        $scope.removeswarm = function () {
            debug.log("removeswarm")
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                hostid = thid;
                wid = twid;
            } else {
                splits = $scope.inputest.split(";")
                hostid = splits[0];
                wid = splits[1];
            }
            client.act($scope.sid, "removeswarm", wid, function () {
                debug.log("removeswarm ok")
            }, function (name, err) {
                debug.log(err);
            });
        }
        $scope.removeswarmdata = function () {
            debug.log("removeswarmdata")
            /*if ($scope.inputest == null || $scope.inputest.length == 0) {
            hostid = thid;
            wid = twid;
            } else {
            splits = $scope.inputest.split(";")
            hostid = splits[0];
            wid = splits[1];
            }*/
            client.act($scope.sid, "removeswarmdata", $scope.bid, function () {
                debug.log("removeswarmdata ok")
            }, function (name, err) {
                debug.log(err);
            });
        }
        $scope.copyallusers = function () {
            debug.log("copyallusers")
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                hostid = thid;
            } else {
                hostid = $scope.inputest;
            }

            client.act($scope.sid, "copyallusers", hostid, function () {
                debug.log("copyallusers ok")
            }, function (name, err) {
                debug.log(err);
            });
        }
        $scope.copyallswarm = function () {
            debug.log("copyallswarm")
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                hostid = thid;
            } else {
                hostid = $scope.inputest;
            }

            client.act($scope.sid, "copyallswarm", hostid, function () {
                debug.log("copyallswarm ok")
            }, function (name, err) {
                debug.log(err);
            });
        }
        $scope.copyallswarm2 = function () {
            debug.log("copyallswarm2")
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                hostid = thid;
            } else {
                hostid = $scope.inputest;
            }

            client.act($scope.sid, "copyallswarm", hostid, function () {
                debug.log("copyallswarm ok")
            }, function (name, err) {
                debug.log(err);
            });
        }
        $scope.showkeys = function () {
            if ($scope.inputest == null || $scope.inputest.length == 0) {
                //bid = twid;
                bid = $scope.bid
            } else {
                bid = $scope.inputest;
            }
            debug.log("showkeys bid=" + bid)
            client.getvar($scope.sid, "keys", bid, function (keys) {
                for (var k in keys) {
                    debug.log("showkeys k", keys[k]);
                }
            }, function (name, err) {
                debug.log(err);
            });
        }
        $scope.backinfo2friends = function () {
            debug.log("backinfo2friends")
            client.act($scope.sid, "backinfo2friends", function () {
                debug.log("backinfo2friends ok")
            }, function (name, err) {
                debug.log(err);
            });
        }
        $scope.createinvcode = function () {
            debug.log("createinvcode")
            client.createinvcode($scope.sid, $scope.bid, 24 * 3600, 20, 40, function (invcode) {
                debug.log("createinvcode key=", invcode)
                $scope.inputest = invcode
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
            });
        }
        $scope.updateinvcode = function () {
            debug.log("updateinvcode")
            invcode = $scope.inputest
            client.updateinvcode($scope.sid, $scope.bid, invcode, 32 * 3600, 20, 60, function (invcode) {
                debug.log("updateinvcode", "ok")
                //$scope.inputest = invcode
                //$scope.$apply()
            }, function (name, err) {
                debug.log(err);
            });
        }
        $scope.getinvcode = function () {
            debug.log("getinvcode")
            invcode = $scope.inputest
            client.getinvcodeinfo($scope.sid, $scope.bid, invcode, function (info) {
                debug.log("getInvCodeInfo: validity=", info.validity, "friendcount=", info.friendCount, "money=", info.money)
            }, function (name, err) {
                debug.log(err);
            })
        }
        $scope.deleteinvcode = function () {
            debug.log("getinvcode")
            invcode = $scope.inputest
            client.deleteinvcode($scope.sid, $scope.bid, invcode, function (info) {
                debug.log("deleteinvcode ok")
                $scope.inputest = "deleteinvcode ok"
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
            })
        }
        $scope.setinvtemplate = function () {
            debug.log("setInvTemplate")
            invcode = $scope.inputest
            temp = "test temp userid=%%userid%%;userppt=%%ppt%%"
            client.setinvtemplate($scope.sid, $scope.bid, invcode, temp, function (info) {
                debug.log("setInvTemplate ok")
            }, function (name, err) {
                debug.log(err);
            })
        }
        $scope.uploadinvtemplate = function () {
            var x = document.getElementById("fileName").files[0];
            var r = new FileReader();
            r.onloadend = function (e) {
                debug.log(e.target.result.byteLength);
                invcode = $scope.inputest
                client.setinvtemplate($scope.sid, $scope.bid, invcode, e.target.result, function (data) {
                    debug.log("uploadinvtemplate ok")
                }, function (name, err) {
                    debug.log(err);
                    $scope.appstatus = "uploadinvtemplate error"
                    $scope.$apply()
                })
            }
            r.readAsArrayBuffer(x);
            debug.log("good");
        }
        $scope.getinvtemplate = function () {
            debug.log("getInvTemplate")
            invcode = $scope.inputest
            client.getinvtemplate($scope.sid, $scope.bid, invcode, function (temp) {
                debug.log("getInvTemplate temp=", temp)
            }, function (name, err) {
                debug.log(err);
            })
        }
        $scope.getappdownloadkey = function () {
            debug.log("getappdownloadkey")
            invcode = $scope.inputest
            client.getappdownloadkey($scope.sid, $scope.bid, invcode, "6OkFeZw0sk3p0S0UrAPX0TJfhpabpgNIr-IgVGoRiZQ", "Demo", function (key) {
                debug.log("getappdownloadkey key=", key)
                $scope.resid = key
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
            })
        }
        $scope.getappdownloadkeybymap = function () {
            debug.log("getappdownloadkeybymap")
            invcode = $scope.inputest
            info = {
                "AppBid": "6OkFeZw0sk3p0S0UrAPX0TJfhpabpgNIr-IgVGoRiZQ",
                "AppName": "Demo",
                "test": "test"
            }

            //"6OkFeZw0sk3p0S0UrAPX0TJfhpabpgNIr-IgVGoRiZQ", "Demo", 
            client.getappdownloadkeybymap($scope.sid, $scope.bid, invcode, info, function (key) {
                debug.log("getappdownloadkey key=", key)
                $scope.resid = key
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
            })
        }
        $scope.getlshorturlkey = function () {
            debug.log("getlshorturlkey")
            bid = "6OkFeZw0sk3p0S0UrAPX0TJfhpabpgNIr-IgVGoRiZQ"
            tp = ""
            name = "LeitherApi"
            ver = "21"
            client.getlshorturlkey($scope.sid, bid, tp, name, ver, 300, function (k) {
                debug.log("getgshorturlkey ok. k=", k);
                debug.log(k);
            }, function (name, err) {
                debug.log("getshorturlkey error", err);
                $scope.appstatus = "getgshorturlkey error"
                $scope.$apply()
            })
            /*
            invcode = $scope.inputest
            info = {
                "AppBid": "6OkFeZw0sk3p0S0UrAPX0TJfhpabpgNIr-IgVGoRiZQ",
                "AppName": "Demo",
                "test": "test"
            }

            //"6OkFeZw0sk3p0S0UrAPX0TJfhpabpgNIr-IgVGoRiZQ", "Demo", 
            client.getappdownloadkeybymap($scope.sid, $scope.bid, invcode, info, function (key) {
                debug.log("getappdownloadkey key=", key)
                $scope.resid = key
                $scope.$apply()
            }, function (name, err) {
                debug.log(err);
            })*/
        }
        $scope.cleardb = function () {
            debug.log("cleardb")
            client.act($scope.sid, "cleardb", function () {
                debug.log("cleardb ok ")
            }, function (name, err) {
                debug.log("cleardb fail" + err);
            })
        }

        $scope.test = function () {
            debug.log("test ")
            client.test($scope.sid, $scope.bid, function () {
                debug.log("test ok");
            }, function (name, err) {
                debug.log(err);
            });
            //查方超提的bug
            //OuZUdgbKkjlk7vJ3Nweq8gf - Z1oLk4CJsFDweemzlUI
            //OuZUdgbKkjlk7vJ3Nweq8gf-Z1oLk4CJsFDweemzlUI
            //IWlFvCReDsVnPOi1scub2zCIMlTjuqqKXG8-MBC78NI
            /*
            debug.log("hget sid:" + $scope.sid + "bid:" + $scope.bid);
            client.hget($scope.sid, "IWlFvCReDsVnPOi1scub2zCIMlTjuqqKXG8-MBC78NI", "_app_user_information", "IWlFvCReDsVnPOi1scub2zCIMlTjuqqKXG8-MBC78NI", function (data) {
            //$scope.bid = data[0]
            debug.log(data[1]);
            $scope.appstatus = "hget ok.value=[" + data[1] + "]"
            $scope.$apply()
            debug.log($scope.appstatus);
            }, function (name, err) {
            debug.log(err);
            $scope.appstatus = "hget error"
            $scope.$apply()
            })*/
            /*
            client.hget($scope.sid, "IWlFvCReDsVnPOi1scub2zCIMlTjuqqKXG8-MBC78NI", "_app_user_information", "OuZUdgbKkjlk7vJ3Nweq8gf-Z1oLk4CJsFDweemzlUI", function (data) {
            //$scope.bid = data[0]
            debug.log(data[1]);
            $scope.appstatus = "hget ok.value=[" + data[1] + "]"
            $scope.$apply()
            debug.log($scope.appstatus);
            }, function (name, err) {
            debug.log(err);
            $scope.appstatus = "hget error"
            $scope.$apply()
            })*/
            /*   
            bid = ""
            client.del($scope.sid, $scope.bid, key, function (data) {
            $scope.appstatus = "del ok.ret=[" + data + "]"
            $scope.$apply()
            debug.log($scope.appstatus);
            }, function (name, err) {
            debug.log(err);
            $scope.appstatus = "del error"
            $scope.$apply()
            })
            */
            /*
            //97测试
            //hid = "-8uaVF3ERM1aQoTOL4hR7IrCGP7nb0rvYz6TCHMRp94"
            ////bid = "ohAwmtVgt2HOc6c996-YG_QFIQddY6s68jholsGwi0o"
            //bid = "Er4zixs8Pqa0fA6n0OTIRzWs7khC7tP1UCmQpIGu6hU"
            //248测试
            //hid = "gwnasaDG3yszlbzWPcTdpz-gcKxOGrUWkEhdppSRHyg"
            //bid = "vGvU-_cL04VA452aTE83A8a-kDf5gUxMX4K5WHbHQ3M"
            //248:02
            //hid = "76YfAdPmTgudUvHjnmrqHW5WBobC5HitFazW9J2mQGM"
            //bid = "yTZCl7S4jx1NWoOT9isSdX51lNQzOvgsJyKYtb_1wKk"
            //aliyun
            hid = "D1DG3LKrjJV1--NAjBq8t9vx0gdo-wcnzsv1BBANJPY"        
            //bid = "gVQXZWd0RgNuB-5R5tX1gxhOb200TdwEVs-LHbLXpLo" //weibo的用户id
            bid ="-8uaVF3ERM1aQoTOL4hR7IrCGP7nb0rvYz6TCHMRp94"
            client.act($scope.sid, "copyuser", hid, bid, function () {
            debug.log("copyuser ok")
            client.act($scope.sid, "copyswarm", hid, bid, function () {
            debug.log("copyswarm ok")
            }, function (name, err) {
            debug.log(err);
            });
            }, function (name, err) {
            debug.log(err);
            });    
            */
        }
    })
}
function InitErrFunc() {
    debug.log("initerrfunc")
    setErrFunc("login", function (e) {
        debug.log("login error enter", e)
        //错误原因，ip错，帐号错
        le = new LeitherErr(e);
        debug.log("login error 2", le)
        if (le.ID == 14) {
            debug.log("login user invalid")
            debug.log("register...");
            G.api.register(function (data) {
                saveLoginInfo(data, "")
                RunAppByIP("")
                debug.log("register userid=", data);
                $scope.bid = data
                $scope.$apply()
            }, function (e) {
                    debug.log(e);
                    $scope.appstatus = "register error"
                    $scope.$apply()
            })    
        }
    })
    errReply()
}
//InitErrFunc()
function main() {
    var cs = document.createElement("style");
    cs.rel = "stylesheet";
    cs.type = "text/css";
    cs.textContent = css;
    document.getElementsByTagName("head")[0].appendChild(cs);

    debug.log("main run 222")
    app = angular.module("demo", [])
    var div = document.getElementById("LeitherBody");
    div.innerHTML = mainhtml
    app.controller("UserInfoCtrl", ["$scope", UserInfoCtrl]);
    angular.bootstrap(document, ['demo']);
}
