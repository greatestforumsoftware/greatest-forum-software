var mongoose = require('mongoose');
var request = require('request');
var Author = require('../db/author');
var Notifications = require('../db/notifications');
var Comments = require('../db/comments');
var commentVotes = require('../db/commentupvotes.js');
var Reports = require('../db/report');
var Tags = require('../db/tags');
var Activity = require('../db/activity');
var sanitize = require('strip-js');

exports.addComment = function(req, res) {
	var authorID = sanitize(req.params.authorID).replace(/[^a-z0-9]/gi,'');
	if(authorID.length == 24) {
		var Author = mongoose.model('Author');
		Author.findOne({'_id': sanitize(authorID).replace(/[^a-z0-9]/gi,'')}).exec(function(err, author) {
			if(err || author == '' || author == '{}' || author == '[]' || author == null) {
				res.send('no post to comment on');
			} else {
				var comment = sanitize(req.body.comment);

				if(!comment) {
					res.send('no comment');
				} else {
					var Comments = mongoose.model('Comments');
					var newComment = new Comments({'authorID': author._id, 'from': req.user.username, 'message': comment, 'pinned': 0, 'date': Date.now(), 'upvote': 0, 'downvote': 0});

					newComment.save(function(err, result) {
						if(err) {
							res.send('err posting comment');
						} else {

							var User = mongoose.model('User');
							User.findOne({'username': req.user.username}).exec(function(err, userResult) {
								if(err) {
									return 0;
								} else {
									var newXP = Number(userResult.xp) + 100;
									User.update({'username': req.user.username}, {'xp': newXP}).exec();
									return 1;
								}
							});

							var Notifications = mongoose.model('Notification');
							var newNotifications = new Notifications({'receiver': author.username, 'sender': req.user.username, 'date': Date.now(), 'message': 'A comment has been posted on your post: <a href=arse URL>arse title</a>', 'read': 0});
							newNotifications.save(function(err) {
								if(err) {
									return 0;
								}
							});

							var Activity = mongoose.model('Activity');
							var newActivity = new Activity({'username': req.user.username, 'ip': req.ip, 'type': 'comment', 'contentID': result._id, 'done': Date.now()});
							newActivity.save(function(err) {
								if(err) {
									console.log(err);
									return 0;
								}
							});

							res.redirect('/comment/'+result._id);
						}
					});
				}
			}
		});
	} else {
		res.send('no post to comment on');
	}
}

exports.upvote = function(req, res) {
	var commentID = sanitize(req.params.commentID).replace(/[^a-z0-9]/gi,'');
	if(commentID.length == 24) {
		var Comments = mongoose.model('Comments');
		Comments.findOne({'_id': commentID}).exec(function(err, commentResult) {
			if(err || commentResult == '' || commentResult == '[]' || commentResult == '{}' || commentResult == null) {
				res.send('unvoted');
			} else {
				var commentVotes = mongoose.model('commentUpvotes');
				commentVotes.findOne({'username': req.user.username, 'commentID': commentID}).exec(function(err, commentVote) {
					if(err || commentVote == '' || commentVote == '{}' || commentVote == '[]' || commentVote == null) {
						var newCommentVote = new commentVotes({'username': req.user.username, 'commentID': commentID, 'upvote': 1, 'downvote': 0});
						newCommentVote.save();

						var newCommentScore = Number(commentResult.upvote) + 1;
						comments.update({'_id': commentID}, {'upvote': newCommentScore}).exec();

						var User = mongoose.model('User');
						User.findOne({'username': commentResult.username}).exec(function(err, userResult) {
							if(err) {
								return 0;
							} else {
								var userXP = Number(userResult.xp) + 10;
								User.update({'username': commentResult.username}, {'xp': userXP}).exec();
							}
						});

						res.send('upvoted');
					} else {
						commentVotes.remove({'username': req.user.username, 'commentID': commentID}).exec();

						var newCommentScore = Number(commentResult.upvote) - 1;
						comments.update({'_id': commentID}, {'upvote': newCommentScore}).exec();

						var User = mongoose.model('User');
						User.findOne({'username': commentResult.username}).exec(function(err, userResult) {
							if(err) {
								return 0;
							} else {
								var userXP = Number(userResult.xp) - 10;
								User.update({'username': commentResult.username}, {'xp': userXP}).exec();
							}
						});


						res.send('unvoted');
					}
				});
			}
		});
	} else {
		res.send('invalid ID');
	}
}

