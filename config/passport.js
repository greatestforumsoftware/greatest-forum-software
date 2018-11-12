var localStrategy = require('passport-local').Strategy;
var User = require('../db/user');
var sanitize = require('strip-js');
var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose');

module.exports = function(passport) {
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});

	passport.use('local-signup', new localStrategy({
		usernameField: sanitize('username').replace(/[^a-z0-9]/gi,''),
		passwordField: sanitize('password').replace(/[^a-z0-9]/gi,''),
		passReqToCallback: true
	},
	function(req, username, password, done) {
		process.nextTick(function() {
			User.findOne({'username': sanitize(username).replace(/[^a-z0-9]/gi,'')}, function(err, user) {
				if(user || err) {
					return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
				} else {
					if(sanitize(req.body.referral).replace(/[^a-z0-9]/gi,'')) {
						User.findOne({'username': sanitize(req.body.referral).replace(/[^a-z0-9]/gi,'')}).exec(function(err, referralResult) {
							if(err || referralResult == '' || referralResult == '[]' || referralResult == '{}' || referralResult == null) {
								var newUser = new User();
								newUser.username = sanitize(username).replace(/[^a-z0-9]/gi,'');
								newUser.password = newUser.generateHash(password);
								newUser.created = Date.now();
								newUser.role = 1;
								newUser.website = '';
								newUser.referral = '';
								newUser.biography = 'new user';
								newUser.xp = 0;
								newUser.ip = req.ip;
								newUser.save(function(err) {
									if(err) return done(err);
									return done(null, newUser);
								});
							} else {
								var getXP = Number(referralResult.xp);
								var newReferralAmount = getXP + 1000;
								User.update({'username': sanitize(req.body.referral).replace(/[^a-z0-9]/gi,'')}, {'xp': newReferralAmount}).exec();

								var newUser = new User();
								newUser.username = sanitize(username).replace(/[^a-z0-9]/gi,'');
								newUser.password = newUser.generateHash(password);
								newUser.created = Date.now();
								newUser.role = 1;
								newUser.website = '';
								newUser.referral = sanitize(req.body.referral).replace(/[^a-z0-9]/gi,'');
								newUser.biography = '';
								newUser.xp = 0;
								newUser.ip = req.ip;
								newUser.save(function(err) {
									if(err) return done(err);
									return done(null, newUser);
								});
							}
						});
					} else {
						var newUser = new User();
						newUser.username = sanitize(username).replace(/[^a-z0-9]/gi,'');
						newUser.password = newUser.generateHash(password);
						newUser.created = Date.now();
						newUser.role = 1;
						newUser.website = '';
						newUser.referral = '';
						newUser.biography = '';
						newUser.xp = 0;
						newUser.ip = req.ip;
						newUser.save(function(err) {
							if(err) return done(err);
							return done(null, newUser);
						});
					}
				}
			});
		});
	}));

	passport.use('local-login', new localStrategy({
		usernameField: sanitize('username').replace(/[^a-z0-9]/gi,''),
		passwordField: sanitize('password').replace(/[^a-z0-9]/gi,''),
		passReqToCallback: true
	},
	function(req, username, password, done) {
		User.findOne({'username': username.replace(/[^a-z0-9]/gi,'')}, function(err, user) {
			if(!user || err) return done(null, false, req.flash('loginMessage', 'No user found.'));

			// CHECK ACCOUNT CAN LOGIN

			if(user.role == 0) {
				return done(null, false, req.flash('loginMessage', 'Cannot login!'));
			}

			// PASSWORD CHECKING

			if(bcrypt.hashSync(password, user.password) == user.password) {
				return done(null, user);
			} else {
				return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
			}
		});
	}));
}
