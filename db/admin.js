var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// bookID = specific book by user

var loveSchema = mongoose.Schema({
	type: String,
	itemID: String,
	itemName: String,
	date: Date
});

module.exports = mongoose.model('Admin', loveSchema);
