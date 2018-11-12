var mongoose = require('mongoose');
var request = require('request');
var Author = require('../db/author');
var Notifications = require('../db/notifications');
var Comments = require('../db/comments');
var commentVotes = require('../db/commentupvotes.js');
var Reports = require('../db/report');
var Tags = require('../db/tags');
var sanitize = require('strip-js');
var followTag = require('../db/followtag.js');

exports.followTag = function(req, res) {
  var tagName = sanitize(req.params.name).replace(/[^a-z0-9]/gi,'');
  if(tagName.length < 30 && tagName.length > 3) {
    var followTag = mongoose.model('followTag');
    followTag.findOne({'tagName': tagName, 'username': req.user.username}).exec(function(err, followTagResult) {
      if(err || followTagResult == '' || followTagResult == '[]' || followTagResult == '{}' || followTagResult == null) {
        followTag.count({'username': req.user.username}).exec(function(err, tagCount) {
          if(Number(tagCount) <= 100) {
            var newFollowTag = new followTag({'tagName': tagName, 'username': req.user.username});
            newFollowTag.save();
            res.send('following tag');
          } else {
            res.send('max tag follow limit at 100');
          }
        });
      } else {
        res.send('unable to follow tag');
      }
    });
  } else {
    res.send('unable to follow tag');
  }
}

exports.unfollowTag = function(req, res) {
  var tagName = sanitize(req.params.name).replace(/[^a-z0-9]/gi,'');
  if(tagName.length < 30 && tagName.length > 3) {
    var followTag = mongoose.model('followTag');
    followTag.findOne({'tagName': tagName, 'username': req.user.username}).exec(function(err, followTagResult) {
      if(err || followTagResult == '' || followTagResult == '[]' || followTagResult == '{}' || followTagResult == null) {
        res.send('unable to unfollow tag');
      } else {
        followTag.remove({'tagName': tagName, 'username': req.user.username}).exec();

        res.send('tag unfollowed');
      }
    });
  } else {
    res.send('unable to follow tag');
  }
}

exports.tags = function(req, res) {
  var tagName = sanitize(req.params.name).replace(/[^a-z0-9]/gi,'');
  if(tagName.length < 30 && tagName.length > 3) {
    var Tags = mongoose.model('Tags');
    Tags.findOne({'tagName': tagName}).exec(function(err, tagResult) {
      res.send(tagResult);
    });
  } else {
    res.send('unable to follow tag');
  }
}

exports.tagStatus = function(req, res) {
  var tagName = sanitize(req.params.name).replace(/[^a-z0-9]/gi,'');
  if(tagName.length < 30 && tagName.length > 3) {
    var followTag = mongoose.model('followTag');
    followTag.findOne({'tagName': tagName, 'username': req.user.username}).exec(function(err, followTagResult) {
      if(err || followTagResult == '' || followTagResult == '[]' || followTagResult == '{}' || followTagResult == null) {
        res.send('following tag');
      } else {
        res.send('not following');
      }
    });
  } else {
    res.send('not following');
  }
}

exports.getTimeline = function(req, res) {
  var Author = mongoose.model('Author');
  Author.find().select('_id username date').sort({'date': 1}).exec(function(err, authorResult) {
    if(err) {
      res.send('error');
    } else {
      res.send(authorResult);
    }
  });
}

exports.allNew = function(req, res) {
  var Author = mongoose.model('Author');
  Author.find().select('_id username date').limit(15).sort({'date': 1}).exec(function(err, results) {
    if(err) {
      res.redirect('/404');
    } else {
      res.send(results);
    }
  });
}

exports.allBest = function(req, res) {
  var Author = mongoose.model('Author');
  Author.find().select('_id username date upvote').limit(15).sort({'upvote': 1}).exec(function(err, results) {
    if(err) {
      res.redirect('/404');
    } else {
      res.send(results);
    }
  });
}

exports.allTrending = function(req, res) {
  var Author = mongoose.model('Author');
  Author.find().select('_id username date upvote').limit(15).sort({'upvote': 1, 'date': 1}).exec(function(err, results) {
    if(err) {
      res.redirect('/404');
    } else {
      res.send(results);
    }
  });
}
