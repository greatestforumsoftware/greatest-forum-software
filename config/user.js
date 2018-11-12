var mongoose = require('mongoose');
var User = require('../db/user');
var Notifications = require('../db/notifications');
var Comments = require('../db/comments');
var sanitize = require('strip-js');
var bcrypt = require('bcrypt-nodejs');

exports.login = function(req, res) {
	res.render('login', {
		title: 'Sign In',
		reason: ''
	});
}

exports.register = function(req, res) {
	res.render('register', {
		title: 'Sign Up',
		reason: ''
	});
}

exports.logout = function(req, res) {
	req.logout();
	res.redirect('/');
}

exports.redirectToProfile = function(req, res) {
	res.redirect('/profile/'+req.user.username);
}

exports.profile = function(req, res) {
	var username = req.params.username;
	if(/^[a-zA-Z0-9]+$/.test(username) == true || username) {
		var User = mongoose.model('User');
		User.findOne({'username': username}, function(err, result) {
			if(err || result == '' || result == '[]' || result == '""' || result == null) {
				res.redirect('/404');
			} else if (result.role == 0) {
				res.redirect('/404');
			} else {
				res.render('profile', {
					title: 'Moneva',
					user: req.user,
					profileUsername: username,
					profileBio: result.biography,
					profileJoined: result.created,
					profileXP: result.xp
				});
			}
		});
	} else {
		res.redirect('/404');
	}
}

exports.settings = function(req, res) {
	if(req.user) {
		res.render('settings', {
			title: 'Moneva',
			user: req.user
		});
	} else {
		res.redirect('/404');
	}
}

exports.followUser = function(req, res) {
	var follower = req.user.username;
	var followed = req.params.user;
	if(/^[a-zA-Z0-9]+$/.test(follower) == true && /^[a-zA-Z0-9]+$/.test(followed) == true && followed != null) {
		if(follower != followed) {
			var followers = mongoose.model('Follow');
			followers.findOne({'follower': follower, 'followed': followed}, function(err, result) {
				if(err || result == '' || result == '{}' || result == '[]' || result == null) {
					var newFollower = new followers();
					newFollower.follower = follower;
					newFollower.followed = followed;
					newFollower.date = Date.now();
					newFollower.save();

					// create notification

					var Notifications = mongoose.model('Notification');
					var newNotification = new Notifications();
					newNotification.username = followed;
					newNotification.sender = follower;
					newNotification.date = Date.now();
					newNotification.message = 'has followed you';
					newNotification.read = 0;
					newNotification.save();

					res.redirect('/profile/'+followed);

				} else {
					followers.findOne({'follower': follower, 'followed': followed}).remove().exec();
					res.redirect('/profile/'+followed);
				}
			});
		} else {
			var followers = mongoose.model('Follow');
			followers.findOne({'follower': follower, 'followed': followed}).remove().exec();
			res.redirect('/profile/'+followed);
		}
	} else {
		res.send('{"error": "no username found"}');
	}
}

exports.notifications = function(req, res) {
	var Notifications = mongoose.model('Notification');
	Notifications.count({'username': req.user.username, 'read': false}, function(err, count) {
		for(var i = 0; i < count; i++) {
			Notifications.update({'username': req.user.username, 'read': false}, {'read': true},{upsert: true}).exec(function(err, notifications) {
				if(err || notifications == '' || notifications == '[]' || notifications == '{}' || notifications == null) {
					return 0;
				}
			});
		}
		res.render('notifications', {
			title: 'Moneva',
			user: req.user
		});
	});
}

exports.getNotifications = function(req, res) {
	var number = req.params.number;
	if(/^[0-9]+$/.test(number) == true) {
		function maxNotifications(limit) {
			var limit = Number(limit);
			if(limit > 0 || limit < 500) {
				return limit;
			} else {
				return 500;
			}
		}

		var totalQueries = maxNotifications(number);

		var Notifications = mongoose.model('Notification');
		Notifications.find({'username': req.user.username}).limit(totalQueries).sort({'date': 1}).exec(function(err, notifications) {
			if(err || notifications == '' || notifications == '[]' || notifications == '{}' || notifications == null) {
				res.send(notifications);
			} else {
				res.send(notifications);
			}
		});
	} else {
		res.send(false);
	}
}

