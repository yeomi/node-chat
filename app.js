// express framework
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require("socket.io")(server);
var ent = require("ent");
var session = require("cookie-session");
var bodyParser = require("body-parser");
var mysql = require("mysql");

// Serve static files folder to client
app.use(express.static(__dirname + '/public'));

// configuration for MAMP on MAC OS
var connection = mysql.createConnection({
	user: "root",
	password: "root",
	database: "nodejs",
	socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
});

// Connect to database
connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});


var Twig = require('twig');

// Options body parser
app.use(bodyParser.urlencoded({
  extended: true
})); 

// Cookie-session configuration
app.use(session({
	name: "mini_chat",
	keys: ["key1", "key2"],
	signed: false
}));

// Route "/" for front page
app.get("/", function(req, res) {
	res.render('index.twig', {
    	pseudo : req.session.pseudo
  	});
});

// Receiving pseudo sent by form on front page and stocking it into a session cookie
app.post("/set-pseudo", function(req, res) {
	if(req.body.pseudo != undefined && req.body.pseudo != "") {
		req.session.pseudo = ent.encode(req.body.pseudo);
	}
	res.redirect('/chat');
});

// Setting up of the chat page (templates vars are pseudo and array with previous posted messages from db)
app.get("/chat", function(req, res) {
	if(req.session.pseudo == undefined || req.session.pseudo == "") {
		res.redirect('/');
	} else {
		connection.query('SELECT * FROM message ORDER BY id DESC LIMIT 0, 14', function(err, rows, fields) {
			res.render('chat.twig', {
				pseudo: req.session.pseudo,
				rows: rows
		  	});
		});
	}
});


// Sockets events
io.on("connection", function(socket) {

	// Callback when newUser event is triggers by client
	socket.on("newUser", function(pseudo) {
		socket.pseudo = pseudo;
		message = pseudo + " has join the chat";
		socket.broadcast.emit("message", "new_user", message);
	});


	// Callback when newMessage event is triggers by client
	socket.on("newMessage", function(message) {
		if(message == "") {
			return;
		}
		// Save it to the database
		connection.query("INSERT INTO message SET ?", {author: socket.pseudo, message: message} , function(err, result) {
			if (err) throw err;
		});
		message = "<span>" + socket.pseudo + ":</span> " + ent.encode(message);
		socket.broadcast.emit("message", "message", message);
	});
});

// listen port 8080
server.listen(8080);
