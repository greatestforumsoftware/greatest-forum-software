var mongoose = require('mongoose');
var request = require('request');
var Author = require('../db/author');
var Notifications = require('../db/notifications');
var Comments = require('../db/comments');
var authorVotes = require('../db/authorvotes.js');
var Reports = require('../db/report');
var Activity = require('../db/activity');
var Tags = require('../db/tags');
var sanitize = require('strip-js');

exports.addAuthor = function(req, res) {
	var xpAmount = 0;

	if(req.user.xp >= xpAmount) {
		// this function adds books for user
		function addAuthor(username, type, title, image, contents, date, edit) {
			var Author = mongoose.model('Author');
			var newAuthor = new Author();

			newAuthor.username = username;
			newAuthor.type = type;
			newAuthor.title = title;
			newAuthor.image = image;
			newAuthor.contents = contents;
			newAuthor.date = date;
			newAuthor.edit = edit;
			newAuthor.upvote = 0;
			newAuthor.downvote = 0;

			newAuthor.save(function(err,save) {
				if(err) {
					return err;
				} else {

					var User = mongoose.model('User');
					User.findOne({'username': req.user.username}).exec(function(err, userResult) {
						if(err) {
							return 0;
						} else {
							var newXP = Number(userResult.xp) + 250;
							User.update({'username': req.user.username}, {'xp': newXP}).exec();
						}
					});

					var Activity = mongoose.model('Activity');
					var newActivity = new Activity({'username': req.user.username, 'ip': req.ip, 'type': 'post', 'contentID': save._id, 'done': Date.now()});
					newActivity.save(function(err) {
						if(err) {
							console.log(err);
							return 0;
						}
					});

					res.redirect('/post/'+save._id);
				}
			});
		}

		function addTag(tag, postID) {
			var Tags = mongoose.model('Tags');
			Tags.findOne({'tagName': tag, 'postID': postID}).exec(function(err, result) {
				if(err) {
					return 0;
				} else if(result == '' || result == '{}' || result == '[]' || result == null) {
					var newTags = new Tags({'tagName': tag, 'postID': postID});
					newTags.save();
					return 1;
				} else {
					return 0;
				}
			});
		}

		var title = req.body.title.replace(/[^a-z0-9 \?\!\.\,\'\"\`\-]/gi,'');
		var content = req.body.content.replace(/[^a-z0-9 \?\!\.\,\'\"\`\-]/gi,'');
		var tags = req.body.tags.replace(/[^a-z0-9 ]/gi,'');

		if(!title || title <= 5 || title >= 150) {
			res.send('Title error. Make sure you have included a title and that it doesn\'t exceed 150 characters.');
		} else {
			if(!tags || tags.length <= 2 ||tags.length >= 30) {
				res.send('Tags error. Make sure you have included tags and that they don\'t exceed 30 characters.');
			} else {
				addAuthor(req.user.username, 1, title, '', content, Date.now(), 0);
			}
		}
	} else {
		res.send('XP error. Make sure your XP is greater or equal to '+xpAmount+' to be able to post.');
	}
}

exports.tagSearch = function(req, res) {
	var tagName = req.params.name.replace(/[^a-z0-9]/gi,'');


}

exports.upvote = function(req, res) {
	var authorID = sanitize(req.params.authorID).replace(/[^a-z0-9]/gi,'');
	if(authorID.length == 24) {
		var Author = mongoose.model('Author');
		Author.findOne({'_id': authorID}).exec(function(err, authorResult) {
			if(err || authorResult == '' || authorResult == '[]' || authorResult == '{}' || authorResult == null) {
				res.send('no vote');
			} else {
				var authorVotes = mongoose.model('authorVotes');
				authorVotes.findOne({'username': req.user.username, 'authorID': authorID}).exec(function(err, voteResult) {
					if(err || voteResult == '' || voteResult == '[]' || voteResult == '{}' || voteResult == null) {
						var pointScoreCrap = new authorVotes({'username': req.user.username, 'authorID': authorID, 'upvote': 1, 'downvote': 0});
						pointScoreCrap.save();

						var newUpvoteTotal = Number(authorResult.upvoted) + 1;
						Author.update({'_id': authorID}, {'upvote': newUpvoteTotal}).exec();

						var User = mongoose.model('User');
						User.findOne({'username': Author.username}).exec(function(err, userResult) {
							if(err) {
								return 0;
							} else {
								var newXP = Number(userResult.xp) + 10;
								User.update({'username': Author.username}, {'xp': newXP}).exec();
							}
						});

						res.send('upvoted');
					} else {
						AuthorVotes.remove({'username': req.user.username, 'authorID': authorID}).exec();

						var newUpvoteTotal = Number(authorResult.upvote) - 1;
						Author.update({'_id': authorID}, {'upvote': newUpvoteTotal}).exec();

						var User = mongoose.model('User');
						User.findOne({'username': Author.username}).exec(function(err, userResult) {
							if(err) {
								return 0;
							} else {
								var newXP = Number(userResult.xp) - 10;
								User.update({'username': Author.username}, {'xp': newXP}).exec();
							}
						});

						res.send('unvoted');
					}
				});
			}
		});
	} else {
		res.redirect('/404');
	}
}

exports.downvote = function(req, res) {
	var authorID = sanitize(req.params.authorID).replace(/[^a-z0-9]/gi,'');
	if(authorID.length == 24) {
		var Author = mongoose.model('Author');
		Author.findOne({'_id': authorID}).exec(function(err, authorResult) {
			if(err || authorResult == '' || authorResult == '[]' || authorResult == '{}' || authorResult == null) {
				res.send('no vote');
			} else {
				var authorVotes = mongoose.model('authorVotes');
				authorVotes.findOne({'username': req.user.username, 'authorID': authorID}).exec(function(err, voteResult) {
					if(err || voteResult == '' || voteResult == '[]' || voteResult == '{}' || voteResult == null) {
						var pointScoreCrap = new authorVotes({'username': req.user.username, 'authorID': authorID, 'upvote': 0, 'downvote': 1});
						pointScoreCrap.save();

						var newUpvoteTotal = Number(authorResult.downvote) - 1;
						Author.update({'_id': authorID}, {'upvote': newUpvoteTotal}).exec();

						var User = mongoose.model('User');
						User.findOne({'username': Author.username}).exec(function(err, userResult) {
							if(err) {
								return 0;
							} else {
								var newXP = Number(userResult.xp) - 10;
								User.update({'username': Author.username}, {'xp': newXP}).exec();
							}
						});

						res.send('downvoted');
					} else {
						AuthorVotes.remove({'username': req.user.username, 'authorID': authorID}).exec();

						var User = mongoose.model('User');
						User.findOne({'username': Author.username}).exec(function(err, userResult) {
							if(err) {
								return 0;
							} else {
								var newXP = Number(userResult.xp) + 10;
								User.update({'username': Author.username}, {'xp': newXP}).exec();
							}
						});

						var newUpvoteTotal = Number(authorResult.downvote) - 1;
						Author.update({'_id': authorID}, {'upvote': newUpvoteTotal}).exec();

						res.send('unvoted');
					}
				});
			}
		});
	} else {
		res.redirect('/404');
	}
}


exports.voteStatus = function(req, res) {
	var authorID = sanitize(req.params.authorID).replace(/[^a-z0-9]/gi,'');
	if(authorID.length == 24) {
		var Author = mongoose.model('Author');
		Author.findOne({'_id': authorID}).exec(function(err, result) {
			if(err || result == '' || result == '[]' || result == '{}' || result == null) {
				res.send('not available');
			} else {
				var authorVotes = mongoose.model('AuthorVotes');
				authorVotes.findOne({'username': req.user.username, 'authorID': authorID}).exec(function(err, authorResult) {
					if(err || authorResult == '' || authorResult == '{}' || authorResult == '[]' || authorResult == null) {
						res.send('unvoted');
					} else {
						if(authorResult.upvote == 1) {
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
	var authorID = sanitize(req.params.authorID).replace(/[^a-z0-9]/gi,'');
	if(authorID.length == 24) {
		var Author = mongoose.model('Author');
		Author.findOne({'_id': authorID}).exec(function(err, authorResult) {
			if(err || authorResult == '' || authorResult == '{}' || authorResult == '[]' || authorResult == null) {
				res.send('no author');
			} else {
				var reason = req.body.reason.replace(/[^a-zA-Z0-9 \.\,\`\'\"\-\'\!\?]/,'');

				var Reports = mongoose.model('Report');
				Reports.findOne({'authorID': authorID, 'from': req.user.username}).exec(function(err, reportResult) {
					if(err || reportResult == '' || reportResult == '[]' || reportResult == '{}' || reportResult == null) {
						var newReports = new Reports({'authorID': authorID, 'commentID': '', 'from': req.user.username, 'against': authorResult.username, 'date': Date.now(), 'reason': reason});
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
		res.redirect('/404');
	}
}

exports.edit = function(req, res) {
	var authorID = sanitize(req.params.authorID).replace(/[^a-z0-9]/gi,'');
	if(authorID.length == 24) {
		var Author = mongoose.model('Author');
		Author.findOne({'_id': authorID, 'username': req.user.username}).exec(function(err, authorResult) {
			if(err || authorResult == '' || authorResult == '[]' || authorResult == '{}' || authorResult == null) {
				res.send('no post to edit');
			} else {
				var editedAuthor = req.body.editedAuthor;
				Author.update({'_id': authorID, 'username': req.user.username}, {'message': editedAuthor}).exec(function(err) {
					if(err) {
						res.send('try again');
					} else {
						res.send('updated');
					}
				});
			}
		});
	} else {
		res.send('/404');
	}
}

exports.remove = function(req, res) {
	var authorID = sanitize(req.params.authorID).replace(/[^a-z0-9]/gi,'');
	if(authorID.length == 24) {
		var Author = mongoose.model('Author');
		Author.findOne({'_id': authorID, 'username': req.user.username}).exec(function(err, authorResult) {
			if(err || authorResult == '' || authorResult == '[]' || authorResult == '{}' || authorResult == null) {
				res.send('no post');
			} else {
				var User = mongoose.model('User');
				User.findOne({'username': req.user.username}).exec(function(err, userResult) {
					if(err) {
						return 0;
					} else {
						var xp = Number(userResult.xp);
						var upvoteXP = Number(authorResult.upvote) * 10;
						var downvoteXP = Number(authorResult.downvote) * 10;
						var newXP = xp - upvoteXP + downvoteXP;
						User.update({'username': req.user.username}, {'xp': newXP}).exec();
					}
				});

				Author.update({'_id': authorID, 'username': req.user.username}, {'username': 'deleted', 'contents': 'deleted', 'upvote': 0, 'downvote': 0}).exec();
				res.redirect('/post/'+id);
			}
		});
	} else {
		res.redirect('/404');
	}
}

exports.postBriefInfo = function(req, res) {
	var authorID = sanitize(req.params.authorID).replace(/[^a-z0-9]/gi,'');
	if(authorID.length == 24) {
		var Author = mongoose.model('Author');
		Author.findOne({'_id': authorID}).select('_id username contents').exec(function(err, authorResult) {
			if(err || authorResult == '' || authorResult == '[]' || authorResult == '{}' || authorResult == null) {
				res.send('no post');
			} else {
				var shortenPostToAFewCharacters = authorResult.contents.substring(0, 150);
				res.send(shortenPostToAFewCharacters);
			}
		});
	} else {
		res.redirect('/404');
	}
}

exports.postInfo = function(req, res) {
	var authorID = sanitize(req.params.authorID).replace(/[^a-z0-9]/gi,'');
	if(authorID.length == 24) {
		var Author = mongoose.model('Author');
		Author.findOne({'_id': authorID}).select('_id username type title image tags edit upvote downvote').exec(function(err, authorResult) {
			if(err || authorResult == '' || authorResult == '[]' || authorResult == '{}' || authorResult == null) {
				res.send('no post');
			} else {
				res.send(authorResult);
			}
		});
	} else {
		res.redirect('/404');
	}
}

exports.commentsCount = function(req, res) {
	var authorID = sanitize(req.params.authorID).replace(/[^a-z0-9]/gi,'');
	if(authorID.length == 24) {
		var Comments = mongoose.model('Comments');
		Comments.count({'authorID': authorID}).exec(function(err, commentCount) {
			if(err || commentCount == '' || commentCount == '[]' || commentCount == '{}' || commentCount == null) {
				res.send('0');
			} else {
				res.send(String(commentCount));
			}
		});
	} else {
		res.redirect('/404');
	}
}

exports.fullContent = function(req, res) {
	var authorID = sanitize(req.params.authorID).replace(/[^a-z0-9]/gi,'');
	if(authorID.length == 24) {
		var Author = mongoose.model('Author');
		Author.findOne({'_id': authorID}).select('_id contents').exec(function(err, authorResult) {
			if(err || authorResult == '' || authorResult == '[]' || authorResult == '{}' || authorResult == null) {
				res.send('no post');
			} else {
				res.send(authorResult);
			}
		});
	} else {
		res.redirect('/404');
	}
}

exports.getComments = function(req, res) {
	var total = sanitize(req.params.total).replace(/[^0-9]/gi,'');
	var authorID = sanitize(req.params.authorID).replace(/[^a-z0-9]/gi,'');

	if(authorID.length == 24) {
		if(total) {
			function totalAmount(total) {
				total = Number(total);
				if(total < 200 && total > 1) {
					return total;
				} else {
					return 200;
				}
			}

			var Author = mongoose.model('Author');
			Author.findOne({'_id': authorID}).exec(function(err, authorResult) {
				if(err || authorResult == '' || authorResult == '{}' || authorResult == '[]' || authorResult == null) {
					res.send('no post');
				} else {
					var Comments = mongoose.model('Comments');
					Comments.find({'authorID': authorID}).limit(totalAmount(total)).exec(function(err, commentResult) {
						if(err || commentResult == '' || commentResult == '{}' || commentResult == '[]' || commentResult == null) {
							res.send('no comments');
						} else {
							res.send(commentResult);
						}
					});
				}
			});
		} else {
			res.send('no total');
		}
	} else {
		res.redirect('/404');
	}

}

exports.article = function(req, res) {
	var articleID = req.params.id.replace(/[^a-z0-9 ]/gi,'');
	if(articleID) {
		res.render('post', {
			title: 'Moola',
			user: req.user,
			postID: articleID
		});
	} else {
		res.redirect('/404');
	}
}
