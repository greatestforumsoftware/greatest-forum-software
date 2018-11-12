var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// bookID = specific book by user

var tagSchema = mongoose.Schema({
	tagName: String,
	postID: String
});

module.exports = mongoose.model('Tags', tagSchema);
