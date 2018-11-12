var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var voteSchema = mongoose.Schema({
	username: String,
	commentID: String,
	upvote: Boolean,
	downvote: Boolean
});

module.exports = mongoose.model('commentUpvotes', voteSchema);
