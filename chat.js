var WebSocketServer = require('ws').Server
, http = require('http')
, express = require('express')
, path = require('path')
, app = express();

app.use(express.static(__dirname + '/'));
var server = http.createServer(app);
var wss = new WebSocketServer({server:server});

//Websocket接続を保存しておく
var connections = [];

//接続時
wss.on('connection', function (ws) {
    //配列にWebSocket接続を保存
    connections.push(ws);
    //切断時
    ws.on('close', function () {
        connections = connections.filter(function (conn, i) {
            return (conn === ws) ? false : true;
        });
    });
    //メッセージ送信時
    ws.on('message', function (message) {
        log('message:' + JSON.stringify(message));
        if(JSON.stringify(message) == "\"heart\""){
            ws.send("beat");
        }
        else{
            setTimeout(function() {
                broadcast(JSON.stringify(message));
	    }, 50);
        }
    });
});
function log (str) {
    console.log((new Date).toString() + ' "' + str + '"');
}
//ブロードキャストを行う
function broadcast(message) {
    connections.forEach(function (con, i) {
        con.send(message);
    });
}

server.listen(8080);

// textream-post用
var express2 = require('express');
var app2 = express2();
app2.configure(function(){
    //app.use(express.static(__dirname + '/'));
    app2.use(express.static(path.join(__dirname, 'public')));
});
app2.set('view options', { layout: false });
//getでリクエストがきたときの処理
app2.get('/', function(req, res){
    console.log(req.query); // for logging
    var user = "";
    var comment = "";
    var repetitionFlg = false;
    // NAMEパラメタが空でなければ画面に表示
    if (req.query.user && req.query.comment){
        user = escapeString(req.query.user);
        comment = escapeString(req.query.comment);
        // 前回と同じ投稿の場合、更新しない
        if(req.query.comment != req.query.precomment) {
            //broadcast(comment + "("+user +")");
            broadcast(comment);
            addComment(user, comment);
            // getComments();
        }
        else{
            repetitionFlg=true;
        }
    }
    else if(req.query.user){
        user = escapeString(req.query.user);
    }
    db.all("SELECT rowid AS id, user, comment,CREATE_YMD,CREATE_HMS FROM comments ORDER BY CREATE_YMD DESC,CREATE_HMS DESC LIMIT 30", function (err, row) {
        if (err) {
            console.log(err);
        }
        res.render('get.ejs', {
            locals:{ "user": user, "comment": comment, "repetitionFlg": repetitionFlg, "comments": row}
        });
    });
});
//list表示
app2.get('/list', function(req, res){
    console.log(req.query); // for logging
    db.all("SELECT rowid AS id, user, comment,CREATE_YMD,CREATE_HMS FROM comments ORDER BY CREATE_YMD DESC,CREATE_HMS DESC ", 
     function (err, row) {
        if (err) {
            console.log(err);
        }
        res.render('list.ejs', {
            locals:{"comments": row}
        });
    });
});
app2.get('/sum', function(req, res){
    db.all("select user,count(*) as cnt from comments group by user order by cnt DESC", 
     function (err, row) {
        if (err) {
            console.log(err);
        }
        res.render('sum.ejs', {
            locals:{"results": row}
        });
    });
});
app2.get('/rank', function(req, res){
    db.all("select user,count(*) as cnt from comments group by user order by cnt DESC", 
     function (err, row) {
        if (err) {
            console.log(err);
        }
        res.render('rank.ejs', {
            locals:{"results": row}
        });
    });
});
app2.listen(3000);

// SQLITE 3
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('db.sqlite3');
// db.run("CREATE TABLE comments (user TEXT, comment TEXT)");
function addComment(user,comment){
    var d = new Date();
    var year = String(d.getFullYear());
    var month = ( (d.getMonth() + 1) < 10 ) ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1);
    var day   = ( d.getDate()    < 10 ) ? '0' + d.getDate()   : d.getDate();
    var ymd   = year + month + day;
    var hour  = ( d.getHours()   < 10 ) ? '0' + d.getHours()   : d.getHours();
    var min   = ( d.getMinutes() < 10 ) ? '0' + d.getMinutes() : d.getMinutes();
    var sec   = ( d.getSeconds() < 10 ) ? '0' + d.getSeconds() : d.getSeconds();
    var hms = String(hour) + String(min) + String(sec);
    db.run("INSERT INTO comments (user, comment, CREATE_YMD, CREATE_HMS) VALUES (?, ?, ?, ?)", 
           user, comment, ymd, hms);
}
function escapeString(str){
   return str.replace(RegExp("([%\\*\\[\\]])","g"),"[$1]").replace(RegExp("'","g"),'"')
             .replace(RegExp("&","g"),"&amp;").replace(RegExp('"',"g"),"&quot;")
             .replace(RegExp("<","g"),"&lt;").replace(RegExp(">","g"),"&gt;");
}
// function getComments(){
//     db.all("SELECT rowid AS id, user, comment FROM comments ORDER BY id DESC LIMIT 10", function (err, row) {
//         if (!err) {
//             console.log(row);
//             return row;
//         }
//         else{
//             console.log(err);
//             return null;
//         }
//     });
// }