exports.userBIOSave = function(req, res) {
	var description = req.body.description;
	var website = req.body.website;
	var location = req.body.location;
	if(!description && !website && !location) {
		res.redirect('/settings');
	} else {
		if(/^[a-zA-Z0-9\,\.\;\:\' ]+$/.test(description) == true && description.length < 120 && /^[a-zA-Z0-9\.\/\:\-]+$/.test(website) == true &&  website.length < 120 && /^[a-zA-Z0-9\,\'\.\- ]+$/.test(location) == true && location.length < 120) {
			var User = mongoose.model('User');
			User.update({'username': req.user.username}, {'biography': description, 'website': website, 'location': location}, {upsert: true}).exec(function(err, save) {
				res.redirect('/settings');
			});
		} else {
			res.redirect('/settings');
		}
	}
}

exports.userPWSave = function(req, res) {
	var password = sanitize(req.body.password).replace(/[^a-z0-9]/gi,'');
	var newPassword = sanitize(req.body.newPassword).replace(/[^a-z0-9]/gi,'');

	if(!password && !newPassword) {
		res.redirect('/settings');
	} else {
		if(bcrypt.hashSync(password, req.user.password) == req.user.password) {
			var User = mongoose.model('User');
			User.findOne({'username': req.user.username}, function(err, result) {
				if(err) {
					res.redirect('/404');
				} else {
					result.password = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(8), null);
					result.save();
				}
			});
			res.redirect('/logout');
		} else {
			res.redirect('/settings');
		}
	}
}

exports.deleteAccount = function(req, res) {
	var password = sanitize(req.body.password).replace(/[^a-z0-9]/gi,'');
	if(!password) {
		res.redirect('/settings');
	} else {
		if(bcrypt.hashSync(password, req.user.password) == req.user.password) {

			// delete loves for post

			var Books = mongoose.model('Book');
			Books.count({'username': req.user.username}).exec(function(err, count) {
				if(err || count == null || count == '' || count == '{}' || count == '[]') {
					return false;
				} else {
					Books.find({'username': req.user.username}).exec(function(err, bookResults) {
						for(var i = 0; i < count; i++) {
							var Loves = mongoose.model('Love');
							Loves.find({'bookID': bookResults[i]._id}).remove();
						}
					});
				}
			});

			// delete posts

			Books.find({'username': req.user.username}).remove();

			// delete loves

			var Loves = mongoose.model('Love');
			Loves.find({'username': req.user.username}).remove();

			// delete comments

			var Comments = mongoose.model('Comments');
			Comments.find({'from': req.user.username}).remove();

			// delete follows

			var Follow = mongoose.model('Follow');
			Follow.find({'follower': req.user.username}).remove();
			Follow.find({'followed': req.user.username}).remove();

			// delete account

			var User = mongoose.model('User');
			User.findOne({'username': req.user.username}).remove();

			// sign out when done

			req.logout();
			res.redirect('/');
		} else {
			res.redirect('/settings');
		}
	}
}

exports.timeline = function(req, res) {
	var tagsFollowed = mongoose.model('followTag');
	tagsFollowed.find({'username': req.user.username}, function(err, followerResult) {
		res.send(followerResult);
	});
}

exports.canPostXPLimit = function(req, res) {
	var username = String(req.user.username);
	var User = mongoose.model('User');
	User.findOne({'username': username}).exec(function(err, userResult) {
		if(err) {
			res.send('n/a');
		} else {
			if(Number(userResult.xp) < 1000) {
				res.send('cannot post');
			} else {
				res.send('can post');
			}
		}
	});
}

exports.tagsFollowing = function(req, res) {
	var username = String(req.user.username);
	var User = mongoose.model('User');
	User.findOne({'username': username}).exec(function(err, userResult) {
		if(err || userResult == '' || userResult == '[]' || userResult == '{}' || userResult == null) {
			res.send('n/a');
		} else {
			var tagsFollowed = mongoose.model('followTag');
			tagsFollowed.find({'username': username}).limit(50).exec(function(err, tagResult) {
				if(err || tagResult == '' || tagResult == '{}' || tagResult == '[]' || tagResult == null) {
					res.send('no tags followed');
				} else {
					res.send(tagResult);
				}
			});
		}
	});
}

exports.userBrief = function(req, res) {
	var username = sanitize(req.params.username).replace(/[^a-z0-9]/gi,'');
	if(username) {
		var User = mongoose.model('User');
		User.findOne({'username': username}).select('_id username biography').exec(function(err, userResult) {
			if(err || userResult == '' || userResult == '{}' || userResult == '[]' || userResult == null) {
				res.send('no user');
			} else {
				res.send(userResult);
			}
		});
	} else {
		res.redirect('/404');
	}
}

exports.userActivity = function(req, res) {
	var username = sanitize(req.params.username).replace(/[^a-z0-9]/gi,'');
	if(username) {
		var User = mongoose.model('User');
		User.findOne({'username': username}).select('_id username').exec(function(err, userResult) {
			if(err || userResult == '' || userResult == '[]' || userResult == '{}' || userResult == null) {
				res.redirect('/404');
			} else {
				var Activity = mongoose.model('Activity');
				Activity.find({'username': username}).limit(10).exec(function(err, result) {
					if(err || result == '' || result == '{}' || result == '[]' || result == null) {
						res.send('no activity');
					} else {
						res.send(result);
					}
				});
			}
		});
	} else {
		res.redirect('/404');
	}
}
