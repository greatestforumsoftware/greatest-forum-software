var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var commentSchema = mongoose.Schema({
	authorID: String,
	from: String,
	message: String,
	pinned: Boolean,
	date: String,
	upvote: Number,
	downvote: Number
});

module.exports = mongoose.model('Comments', commentSchema);
