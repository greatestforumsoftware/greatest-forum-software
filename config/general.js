var sanitize = require('strip-js');
var mongoose = require('mongoose');

exports.index = function(req, res) {
	if(req.user) {
		res.render('timeline', {
			title: 'Moneva',
			user: req.user
		});
	} else {
		res.render('index', {
			title: 'Moneva',
			user: req.user
		});
	}
};

exports.error = function(req, res) {
	res.render('error', {
		title: 'Moneva',
		user: req.user
	});
}

exports.trending = function(req, res) {
	res.render('trending', {
		title: 'Moneva',
		user: req.user
	});
}

exports.new = function(req, res) {
	res.render('all', {
		title: 'Moneva',
		user: req.user,
		type: 'new'
	});
}

exports.best = function(req, res) {
	res.render('all', {
		title: 'Moneva',
		user: req.user,
		type: 'best'
	});
}
