var mongoose = require('mongoose');
var request = require('request');
var Author = require('../db/author');
var Loves = require('../db/loves');
var Notifications = require('../db/notifications');
var Comments = require('../db/comments');
var Reports = require('../db/report');

exports.trendingAPI = function (req, res) {
	var Trending = mongoose.model('Trending');
	Trending.find({}).sort({'likes': 1}).limit(100).exec(function(err, trendingResults) {
		res.send(trendingResults);
	});
}

exports.trendingNewAPI = function (req, res) {
	var Trending = mongoose.model('Trending');
	Trending.find({}).sort({'created': 1}).limit(100).exec(function(err, trendingResults) {
		res.send(trendingResults);
	});
}

exports.loveAdd = function(req, res) {
	var user = req.user.username;
	var post = req.params.post;
	if(/^[a-zA-Z0-9]+$/.test(user) == true && /^[a-zA-Z0-9]+$/.test(post) == true) {
		var Books = mongoose.model('Book');
		Books.findOne({'_id': post}, function(err, bookResult) {
			if(err || bookResult == '' || bookResult == '{}' || bookResult == '[]' || bookResult == null || bookResult.username == user) {
				res.send('like');
			} else {

				var Loves = mongoose.model('Love');
				Loves.findOne({'bookID': post, 'username': user}, function(err, loveResult) {
					if(err || loveResult == '' || loveResult == '{}' || loveResult == '[]' || loveResult == null) {

						// create new love

						var bloodyPostThing = String(post);

						var Love = mongoose.model('Love');
						var newLove = new Love({'username': req.user.username, 'bookID': bloodyPostThing, 'date': Date.now()});

						newLove.save();

						// increase trending number

						var Trending = mongoose.model('Trending');
						Trending.findOne({'bookID': bloodyPostThing}, function(err, trendingResult) {
							if(err || trendingResult == '' || trendingResult == '[]' || trendingResult == '{}' || trendingResult == null) {
								var newTrending = new Trending({'bookID': String(post), 'likes': 1, 'created': Date.now()});
								newTrending.save();
							} else {
								trendingResult.likes++;
								trendingResult.save();
							}
						});

						// create notification

						var Notifications = mongoose.model('Notification');
						var newNotification = new Notifications();

						newNotification.username = bookResult.username;
						newNotification.sender = user;
						newNotification.date = Date.now();
						newNotification.message = 'has loved a book you\'ve posted, ' + bookResult.title;
						newNotification.read = 0;

						newNotification.save();

						res.send('unlike');
					}
				});
			}
		});
	} else {
		res.send('error');
	}
};

exports.loveRemove = function(req, res) {
	var user = req.user.username;
	var post = req.params.post;
	if(/^[a-zA-Z0-9]+$/.test(user) == true && /^[a-zA-Z0-9]+$/.test(post) == true) {
		var Loves = mongoose.model('Love');
		Loves.remove({'username': String(user), 'bookID': String(post)}, function(err,save) {
			res.send('like');
		});

		var Trending = mongoose.model('Trending');
		Trending.findOne({'bookID': String(post)}).exec(function(err, trendingResult) {
			trendingResult.likes--;
			trendingResult.save();

		});
	} else {
		res.send('{"error": "no username found"}');
	}
}

exports.loveStatus = function(req, res) {
	if(req.user) {
		var user = req.user.username;
		var post = req.params.post;
		if(/^[a-zA-Z0-9]+$/.test(user) == true && /^[a-zA-Z0-9]+$/.test(post) == true) {
			var Loves = mongoose.model('Love');
			Loves.findOne({'username': String(req.user.username), 'bookID': String(post)}, function(err, loveResult) {
				if(err || loveResult == '' || loveResult == '{}' || loveResult == '[]' || loveResult == null) {
					var Books = mongoose.model('Book');
					Books.findOne({'_id': String(post)}, function(err, bookResult) {
						if(err || bookResult == '' || bookResult == '{}' || bookResult == '[]' || bookResult == null) {
							res.send('noshow');
						} else if (bookResult.username == String(user)) {
							res.send('noshow');
						} else {
							res.send('like');
						}
					});
				} else {
					res.send('unlike');
				}
			});
		} else {
			res.send('noshow');
		}
	} else {
		res.send('noshow');
	}
}

exports.bookStatus = function(req, res) {
	var post = req.params.post;
	if(/^[a-zA-Z0-9]+$/.test(post) == true) {
		var Books = mongoose.model('Book');
		Books.findOne({'_id': post}, function(err, bookResult) {
			if(err || bookResult == '' || bookResult == '{}' || bookResult == '[]' || bookResult == null || bookResult == undefined) {
				res.send('false');
			} else {
				res.json(bookResult);
			}
		});
	} else {
		res.send('false');
	}
}

