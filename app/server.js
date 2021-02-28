'use strict';

const express = require('express'),
	http = require('http'),
	path = require('path'),
	socketio = require('socket.io'),
	ChatManager = require('./chat.js');

const PORT = process.env.PORT || 8080;

// Set up Express.
const app = express(),
	server = http.createServer(app);
app.set('port', PORT);
app.use(express.static('static'));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '/static/index.html')));

// Set up Socket.IO.
const io = socketio(server);

// Set up chat manager.
const chatManager = new ChatManager(io);

// Start the server once everything is ready.
server.listen(PORT, () => {
	console.log(`Listening on port ${PORT}...`);
});
