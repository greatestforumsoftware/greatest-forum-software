var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var authorSchema = mongoose.Schema({
	username: String,
	type: Number,
	title: String,
	image: String,
	contents: String,
	tags: String,
	date: Date,
	edit: Boolean,
	upvote: Number,
	downvote: Number
});

module.exports = mongoose.model('Author', authorSchema);