exports.quantityStatus = function(req, res) {
	var post = req.params.post;
	if(/^[a-zA-Z0-9]+$/.test(post) == true) {
		var Loves = mongoose.model('Love');
		Loves.count({'bookID': post}, function(err, bookResult) {
			if(err || bookResult == '' || bookResult == '{}' || bookResult == '[]' || bookResult == null || bookResult == undefined) {
				res.send('0');
			} else {
				res.json(bookResult);
			}
		});
	} else {
		res.send('0');
	}
}

exports.comments = function(req, res) {
	var post = req.params.post;
	if(/^[a-zA-Z0-9]+$/.test(post) == true) {
		var Comments = mongoose.model('Comments');
		Comments.findOne({'bookID': String(post), 'pinned': 1}).exec(function(err, pinnedComment) {
			if(err) {
				res.send('no');
			} else {
				Comments.find({'bookID': String(post), 'pinned': 0}).sort({'date': 1}).limit(100).exec(function(err, commentsResult) {
					if(err || commentsResult == '' || commentsResult == '{}' || commentsResult == '[]' || commentsResult == null) {
						res.send('no');
					} else {
						var o = {};
						var pinned = "pinned";
						o[pinned] = [];
						o[pinned].push(pinnedComment);
						var comments = "comments";
						o[comments] = [];
						o[comments].push(commentsResult);
						res.send(o);
					}
				});
			}
		});
	} else {
		res.send('no');
	}
}

