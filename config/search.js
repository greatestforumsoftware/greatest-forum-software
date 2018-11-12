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

exports.search = function(req, res) {
  var query = sanitize(req.params.query).replace(/[^a-z0-9 \?\!\.\,\'\"\`\-]/gi,'');
  if(query) {
    var Author = mongoose.model('Author');
    Author.find({'title': new RegExp(query)}).limit(10).select('_id title username upvote downvote date').exec(function(err, result) {
      if(err || result == '' || result == '{}' || result == '[]' || result == null) {
        res.send('no result');
      } else {
        res.send(result);
      }
    });
  } else {
    res.send('no result');
  }
}

exports.people = function(req, res) {
  var query = sanitize(req.params.query).replace(/[^a-z0-9 \?\!\.\,\'\"\`\-]/gi,'');
  if(query) {
    var User = mongoose.model('User');
    User.find({'username': new RegExp(query)}).limit(10).select('_id username biography xp created').exec(function(err, result) {
      if(err || result == '' || result == '{}' || result == '[]' || result == null) {
        res.send('no result');
      } else {
        res.send(result);
      }
    });
  } else {
    res.send('no result');
  }
}

exports.page = function(req, res) {
  var query = sanitize(req.query.query).replace(/[^a-z0-9 \?\!\.\,\'\"\`\-]/gi,'');
  if(query) {
    res.render('search', {
      title: '',
      user: req.user,
      search: query
    });
  } else {
    res.send('no result');
  }
}
