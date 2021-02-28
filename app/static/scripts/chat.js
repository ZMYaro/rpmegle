'use strict';

// This is all temporary code to test the server.

var socket,
	chatContainer,
	chatInput,
	chatActive = false;

window.onload = function () {
	chatContainer = document.getElementById('chat-log');
	chatInput = document.getElementById('chat-input');
	document.getElementById('new-btn').onclick = requestNew;
	document.getElementById('leave-btn').onclick = leave;
	document.getElementById('send-btn').onclick = sendMessage;
	
	createConnection();
}

function requestNew() {
	if (chatActive || !socket) {
		return;
	}
	socket.emit('new');
	chatContainer.innerText = 'Waiting for a partner...';
	// TODO: Reset typing status.
}

function leave() {
	if (!chatActive || !socket) {
		return;
	}
	socket.emit('leave');
}

function sendMessage() {
	if (!chatActive || !socket|| chatInput.value.trim().length === 0) {
		return;
	}
	socket.emit('message', chatInput.value.trim());
	chatContainer.innerText += '\nYou: ' + chatInput.value.trim();
	chatInput.value = '';
}

function createConnection() {
	chatContainer.innerText = 'Connecting...';
	socket = io();
	socket.on('connect', handleConnect);
	socket.on('join', handleJoin);
	socket.on('leave', (data) => handleLeave(data.who, data.reason));
	socket.on('typing', handleTyping);
	socket.on('message', handleMessage);
	socket.on('disconnect', handleDisconnect);
}

function handleConnect() {
	chatContainer.innerText = 'Connected.';
	requestNew();
}

function handleJoin() {
	chatContainer.innerText = 'You are now chatting with a random partner.';
	chatActive = true;
}

function handleLeave(who, reason) {
	switch (who) {
		case 'self':
			chatContainer.innerText += '\nYou disconnected.';
			break;
		case 'partner':
			chatContainer.innerText += '\nPartner disconnected.';
			break;
		default:
			chatContainer.innerText += '\nUnexpectedly disconnected.';
			break;
	}
	if (reason) {
		chatContainer.innerText += '\nReason: ' + reason;
	}
	
	// TODO: Reset typing status.
	
	chatActive = false;
}

function handleTyping(isTyping) {
	// TODO
}

function handleMessage(message) {
	chatContainer.innerText += '\nStranger: ' + message;
	// TODO: Alert the user to the message.
}

function handleDisconnect(reason) {
	handleLeave(null, reason);
	
	chatActive = false;
}
