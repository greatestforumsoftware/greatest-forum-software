var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
	username: String,
	password: String,
	created: Date,
	biography: String,
	website: String,
	email: String,
	ip: String,
	role: String,
	xp: Number,
	referral: String
});

userSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
	return bcrypt.hashSync(password, this.local.password);
};

module.exports = mongoose.model('User', userSchema);