exports.downvote = function(req, res) {
	var commentID = sanitize(req.params.commentID).replace(/[^a-z0-9]/gi,'');
	if(commentID.length == 24) {
		var Comments = mongoose.model('Comments');
		Comments.findOne({'_id': commentID}).exec(function(err, commentResult) {
			if(err || commentResult == '' || commentResult == '[]' || commentResult == '{}' || commentResult == null) {
				res.send('unvoted');
			} else {
				var commentVotes = mongoose.model('commentUpvotes');
				commentVotes = findOne({'username': req.user.username, 'commentID': commentID}).exec(function(err, commentVote) {
					if(err || commentVote == '' || commentVote == '{}' || commentVote == '[]' || commentVote == null) {
						var newCommentVote = new commentVotes({'username': req.user.username, 'commentID': commentID, 'upvote': 0, 'downvote': 1});
						newCommentVote.save();

						var newCommentScore = Number(commentResult.downvote) + 1;
						comments.update({'_id': commentID}, {'upvote': newCommentScore}).exec();

						var User = mongoose.model('User');
						User.findOne({'username': commentResult.username}).exec(function(err, userResult) {
							if(err) {
								return 0;
							} else {
								var userXP = Number(userResult.xp) - 10;
								User.update({'username': commentResult.username}, {'xp': userXP}).exec();
							}
						});

						res.send('downvoted');
					} else {
						commentVotes.remove({'username': req.user.username, 'commentID': commentID}).exec();

						var newCommentScore = Number(commentResult.downvote) - 1;
						comments.update({'_id': commentID}, {'downvote': newCommentScore}).exec();

						var User = mongoose.model('User');
						User.findOne({'username': commentResult.username}).exec(function(err, userResult) {
							if(err) {
								return 0;
							} else {
								var userXP = Number(userResult.xp) + 10;
								User.update({'username': commentResult.username}, {'xp': userXP}).exec();
							}
						});

						res.send('unvoted');
					}
				});

			}
		});
	} else {
		res.send('invalid ID');
	}
}

exports.voteStatus = function(req, res) {
	var commentID = sanitize(req.params.commentID).replace(/[^a-z0-9]/gi,'');
	if(commentID.length == 24) {
		var Comments = mongoose.model('Comments');
		Comments.findOne({'_id': commentID}).exec(function(err, commentResult) {
			if(err || commentResult == '' || commentResult == '{}' || commentResult == '[]' || commentResult == null) {
				res.send('not available');
			} else {
				var commentUpvotes = mongooose.model('commentUpvotes');
				commentUpvotes.findOne({'_id': commentID}).exec(function(err, commentVoteResult) {
					if(err || commentVoteResult == '' || commentVoteResult == '{}' || commentVoteResult == '[]' || commentVoteResult == null) {
						res.send('unvoted');
					} else {
						if(commentVoteResult.upvote == 1) {
							res.send('upvoted');
						} else {
							res.send('downvoted');
						}
					}
				});
			}
		});
	} else {
		res.send('not available');
	}
}

