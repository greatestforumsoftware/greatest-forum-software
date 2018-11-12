var mongoose = require('mongoose');
var request = require('request');
var Author = require('../db/author');
var Notifications = require('../db/notifications');
var Comments = require('../db/comments');
var commentVotes = require('../db/commentupvotes.js');
var Reports = require('../db/report');
var Tags = require('../db/tags');
var Message = require('../db/messages');
var sanitize = require('strip-js');

exports.messageSend = function(req, res) {
	var to = sanitize(req.params.to).replace(/[^a-z0-9]/gi,'');
	if(to.length < 30) {
		var User = mongoose.model('User');
		User.findOne({'username': to}).select('username').exec(function(err, result) {
			if(err || result == '' || result == '{}' || result == '[]' || result == null) {
				res.send('no user');
			} else {
				message = sanitize(req.body.message).replace(/[^a-zA-Z0-9 \.\,\`\'\"\-\'\!\?]/,'');
				if(message.length > 5 && message.length < 200) {
					var Message = mongoose.model('Message');
					var newMessage = new Message({'to': to, 'from': req.user.username, 'message': message, 'date': Date.now()});
					newMessage.save(function(err) {
						if(err) {
							return 0;
						} else {

						}
					});
				} else {
					res.send('reduce length of message');
				}
			}
		});
	} else {
		res.send('no username found');
	}
}

exports.readMessages = function(req, res) {
	var to = sanitize(req.params.to).replace(/[^a-z0-9]/gi,'');
	if(to.length < 30) {
		var User = mongoose.model('User');
		User.findOne({'username': to}).select('username').exec(function(err, result) {
			if(err || result == '' || result == '{}' || result == '[]' || result == null) {
				res.send('no user');
			} else {
				var Message = mongoose.model('Message');
				Message.find({'from': req.user.username, 'to': to}).exec(function(err, result) {
					if(err || result == '' || result == '{}' || result == '[]' || result == null) {
						res.send('no chat');
					} else {
						res.send(result);
					}
				});
			}
		});
	} else {
		res.send('no username found');
	}
}

exports.deleteMessage = function(req, res) {
	var id = sanitize(req.params.id).replace(/[^a-z0-9]/gi,'');
	if(id.length == 24) {
		var Message = mongoose.model('Message');
		Message.findOne({'from': req.user.username, '_id': id}).exec(function(err, messageResult) {
			if(err || messageResult == '' || messageResult == '{}' || messageResult == '[]' || messageResult == null) {
				res.send('cant delete');
			} else {
				Message.remove({'from': req.user.username, '_id': id}).exec();
				res.send('message deleted');
			}
		});
	} else {
		res.send('cant delete');
	}
}
