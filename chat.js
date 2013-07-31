var WebSocketServer = require('ws').Server
    , http = require('http')
    , express = require('express')
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
        setTimeout(function() {
             broadcast(JSON.stringify(message));
        }, 50);
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
};

server.listen(8080);

// textream-post用
var express2 = require('express');
var server2 = express2();
server2.set('view options', { layout: false });
//getでリクエストがきたときの処理
server2.get('/', function(req, res){
  console.log(req.query); // for logging
  var user = "";
  var comment = "";
  // NAMEパラメタが空でなければ画面に表示
  if (req.query.user && req.query.comment) {
      user = req.query.user;
      comment = req.query.comment;
      connections.forEach(function (con, i) {
          con.send(comment+"("+user+")");
      });
      addComment(user, comment);
      // getComments();
  }
  res.render('get.ejs', { "user": user, "comment": comment, "comments":getComments() });
});
server2.listen(3000);

// SQLITE 3
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('db.sqlite3');
// db.run("CREATE TABLE comments (user TEXT, comment TEXT)");
function addComment(user,comment){
    console.log("insert");
    var date = new Date();
    db.run("INSERT INTO comments (user, comment) VALUES (?, ?)", user, comment);
}

function getComments(){
    var comments = new Array("TEXT")
    db.each("SELECT rowid AS id, user, comment FROM comments ORDER BY id DESC LIMIT 10", function (err, row) {
        console.log(row.id + " : " + row.user + " / " + row.comment);
        comments.push(row.id + " : " + row.user + " / " + row.comment);
    });
    console.log(comments);
    return comments;
}
