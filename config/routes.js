module.exports = function(app, passport) {
	function isLoggedIn(req, res, next) {
		if(req.isAuthenticated()) {
			return next();
		} else {
			res.redirect('/sign-in');
		}
	}

	function ifLoggedIn(req, res, next) {
		if(!req.isAuthenticated()) {
			return next();
		}
		res.redirect('/');
	}

	// GENERAL

	var general = require('../config/general.js');

	app.get('/', general.index);
	app.get('/new', general.new);
	app.get('/best', general.best);

	// ACCOUNT

	var user = require('../config/user.js');

	app.get('/sign-in', ifLoggedIn, user.login);
	app.get('/sign-up', ifLoggedIn, user.register);
	app.get('/sign-out', isLoggedIn, user.logout);
	app.get('/settings', isLoggedIn, user.settings);
	app.get('/user', isLoggedIn, user.redirectToProfile);

	app.post('/settings/bio/save', isLoggedIn, user.userBIOSave);
	app.post('/settings/password/save', isLoggedIn, user.userPWSave);

	app.post('/sign-in', passport.authenticate('local-login', {
		successRedirect:'/',
		failureRedirect: '/sign-in',
		failureFlash: true
	}));
	app.post('/sign-up', passport.authenticate('local-signup', {
		successRedirect:'/',
		failureRedirect: '/sign-up',
		failureFlash: true
	}));

	app.get('/profile/:username', user.profile);

	app.get('/notifications', isLoggedIn, user.notifications);
	app.get('/notifications/:number', isLoggedIn, user.getNotifications);
	app.get('/api/timeline/profile', isLoggedIn, user.timeline);

	app.get('/user/canPost', isLoggedIn, user.canPostXPLimit);
	app.get('/user/tags/following', isLoggedIn, user.tagsFollowing);

	app.get('/api/:username/user/brief', user.userBrief);

	app.get('/user/:username/activity', user.userActivity);

	// Moderation

	var moderation = require('../config/moderation.js');

	app.get('/admin', isLoggedIn, moderation.adminPanel);
	app.get('/admin/reports', isLoggedIn, moderation.reportPanel);

	app.get('/admin/ban', isLoggedIn, moderation.banUser);
	app.get('/admin/:type/:bookID/delete', isLoggedIn, moderation.removePost);
	app.get('/api/admin/reports', isLoggedIn, moderation.reports);
	app.get('/api/admin/activity', isLoggedIn, moderation.activity);

	// AUTHOR

	var Author = require('../config/author.js');

	app.post('/author/add', isLoggedIn, Author.addAuthor);

	app.post('/tag/:name', Author.tagSearch);

	app.get('/author/:authorID/upvote', isLoggedIn, Author.upvote);
	app.get('/author/:authorID/downvote', isLoggedIn, Author.downvote);
	app.get('/author/:authorID/status', isLoggedIn, Author.voteStatus);
	app.get('/author/:authorID/report', isLoggedIn, Author.report);
	app.get('/author/:authorID/edit', isLoggedIn, Author.edit);
	app.get('/author/:authorID/remove', isLoggedIn, Author.remove);
	app.get('/author/:authorID/comments/:total', Author.getComments);

	app.get('/post/:authorID/brief', Author.postBriefInfo);
	app.get('/post/:authorID/info', Author.postInfo);
	app.get('/post/:authorID/commentscount', Author.commentsCount);
	app.get('/post/:authorID/fullcontent', Author.fullContent);

	app.get('/post/:id', Author.article);

	// COMMENT

	var comment = require('../config/comment.js');

	app.post('/comment/:authorID/add', isLoggedIn, comment.addComment);
	app.get('/comment/:commentID/upvote', isLoggedIn, comment.upvote);
	app.get('/comment/:commentID/downvote', isLoggedIn, comment.downvote);
	app.get('/comment/:commentID/status', isLoggedIn, comment.voteStatus);
	app.get('/comment/:commentID/report', isLoggedIn, comment.report);
	app.get('/comment/:commentID/edit', isLoggedIn, comment.edit);
	app.get('/comment/:commentID/remove', isLoggedIn, comment.remove);
	app.get('/comment/:commentID', comment.highlight);

	app.get('/comment/:commentID/info', comment.info);
	app.get('/comment/:commentID/short', comment.short);
	app.get('/comment/:commentID/long', comment.long);

	// TIMELINE

	var Timeline = require('../config/timeline.js');

	app.get('/tag/:name/follow', isLoggedIn, Timeline.followTag);
	app.get('/tag/:name/unfollow', isLoggedIn, Timeline.unfollowTag);
	app.get('/api/:name/tags', isLoggedIn, Timeline.tags);
	app.get('/tag/:name/status', isLoggedIn, Timeline.tagStatus);

	app.get('/api/new', Timeline.allNew);
	app.get('/api/best', Timeline.allBest);
	app.get('/api/trending', Timeline.allTrending);

	app.get('/api/timeline', isLoggedIn, Timeline.getTimeline);

	// MESSAGING

	var Message = require('../config/message.js');

	app.post('/message/:to/send', isLoggedIn, Message.messageSend);
	app.get('/messages/:to', isLoggedIn, Message.readMessages);
	app.get('/messages/:id/delete', isLoggedIn, Message.deleteMessage);

	// SEARCH

	var Search = require('../config/search.js');

	app.get('/api/query/:query', Search.search);
	app.get('/api/people/:query', Search.people);

	app.get('/search', Search.page);

	// 404

	app.get('/*', general.error);
}
