// 必要なモジュールをインポートする
var http = require("http");
var socketIO = require("socket.io");
var fs = require("fs");

// Webサーバーを構築し、アクセスされたらindex.htmlファイルを返す
var server = http.createServer(function(req, res) {
     res.writeHead(200, {"Content-Type" : "text/html"});
     var output = fs.readFileSync("./index.html", "utf-8");
     res.end(output);
});
// ポートは8080で待ち受ける
server.listen(8080);

// Socket.IOサーバーを構築する
var io = socketIO.listen(server);
io.sockets.on("connection", function (socket) {
  console.log("connected");
  // メッセージを受け取った時の動作
  socket.on("message", function (data) {
    console.log("message: " + data.value);
    // 全員に受け取ったメッセージを送る
    io.sockets.emit("message", {value: data.value});
  });

  // "say hello"というカスタムイベントを受け取った時の動作
  // connection, message, disconnectといった定義済みイベント
  // 以外に自由にイベント名を定義できる
  // そのイベント名はサーバーとクライアントで合わせればOK
  socket.on("say hello", function (data) {
    console.log("userName=" + data.userName);
    // メッセージ送信者以外に送る（ブロードキャストという）
    socket.broadcast.emit("message",
      {value : "Hello! This is " + data.userName + "."});
  });

  // 誰かがコネクションを切った得の動作
  // 例えばブラウザを閉じた時とか
  socket.on("disconnect", function () {
    // 全ユーザーにメッセージを送る
    io.sockets.emit("message", {value:"user disconnected"});
  });
});
