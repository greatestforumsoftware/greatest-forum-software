var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var activitySchema = mongoose.Schema({
	username: String,
	ip: String,
	type: String,
	contentID: String,
	done: Date
});

module.exports = mongoose.model('Activity', activitySchema);
