var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var messageSchema = mongoose.Schema({
	to: String,
	from: String,
	message: String,
	date: String
});

module.exports = mongoose.model('Message', messageSchema);