exports.composeComment = function(req, res) {
	var post = String(req.params.post);
	var comments = String(req.body.comments);
	if(/^[a-zA-Z0-9]+$/.test(post) == true && /^[a-zA-Z0-9\,\.\-\' ]+$/.test(comments) == true && comments.length <= 150 && comments.length >= 5) {
		var Books = mongoose.model('Book');
		var comments = comments.replace(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, '***');
		Books.findOne({'_id': post}, function(err, bookInfo) {
			if(err || bookInfo == '' || bookInfo == '{}' || bookInfo == '[]' || bookInfo == null) {
				res.send('no');
			} else {
				var Comments = mongoose.model('Comments');
				Comments.findOne({'bookID': String(post), 'from': String(bookInfo.username), 'message': String(comments)}).exec(function(err, commentsResult) {
					if(err || commentsResult == '' || commentsResult == '{}' || commentsResult == '[]' || commentsResult == null) {
						var newComments = new Comments({'bookID': String(post), 'from': String(req.user.username), 'message': String(comments), 'pinned': 0, 'date': Date.now()});
						newComments.save();

						var Notification = mongoose.model('Notification');
						var newNotification = new Notification({'username': bookInfo.username, 'sender': String(req.user.username), 'date': Date.now(), 'message': 'has commented on your <a href="/profile/'+bookInfo.username+'/'+post+'">post</a>', 'read': 0});
						newNotification.save();

						res.send('sent');
					} else {
						res.send('spam');
					}
				});
			}
		});
	} else {
		res.send('no');
	}
}

exports.pinComment = function(req, res) {
	var commentID = String(req.params.comment);
	if(/^[a-zA-Z0-9]+$/.test(commentID) == true) {
		var Comments = mongoose.model('Comments');
		Comments.findOne({'_id': commentID, 'from': String(req.user.username)}, function(err, comment) {
			if(err || comment == '' || comment == '[]' || comment == '{}' || comment == null) {
				res.send('no');
			} else {
				Comments.findOne({'bookID': comment.bookID, 'from': String(req.user.username), 'pinned': 1}, function(err, commentedPinned) {
					if(err || commentedPinned == '' || commentedPinned == '{}' || commentedPinned == '[]' || commentedPinned == null) {
						Comments.update({'_id': commentID, 'from': String(req.user.username), 'bookID': String(comment.bookID)}, {'pinned': true},{upsert: true}).exec(function(err, newPinned) {
							if(err) {
								res.send('no');
							} else {
								res.send('yes');
							}
						});
					} else {
						res.send('no');
					}
				});
			}
		});
	} else {
		res.send('no');
	}
};

exports.unpinComment = function(req, res) {
	var commentID = String(req.params.comment);
	if(/^[a-zA-Z0-9]+$/.test(commentID) == true) {
		var Comments = mongoose.model('Comments');
		Comments.findOne({'_id': commentID, 'from': String(req.user.username)}, function(err, comment) {
			if(err || comment == '' || comment == '[]' || comment == '{}' || comment == null) {
				res.send('no');
			} else {
				var Books = mongoose.model('Book');
				Books.findOne({'_id': comment.bookID, 'username': String(req.user.username)}, function(err, bookResult) {
					if(err || bookResult == '' || bookResult == '[]' || bookResult == '{}' || bookResult == null) {
						res.send('no');
					} else {
						Comments.update({'_id': commentID, 'pinned': true, 'from': String(req.user.username), 'bookID': bookResult._id}, {'pinned': false},{upsert: true}).exec(function(err, save) {
								if(err) {
									res.send('no');
								} else {
									res.send('yes');
								}
						});
					}
				})
			}
		});
	} else {
		res.send('no');
	}
}

exports.reportPost = function(req, res) {
	var post = String(req.params.post);
	if(/^[a-zA-Z0-9]+$/.test(post) == true) {
		var Book = mongoose.model('Book');
		Book.findOne({'_id': post}, function(err, bookResult) {
			if(err || bookResult == '' || bookResult == '{}' || bookResult == '[]' || bookResult == null) {
				res.send('no');
			} else {
				if(bookResult.username == String(req.user.username)) {
					res.send('no');
				} else {

					// create report

					var Report = mongoose.model('Report');
					var newReport = new Report({'bookID': post, 'from': String(req.user.username), 'date': Date.now()});
					newReport.save();

					res.redirect('/');
				}
			}
		});
	} else {
		res.send('no');
	}
}

exports.deletePost = function(req, res) {
	var username = String(req.params.username);
	var post = String(req.params.post);
	if(/^[a-zA-Z0-9]+$/.test(post) == true && /^[a-zA-Z0-9]+$/.test(username) == true) {
		var Book = mongoose.model('Book');
		Book.findOne({'_id': post, 'username': String(req.user.username)}, function(err, bookResult) {
			if(err || bookResult == '' || bookResult == '[]' || bookResult == '{}' || bookResult == null) {
				res.send('no');
			} else {

				// delete comments, loves for this post

				var Comments = mongoose.model('Comments');
				Comments.count({'bookID': post}, function(err, commentsCount) {
					if(err || commentsCount == '' || commentsCount == '[]' || commentsCount == '{}' || commentsCount == null) {
						return false;
					} else {
						for(var i = 0; i < commentsCount; i++) {
							Comments.remove({'bookID': post}, function(err, commentsSave) {
								if(err) {
									return false;
								}
							});
						}
					}
				});

				var Loves = mongoose.model('Love');
				Loves.count({'bookID': post}, function(err, loveCount) {
					if(err || loveCount == '' || loveCount == '[]' || loveCount == '{}' || loveCount == null) {
						return false;
					} else {
						for (var i = 0; i < loveCount; i++) {
							Loves.remove({'bookID': post}, function(err, loveRemove) {
								if(err) {
									return false;
								}
							});
						}
					}
				});

				// delete trending

				var Trending = mongoose.model('Trending');
				Trending.remove({'bookID': post}).exec();

				// then remove post

				Book.remove({'_id': post, 'username': String(req.user.username)}, function(err, remove) {
					if(err) {
						return false;
					}
				});

				res.redirect('/profile/'+username);
			}
		});
	} else {
		res.send('no');
	}
}

exports.markAsRead = function(req, res) {
	var post = String(req.params.post);
	var username = String(req.params.username);
	if(/^[a-zA-Z0-9]+$/.test(post) == true && /^[a-zA-Z0-9]+$/.test(username) == true) {
		var Books = mongoose.model('Book');
		Books.findOne({'_id': post, 'username': String(req.user.username)}).exec(function(err, bookFindOne) {
			if(err || bookFindOne == '' || bookFindOne == '{}' || bookFindOne == '[]' || bookFindOne == null) {
				res.redirect('/');
			} else {
				Books.update({'_id': post, 'username': String(req.user.username), 'duration': 0}, {'duration': 1},{upsert: true}).exec(function(err) {
					res.redirect('/profile/'+req.user.username+'/'+post);
				});
			}
		});
	} else {
		res.redirect('/');
	}
}

exports.bookInfoGet = function (req,res) {
	var post = String(req.params.post);
	if(/^[a-zA-Z0-9]+$/.test(post) == true && post.length == 24) {

		var Book = mongoose.model('Book');
		Book.findOne({'_id': post}).exec(function (err, save) {
			res.send(save);
		});
	} else {
		res.send('false');
	}
}
