// timeline
// author: Wang JIe <i@i8e.net>
// status: Developing...

// require node original modules
var crypto = require('crypto');

// require framework modules
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var exphbs = require('express-handlebars');

// require database model modules
var mongoose = require('mongoose');
var Post = require('./models/post.js');
var User = require('./models/user.js');

// require others modules
var moment = require('moment');
var uuid = require('node-uuid');

// init
var hmacToken = require('./config.js');
var port = process.env.PORT || 8080;
var app = express();

// connect to mongodb
var db = mongoose.connect('mongodb://127.0.0.1:27017/test');

// create handlebars template engine
var hbs = exphbs.create({
    defaultLayout: 'main',

    // handlebars helpers
    helpers: {
        date: function(timestamp) {
            return moment(timestamp).format('YYYY-MM-DD hh:mm:ss');
        }
    }
});

// register template engine
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// Middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser(/*credentials.cookieSecret*/));

// user authentication
app.use(function(req, res, next) {
    var uri = req.path;
    if (req.cookies.uss) {
        var uss = JSON.parse(new Buffer(req.cookies.uss, 'base64').toString());
        User.findOne({username: uss.username}, function(err, user) {
            if (err) {
                console.log(err);
            } else if (user.token == uss.token) {
                req.auth = uss.username;
                next();
            }
        });
    } else {
        next();
    }
});

// It's A no meaning home page
app.get('/', function(req, res) {
    User.list(5, function(err, users) {
        res.render('home', {
            auth: req.auth,
            login: req.auth,
            users: users,
            title: 'home'
        });
    });
});

// User authentication
app.use('/auth', require('./routes/auth.js'));

// RESTful API
app.use('/api', require('./routes/api.js'));

// Browser fronted
app.use('/t', require('./routes/t.js'));

// Application entrance
app.listen(port);
console.log('Server is start at port: '+port);
