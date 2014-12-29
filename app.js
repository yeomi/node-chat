var app = require('express')();
var server = require('http').Server(app);
var io = require("socket.io")(server);
var ent = require("ent");

app.get("/", function(req, res) {
	res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
	socket.on("newUser", function(pseudo) {
			pseudo = ent.encode(pseudo);
			socket.pseudo = pseudo;
			socket.broadcast.emit("message", pseudo + " just join the Chat !");
	})

	socket.on("newMessage", function(message) {
		message = ent.encode(message);
		socket.broadcast.emit("postMessage", socket.pseudo, message);
	})
});

server.listen(8080);
