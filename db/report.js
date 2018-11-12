var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var reportSchema = mongoose.Schema({
	authorID: String,
	commentID: String,
	from: String,
	against: String,
	date: Date,
	reason: String,
	solved: Boolean
});

module.exports = mongoose.model('Report', reportSchema);
