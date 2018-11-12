var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var voteSchema = mongoose.Schema({
	username: String,
	authorID: String,
	upvote: Boolean,
	downvote: Boolean
});

module.exports = mongoose.model('AuthorVotes', voteSchema);
