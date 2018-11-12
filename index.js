/* INITIALISATION */

var express = require('express');
var app = express();
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var flash = require('connect-flash');

require('./config/passport')(passport);

mongoose.connect('mongodb://localhost:27017/greatestforumsoftware');

/* MIDDLEWARE */

var options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm', 'html'],
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now())
  }
}

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(cookieParser());
app.use(bodyParser());

app.use(session({secret: "putanginamobobobakla"}));
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

/* ROUTES */

require('./config/routes.js')(app, passport);

/* SERVER */

var port = 8169;

app.listen(port, function() {
	console.log('Listening on port ' + port);
});
