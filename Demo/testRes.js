var mainhtml = `
<div ng-controller="UserInfoCtrl">          
      	<p class="firstP">Leither 版本号：{{version}}</p>      	        
        <p><a href="{{host}}getres?sid={{sid}}&bid={{bid}}&key={{resid}}">getres</a></p>
        <p>session id：{{sid}} </p>
        <p>bid:{{bid}}</p>
        <p>status:{{appstatus}}</p>
         File Upload: Select a file to upload: <br /> 
        <form name="leitherForm" ng-submit="upload()" enctype="multipart/form-data" novalidate>              
            <input type="file" id="fileName" name="uploadfile" />  
            <input type="hidden" name="token" value="{{.}}"/>  
            <input type="submit" value="upload" />             
        </form><br />         
        input: <input type="text" ng-model="inputest">
        
        <p>
        <button ng-click="onlinehost()">onlinehost</button>
        <button ng-click="addhost()">addhost</button>
        <button ng-click="removehost()">removehost</button>
        <button ng-click="copyuser()">copyuser</button>
        <button ng-click="copyallusers()">copyallusers</button>
        <button ng-click="removeuser()">removeuser</button>
        <button ng-click="copyswarm()">copyswarm</button>
        <button ng-click="checkswarm()">checkswarm</button>
        <button ng-click="checkbids()">checkbids</button>
        <button ng-click="copyallswarm()">copyallswarm</button>
		<button ng-click="copyallswarm2()">copyallswarm2</button>
        <button ng-click="removeswarm()">removeswarm</button>
        <button ng-click="removeswarmdata()">removeswarmdata</button>    
        <button ng-click="syncswarm()">syncswarm</button>    
        <button ng-click="invite()">发邀请</button>
        <button ng-click="accept()">接受邀请</button>  
        <button ng-click="veni()">veni</button>
        <button ng-click="setip()">setip</button>
        <button ng-click="checkip()">checkip</button>
		<button ng-click="getppt()">getppt</button>  
        <!--button ng-click="gethostid()">gethostid</button-->  
        <button ng-click="getdns()">getdns</button>
        <button ng-click="getswarms()">getswarms</button>         
        <button ng-click="getswarm()">getswarm</button>   
        <button ng-click="relogin()">relogin</button>                
        <button ng-click="pptlogin()">pptlogin</button>  
        <button ng-click="backinfo2friends()">backinfo2friends</button>       
        </p>              
        <p>
        <button ng-click="showkeys()">showkeys</button>
        <button ng-click="sendmail()">sendmail</button>
        <button ng-click="addfriend()">添加好友</button>
        <button ng-click="nearby()">附近好友</button>        
        <button ng-click="test()">测试</button>
         <button ng-click="cleardb()">清库</button>
        <button ng-click="exit()">退出</button>
           <button ng-click="restart()">重启</button></p>
         <p>
        <button ng-click="createinvcode()">生成注册码</button>
        <button ng-click="getinvcode()">获取注册码信息</button>
        <button ng-click="updateinvcode()">更新注册码</button>        
        <button ng-click="deleteinvcode()">删除注册码</button>
        <button ng-click="setinvtemplate()">设置模板</button>
        <button ng-click="uploadinvtemplate()">上传模板</button>
        <button ng-click="getinvtemplate()">查看模板</button>
        <button ng-click="getappdownloadkey()">获取应用下载key</button>
        <button ng-click="getappdownloadkeybymap()">获取应用下载key2</button>
        <button ng-click="getlshorturlkey()">getlshorturlkey</button>
        </p>

        <p><button ng-click="set()">set</button>   
        <button ng-click="get()">get</button> 
        <button ng-click="del()">del</button>
        <button ng-click="Expire()">Expire</button>
         <button ng-click="setdata()">setdata</button></p>
        <p><button ng-click="sendmsg()">发消息</button>
        <button ng-click="readmsg()">收消息</button>
         <button ng-click="stopreadmsg()">停止接收</button>
         <button ng-click="pullmsg()">pullmsg</button>
         <button ng-click="stopullmsg()">停止</button>
        </p>
       
        <p><button ng-click="zadd()">zadd</button>   <button ng-click="zrange()">zrange</button>
        <button ng-click="zrangebyscore()">zrangebyscore</button></p>            
        <p><button ng-click="hmclear()">hmclear</button>   
        <button ng-click="hset()">hset</button>   <button ng-click="hget()">hget</button>
        <button ng-click="hmset()">hmset</button> <button ng-click="hmget()">hmget</button>
        <button ng-click="hgetall()">hgetall</button>  <button ng-click="hlen()">hlen</button>   
        <button ng-click="hkeys()">hkeys</button>
        </p>
        <!--  p><button ng-click="rollback()">rollback</button></p-->
        <p><button ng-click="lpush()">lpush</button>   <button ng-click="lpop()">lpop</button>
        <button ng-click="rpush()">rpush</button>   <button ng-click="rpop()">rpop</button>
        <button ng-click="lrange()">lrange</button> <button ng-click="lset()">lset</button>
        <button ng-click="lindex()">lindex</button> <button ng-click="llen()">llen</button>
        </p>  
        <p>
        <button ng-click="Sadd()">sadd</button> <button ng-click="scard()">scard</button>
        <button ng-click="Sclear()">Sclear</button> <button ng-click="sdiff()">sdiff</button>
        <button ng-click="sinter()">sinter</button> <button ng-click="Smclear()">Smclear</button>
        <button ng-click="Smembers()">Smembers</button> <button ng-click="Srem()">Srem</button>
        <button ng-click="sunion()">sunion</button>
        </p>             
        <p><button ng-click="add()" ng-init="count=0">Increment</button>
        <span>  count: {{count}}</span></p>

        <p>当前主机ID：{{hid}}</p>
		<p>当前主机URL：{{hurl}}</p>
        <p>当前主机bids：</p>
        <li ng-repeat="(bid,info) in hostbids">
            {{bid}}
      		{{info}}            
        </li>
        <p>当前用户的消息：{{msg.num}}</p>
		<p>当前用户的id：{{user.id}}</p>
        <p>当前用户的Name：{{user.name}}</p>
        <!--p>当前用户的地址：{{user.url}}</p-->
        <p>当前用户的好友：</p>
	    <li ng-repeat="fri in user.friends">            
      		{{fri.id}}
            <p>{{fri.name}}</p>
    		<!--p>{{fri.url}}</p-->    
        </li>
</div>
`
var css = `
* { margin:0;padding:0;border:none;}
html{height:100%;}
body { font-family:Helvetica,Arial,sans-serif;font-size:16px;color:#d2d6de;text-align:center;background:#2e3132;line-height:1.2;height:100%;}
p { margin:10px 0; }
h1 { font-size:20px;color:#fff;font-weight:normal;padding:20px 0;}
h2 { color:#fff;margin-bottom:5px;}

.container { 
	margin:0 auto;
	width: 100%;
	height: 100%;
	display:block;}

/*scan confirm*/
.confirm a{
	display:block;
	text-decoration:none;
	color:#fff;
	padding:9px 0px;
}

.confirm{
	text-align:center;
	color:#fff;
	margin:0px;
	padding:27px 35px 0px;
}
.section{
	margin:0px auto;
}
.headerIcon{
	height:131px;
	background:url(../images/Connectkeyboad_icon@1x.png) no-repeat center;
	margin-bottom:25px;
}

.sectionPannel{
	margin:0px;
	margin-bottom:25px;
	padding:0px;
}
.sectionPannel .sectionContent{
	padding:5px 0px;
}
.sectionPannel .sectionContent .firstP{
	margin-bottom:5px;
}
.sectionPannel .sectionContent .lastP{
	margin-top:0px;
}
.confirm .greenBtn{
	font-size:16px;
	padding: 9px 0px;
	color: white;
	display: block;
	text-align: center;
	width: 100%;
	background: #04BE02;
	border: 1px solid #03B401;
	-moz-border-radius:5px;
	-webkit-border-radius:5px;
	border-radius:5px;
	margin-bottom:15px;
	background:-webkit-linear-gradient(#04BE02, #04BE02);
}
.confirm .redBtn{
	color: #FFF;
	font-size:16px;
	border: 1px solid #DE4949;
	background-color: #F24D4D;
	-moz-border-radius:5px;
	-webkit-border-radius:5px;
	border-radius:5px;
	margin-bottom:29px;
	margin-top:15px;
}

/* other */
.iconTitle { background-repeat:no-repeat;background-position:0 0;width:120px;height:120px; }
.iconTitleWebWx { background-image:url(../images/connectkeyboad_icon.png);width:121px;height:126px;margin-top:40px;  }
.iconTitleErrorCommon { background-image:url(../images/icon_login_failure_ios7@1x.png); }
.iconTitleErrorQrCode { background-image:url(../images/icon_login_qrcord_ios7@1x.png); }
.iconTitleCloseacct { background-image:url(../images/DeleteAccount@1x.png); margin: 15px 0 5px 0}
.iconTitleErrorLeakIe { background-image:url(../images/webwechatlogin_ieicon.png); }
.header {padding-top: 20px;}

@media all and (-webkit-min-device-pixel-ratio: 2) {
	.headerIcon{
		background-image:url(../images/Connectkeyboad_icon@2x.png);
		-webkit-background-size:126px 131px;
		background-size:126px 131px;
	}
	.iconTitleWebWx { background-image:url(../images/connectkeyboad_icon.png);width:121px;height:126px;margin-top:40px;  }
	.iconTitleErrorCommon { 
		background-image:url(../images/icon_login_failure_ios7@2x.png); 
		-webkit-background-size:120px;
		background-size:120px;
	}
	.iconTitleErrorQrCode { 
		background-image:url(../images/icon_login_qrcord_ios7@2x.png); 
		-webkit-background-size:120px;
		background-size:120px;
	}
	.iconTitleCloseacct { 
		background-image:url(../images/DeleteAccount@2x.png); 
		-webkit-background-size:126px 131px;
		background-size:126px 131px;
	}
}
@media all and (-webkit-min-device-pixel-ratio: 1.5) {
	.headerIcon{
		background-image:url(../images/Connectkeyboad_icon@2x.png);
		-webkit-background-size:126px 131px;
		background-size:126px 131px;
	}
	.iconTitleWebWx { background-image:url(../images/connectkeyboad_icon.png);width:121px;height:126px;margin-top:40px;  }
	.iconTitleErrorCommon { 
		background-image:url(../images/icon_login_failure_ios7@2x.png); 
		-webkit-background-size:120px;
		background-size:120px;
	}
	.iconTitleErrorQrCode { 
		background-image:url(../images/icon_login_qrcord_ios7@2x.png); 
		-webkit-background-size:120px;
		background-size:120px;
	}
	.iconTitleCloseacct { 
		background-image:url(../images/DeleteAccount@2x.png); 
		-webkit-background-size:126px 131px;
		background-size:126px 131px;
	}
}
`