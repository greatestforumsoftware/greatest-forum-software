var mongoose = require('mongoose');
var request = require('request');
var Authors = require('../db/author.js');
var Comments = require('../db/comments.js');
var Reports = require('../db/report.js');
var Admins = require('../db/admin.js');
var sanitize = require('strip-js');
var commentVotes = require('../db/commentupvotes.js');
var authorVotes = require('../db/authorvotes.js');
var User = require('../db/user.js');

exports.adminPanel = function(req, res) {
	// make sure to check for IP in future
	if(req.user.username == 'bookla') {
		res.render('adminpanel', {
			user: req.user
		});
	} else {
		res.redirect('/404');
	}
};

exports.reportPanel = function(req, res) {
	// make sure to check for IP in future
	if(req.user.username == 'bookla') {
		res.render('adminreports', {
			user: req.user
		});
	} else {
		res.redirect('/404');
	}
}

exports.removePost = function(req, res) {
	// make sure to check for IP in future

	var type = sanitize(req.params.type);
	var bookID = sanitize(req.params.bookID);

	if(type == 'author') {
		if(req.user.username == 'bookla' && bookID) {
			var Author = mongoose.model('Author');
			Author.findOne({'_id': bookID}).exec(function(err, authorResult) {
				if(err) {
					return 0;
				} else {
					var User = mongoose.model('User');
					User.findOne({'username': authorResult.username}).exec(function(err, userResult) {
						if(err) {
							return 0;
						} else {
							var convertUpvotesToXP = Number(authorResult.upvote) * 10;
							var convertDownVotesToXP = Number(authorResult.downvote) * 10;
							var newScore = Number(userResult.xp) + convertDownVotesToXP - convertUpvotesToXP;

							User.update({'username': authorResult.username}, {'xp': newScore}).exec();
						}
					});
				}
			});

			Author.remove({'_id': bookID}).exec();

			var Comments = mongoose.model('Comments');
			Comments.count({'authorID': bookID}).exec(function(err, commentCount) {
				if(err) {
					return 0;
				} else {
					for(var i = 0; i < commentCount; i++) {
						Comments.findOne({'authorID': bookID}).exec(function(err, commentResult) {
							if(err) {
								return 0;
							} else {
								var username = commentResult.from;
								var User = mongoose.model('User');
								User.findOne({'username': username}).exec(function(err, userResult) {
									if(err) {
										return 0;
									} else {
										var convertUpvotesToXP = commentResult.upvote * 10;
										var convertDownVotesToXP = commentResult.downvote * 10;
										var newXP = Number(userResult.xp) + convertDownVotesToXP - convertUpvotesToXP;
										User.update({'username': userResult.username}, {'xp': newXP}).exec();

										Comments.remove({'_id': commentResult._id, 'from': commentResult.username}).exec();
									}
								});
							}
						});
					}
				}
			});

			var Reports = mongoose.model('Report');
			Reports.update({'authorID': bookID}, {'read': 1}).exec();


			var Admins = mongoose.model('Admin');
			var newAdmin = new Admins({'type': 'post', 'itemID': bookID, 'itemName': bookID + ' removed', date: Date.now()});
			newAdmin.save();

			res.redirect('/admin/reports');
		} else {
			res.redirect('/404');
		}
	} else {
		if(req.user.username == 'bookla' && bookID) {
			var Comments = mongoose.model('Comments');
			Comments.findOne({'authorID': bookID}).exec(function(err, commentResult) {
				if(err) {
					return 0;
				} else {
					var username = commentResult.from;
					var User = mongoose.model('User');
					User.findOne({'username': username}).exec(function(err, userResult) {
						if(err) {
							return 0;
						} else {
							var convertUpvotesToXP = commentResult.upvote * 10;
							var convertDownVotesToXP = commentResult.downvote * 10;
							var newXP = Number(userResult.xp) + convertDownVotesToXP - convertUpvotesToXP;
							User.update({'username': userResult.username}, {'xp': newXP}).exec();

							Comments.remove({'_id': commentResult._id, 'from': commentResult.username}).exec();
						}
					});
				}
			});

			var Reports = mongoose.model('Report');
			Reports.update({'commentID': bookID}, {'read': 1}).exec();


			var Admins = mongoose.model('Admin');
			var newAdmin = new Admins({'type': 'post', 'itemID': bookID, 'itemName': bookID + ' removed', date: Date.now()});
			newAdmin.save();

			res.redirect('/admin/reports');
		} else {
			res.redirect('/404');
		}
	}

}


exports.banUser = function(req, res) {
	var username = req.body.username;
	if(req.user.username == 'bookla' && username) {

		// delete comments

		var Comments = mongoose.model('Comments');
		Comments.remove({'username': username}).exec();

		// delete loves, comments on posts

		var Books = mongoose.model('Book');
		Books.find({'username': username}).exec(function(err, findResult) {
			Books.count({'username': username}).exec(function(err, count) {
				for(var i = 0; i < count; i++) {
					var Loves = mongoose.model('Love');
					Loves.remove({'bookID': findResult[i]._id}).exec();

					var Comments = mongoose.model('Comments');
					Comments.remove({'bookID': findResult[i]._id}).exec();
				}
			});
		});

		// delete posts

		Books.remove({'username':username}).exec();

		// delete loves

		var Loves = mongoose.model('Love');
		Loves.remove({'username': username}).exec();

		// change user permissions

		var User = mongoose.model('User');
		User.findOneAndUpdate({'username': username}, {'role': 0}, {upsert: true}).exec();

		// create activity

		var Admins = mongoose.model('Admin');
		var newAdmin = new Admins({'type': 'user', 'itemID': '', 'itemName': username + ' banned', date: Date.now()});
		newAdmin.save();

		res.redirect('/admin/reports');
	} else {
		res.redirect('/404');
	}
}

exports.reports = function(req, res) {
	// make sure to check for IP in future
	if(req.user.username == 'bookla') {
		var Reports = mongoose.model('Report');
		Reports.find().sort({'date': 1}).exec(function(err, save) {
			res.send(save);
		});
	} else {
		res.redirect('/404');
	}
}

exports.activity = function(req, res) {
	// make sure to check for IP in future
	if(req.user.username == 'bookla') {
		var Admin = mongoose.model('Admin');
		Admin.find().sort({'date': 1}).exec(function(err, save) {
			res.send(save);
		});
	} else {
		res.redirect('/404');
	}
}