exports.report = function(req, res) {
	var commentID = sanitize(req.params.commentID).replace(/[^a-z0-9]/gi,'');
	if(commentID.length == 24) {
		var Comments = mongoose.model('Comments');
		Comments.findOne({'_id': commentID}).exec(function(err, commentResult) {
			if(err || commentResult == '' || commentResult == '{}' || commentResult == '[]' || commentResult == null) {
				res.send('no comment');
			} else {
				var reason = req.body.reason.replace(/[^a-zA-Z0-9 \.\,\`\'\"\-\'\!\?]/,'');

				var Reports = mongoose.model('Report');
				Reports.findOne({'commentID': commentID, 'from': req.user.username}).exec(function(err, reportResult) {
					if(err || reportResult == '' || reportResult == '[]' || reportResult == '{}' || reportResult == null) {
						var newReports = new Reports({'authorID': '', 'commentID': commentID, 'from': req.user.username, 'against': commentResult.from, 'date': Date.now(), 'reason': reason});
						newReports.save(function(err, results) {
							if(err) {
								res.send('err composing report');
							} else {
								res.send('successfully reported');
							}
						});
					} else {
						res.send('already reported');
					}
				});
			}
		});
	} else {
		res.send('invalid ID');
	}
}

exports.edit = function(req, res) {
	var commentID = sanitize(req.params.commentID).replace(/[^a-z0-9]/gi,'');
	if(commentID.length == 24) {
		var Comments = mongoose.model('Comments');
		Comments.findOne({'_id': commentID, 'from': req.user.username}).exec(function(err, commentResult) {
			if(err || commentResult == '' || commentResult == '[]' || commentResult == '{}' || commentResult == null) {
				res.send('no comment to edit');
			} else {
				var editedComment = req.body.editedComment;
				Comments.update({'_id': commentID, 'from': req.user.username}, {'message': editedComment}).exec(function(err) {
					if(err) {
						res.send('try again');
					} else {
						res.send('updated');
					}
				});
			}
		});
	} else {
		res.send('invalid ID');
	}
}

exports.remove = function(req, res) {
	var commentID = sanitize(req.params.commentID).replace(/[^a-z0-9]/gi,'');
	if(commentID.length == 24) {
		var Comments = mongoose.model('Comments');
		Comments.findOne({'_id': commentID, 'from': req.user.username}).exec(function(err, commentResult) {
			if(err || commentResult == '' || commentResult == '{}' || commentResult == '[]' || commentResult == null) {
				res.send('no comment to delete');
			} else {

				var convertUpvotesToXP = Number(Comments.upvote) * 10;
				var convertDownVotesToXP = Number(Comments.downvote) * 10;

				var newXPScore = Number(req.user.xp) + convertDownVotesToXP - convertUpvotesToXP;
				var User = mongoose.model('User');
				User.update({'username': req.user.username}, {'xp': newXPScore}).exec();

				Comments.update({'_id': commentID, 'from': req.user.username}, {'from': 'deleted', 'message': 'deleted', 'upvote': 0, 'downvote': 0}).exec();
				res.redirect('/comment/'+ commentID);
			}
		});
	} else {
		res.send('invalid ID');
	}
}

exports.highlight = function(req, res) {
	var commentID = sanitize(req.params.commentID).replace(/[^a-z0-9]/gi,'');
	if(commentID.length == 24) {

		var Comments = mongoose.model('Comments');
		Comments.findOne({'_id': commentID}).exec(function(err, commentResult) {
			if(err || commentResult == '' || commentResult == '{}' || commentResult == '[]' || commentResult == null) {
				res.redirect('/404');
			} else {

				res.render('comment', {
					user: req.user,
					title: 'Moneva',
					comment: commentID
				});

			}
		});

	} else {
		res.send('invalid ID');
	}
}

exports.info = function(req, res) {
	var commentID = sanitize(req.params.commentID).replace(/[^a-z0-9]/gi,'');
	if(commentID.length == 24) {

		var Comments = mongoose.model('Comments');
		Comments.findOne({'_id': commentID}).select('_id authorID from date upvote downvote').exec(function(err, commentResult) {
			if(err || commentResult == '' || commentResult == '{}' || commentResult == '[]' || commentResult == null) {
				res.send('invalid ID');
			} else {
				res.send(commentResult);
			}
		});
	} else {
		res.send('invalid ID');
	}
}

exports.short = function(req, res) {
	var commentID = sanitize(req.params.commentID).replace(/[^a-z0-9]/gi,'');
	if(commentID.length == 24) {

		var Comments = mongoose.model('Comments');
		Comments.findOne({'_id': commentID}).select('_id message').exec(function(err, commentResult) {
			if(err || commentResult == '' || commentResult == '{}' || commentResult == '[]' || commentResult == null) {
				res.send('invalid ID');
			} else {
				res.send(commentResult.message.substring(0, 150));
			}
		});
	} else {
		res.send('invalid ID');
	}
}

exports.long = function(req, res) {
	var commentID = sanitize(req.params.commentID).replace(/[^a-z0-9]/gi,'');
	if(commentID.length == 24) {

		var Comments = mongoose.model('Comments');
		Comments.findOne({'_id': commentID}).select('_id message').exec(function(err, commentResult) {
			if(err || commentResult == '' || commentResult == '{}' || commentResult == '[]' || commentResult == null) {
				res.send('invalid ID');
			} else {
				res.send(commentResult.message);
			}
		});
	} else {
		res.send('invalid ID');
	}
}
