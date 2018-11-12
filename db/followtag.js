var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var followTagSchema = mongoose.Schema({
	tagName: String,
	username: String
});

module.exports = mongoose.model('followTag', followTagSchema);
