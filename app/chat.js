'use strict';

class ChatManager {
	io;
	users = {};
	userCount = 0;
	strangerQueue = [];
	
	/**
	 * Create a new ChatManager instance.
	 * @param {Server} io - The Socket.IO server
	 */
	constructor(io) {
		this.io = io;
		this.io.on('connection', (socket) => this.handleConnect(socket));
	}
	
	/**
	 * Handle a new user connecting.
	 * @param {Socket} socket
	 */
	handleConnect(socket) {
		// Set up event listeners for the user's socket.
		socket.on('new', () => this.handleRequestNew(socket));
		socket.on('leave', () => this.handleLeave(socket));
		socket.on('typing', (isTyping) => this.handleTyping(isTyping, socket));
		socket.on('message', (message) => this.handleMessage(message, socket));
		socket.on('disconnect', (reason) => this.handleDisconnect(reason, socket));
		
		// Store the socket and user information.
		this.users[socket.id] = {
			socket: socket,
			connectedTo: undefined,
			isTyping: false
		};
		
		this.userCount++;
		console.log('User connected.', `${this.userCount} online.`);
		this.io.sockets.emit('stats', { people: this.userCount });
	}
	
	/**
	 * Handle a user requesting a new partner.
	 * @param {Socket} socket
	 */
	handleRequestNew(socket) {
		if (this.strangerQueue.length > 0) {
			// Get the next stranger in line.
			var partnerId = this.strangerQueue.shift();
			this.users[socket.id].connectedTo = partnerId;
			this.users[partnerId].connectedTo = socket.id;
			this.users[socket.id].isTyping =
				this.users[partnerId].isTyping = false;
			socket.emit('join');
			this.users[partnerId].socket.emit('join');
		} else {
			this.strangerQueue.push(socket.id);
		}
	}
	
	/**
	 * Handle a user leaving a conversation.
	 * @param {Socket} socket
	 */
	handleLeave(socket) {
		var user = this.users[socket.id],
			partnerId = user.connectedTo,
			partner = this.users[partnerId];
		
		this.resetUser(user);
		
		if (partner) {
			partner.socket.emit('leave', { who: 'partner' });
			this.resetUser(partner);
		}
		socket.emit('leave', { who: 'self' });
	}
	
	/**
	 * Handle a user starting or stopping typing.
	 * @param {Boolean} isTyping - Whether the user is typing
	 * @param {Socket} socket - The socket of the user who sent the update
	 */
	handleTyping(isTyping, socket) {
		var user = this.users[socket.id],
			statusChanged = (user.isTyping !== isTyping),
			partnerId = this.users[socket.id].connectedTo,
			partner = this.users[this.users[socket.id].connectedTo];
		if (partner && partnerId && statusChanged) {
			user.isTyping = isTyping;
			partner.socket.emit('typing', isTyping);
		}
	}
	
	/**
	 * Handle a user sending a chat.
	 * @param {String} message - The message the user sent
	 * @param {Socket} socket - The socket of the user who sent the message
	 */
	handleMessage(message, socket) {
		var partnerId = this.users[socket.id].connectedTo,
			partner = this.users[this.users[socket.id].connectedTo];
		if (partnerId && partner) {
			partner.socket.emit('message', message.trim());
		}
	}
	
	/**
	 * Handle a user disconnecting.
	 * @param {String} reason - The reason for the disconnection, from Socket.IO
	 * @param {Socket} socket - The socket of the user who disconnected
	 */
	handleDisconnect(reason, socket) {
		var user = this.users[socket.id],
			partnerId = user.connectedTo,
			partner = this.users[partnerId];
		
		// Disconnect xer partner from the conversation.
		if (partnerId && partner) {
			partner.socket.emit('leave', { who: 'partner', reason: reason });
			this.resetUser(partner);
		}
		
		// TODO: Check whether the user is in the strangers queue and remove xem.
		
		delete this.users[socket.id];
		
		this.userCount--;
		console.log('User disconnected.', `${this.userCount} online.`);
		this.io.sockets.emit('stats', { poeple: this.userCount });
	}
	
	/**
	 * Reset a user's status variables to an unpaired state.
	 * @param {Object} user
	 */
	resetUser(user) {
		user.connectedTo = undefined;
		user.isTyping = false;
	}
}

module.exports = ChatManager;
