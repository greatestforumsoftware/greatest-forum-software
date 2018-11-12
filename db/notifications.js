var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// sender = who caused the notification
// message = type of notification
// read = has it been read

var notificationSchema = mongoose.Schema({
	receiver: String,
	sender: String,
	date: String,
	message: String,
	read: Boolean
});

module.exports = mongoose.model('Notification', notificationSchema);
