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

// User login or register
app.post('/auth', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var signtrue = crypto.createHmac('sha256', hmacToken);
    signtrue.update(password);
    var handledPassword = signtrue.digest().toString('base64');
    User.findOne({username: username}, function(err, user) {
        if (err) {
            console.log(err);
        } else if (user == null) {
            var newUser = {
                username: username,
                password: handledPassword,
                token: uuid()
            };
            User.create(newUser, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    var resText = '<script>alert("register success, you can re-enter your user name and password to login")</script>\
                    <form class="navbar-form navbar-right" id="auther" ic-post-to="/auth" ic-target="#auther" ic-replace-target="true" class="form-inline" role="form">\
                      <div class="form-group">\
                        <label class="sr-only">Username</label>\
                        <input type="text" class="form-control" name="user" placeholder="Enter Username" value="' + username + '">\
                      </div>\
                      <div class="form-group">\
                        <label class="sr-only">Password</label>\
                        <input type="password" class="form-control" name="password" placeholder="Password">\
                      </div>\
                      <button type="submit" class="btn btn-default">register/login</button>\
                    </form>';
                    res.status(200).send(resText);
                }
            });
        } else {
            if (user.password == handledPassword) {
                var token = user.token;
                var cookie = {
                    username: username,
                    token: token
                }
                var uss = new Buffer(JSON.stringify(cookie)).toString('base64');
                res.cookie('uss', uss, {maxAge: 604800000});
                var resText = '<script>location.reload()</script>';
                res.status(200).send(resText);
            } else {
                var resText = '<script>alert("password incorrent\nif the user name not belongs to you please change the input\nif you do not have a account we will create one for you")</script>\
                <form class="navbar-form navbar-right" id="auther" ic-post-to="/auth" ic-target="#auther" ic-replace-target="true" class="form-inline" role="form">\
                  <div class="form-group">\
                    <label class="sr-only">Username</label>\
                    <input type="text" class="form-control" name="user" placeholder="Enter Username">\
                  </div>\
                  <div class="form-group">\
                    <label class="sr-only">Password</label>\
                    <input type="password" class="form-control" name="password" placeholder="Password">\
                  </div>\
                  <button type="submit" class="btn btn-default">register/login</button>\
                  </form>';
                res.status(200).send(resText);
            }
        }
    });
});

// logout
app.get('/logout', function(req, res) {
    res.clearCookie('uss');
    res.send('<script>location.replace(document.referrer)</script>');
});

// Timeline page of one user. Browser using.
app.get('/t/:user', function(req, res) {
    var user = req.params.user;
    if (req.query.page) {
        var page = req.query.page;
        Post.list(user, (page-1)*5, 5, function(err, posts) {
            if (err) {
                console.log(err);
            }
            var resText = '';
            console.log(posts);
            for (var i=0;i<posts.length;i+=1) {
                resText += '<div id=' + posts[i].id + ' class="jumbotron">\
                        <p>' + moment(posts[i].created_at).format('YYYY-MM-DD hh:mm:ss') + '</p><hr>\
                        <p>' + posts[i].content + '</p>';
                if (req.auth == user) {
                    resText += '<a ic-get-from="./post/' + posts[i].id + '" ic-target="#' + posts[i].id + '" class="btn btn-warning" role="button">Edit</a>\
                    <a ic-delete-from="./delete/' + posts[i].id + '" ic-confirm="Are you sure?" ic-target="#' + posts[i].id + '" class="btn btn-danger" role="button">Delete</a>';
                }
                resText += '</div>';
            }
            if (posts.length == 5) {
                resText += '<div id="loader" class="jumbotron">\
                    <a ic-get-from="./' + user + '?page=' + (parseInt(page)+1) + '" ic-target="#loader" ic-replace-target="true" class="btn btn-default btn-lg btn-block" role="button">Load More</a>\
                </div>';
            } else {
                resText += '<div class="jumbotron">\
                    <h2>no more posts</h2>\
                </div>';
            }
            res.status(200).send(resText);
        });
    } else {
        Post.list(user, 0, 5, function(err, posts) {
            if (err) {
                console.log(err);
            }

            res.render('timeline', {
                auth: (req.auth==user)?req.auth:null,
                login: req.auth,
                user: user,
                title: user+'\'s timeline',
                posts: posts
            });

        });
    }
});

// Browser side use ajax create route
app.post('/t/:user/new', function(req, res) {
    var now = Date.now();
    var content = req.body.content;
    var user = req.params.user;
    if (req.auth == user) {
        var id = uuid.v1();
        var newPost = {
            id: id,
            content: content,
            user: user,
            created_at: now
        }
        Post.create(newPost, function(err) {
            if (err) {
                console.log(err);
                res.status(300);
            } else {
                User.update({username: user}, {'$inc': {'posts_sum': 1}}, function(err) {
                    var resText = '<div id="writer" class="jumbotron">\
                        <form ic-post-to="./' + user + '/new" ic-target="#writer" ic-replace-target="true" role="form">\
                            <div class="form-group">\
                                <textarea name="content" class="form-control" rows="3"></textarea>\
                            </div>\
                            <div class="form-group">\
                                <button type="submit" class="btn btn-default">add</button>\
                            </div>\
                        </form>\
                    </div>';
                    resText += '<div id=' + id + ' class="jumbotron">\
                            <p>' + moment(now).format('YYYY-MM-DD hh:mm:ss') + '</p><hr>\
                            <p>' + content + '</p>\
                                <a ic-get-from="./post/' + id + '" ic-target="#' + id + '" class="btn btn-warning" role="button">Edit</a>\
                                <a ic-delete-from="./delete/' + id + '" ic-confirm="Are you sure?" ic-target="#' + id + '" class="btn btn-danger" role="button">Delete</a>\
                        </div>'
                    res.status(200).send(resText);

                });
            }
        });
    }
});

// Browser side use ajax loader.
app.get('/t/post/:id', function(req, res) {
    var id = req.params.id;
    Post.findOne({id: id}, function(err, post) {
        if (err) {
            console.log(err);
        } else {
            var resText = '<form ic-put-to="./update/' + post.id + '" ic-target="#' + post.id + '">\
              <div class="form-group">\
                <textarea type="text" name="content" id="content" class="form-control" rows="3">' + post.content + '</textarea>\
              </div>\
              <div class="form-group">\
                <button type="submit" class="btn btn-default">Save</button>\
              </div>\
            </form>\
            ';
            res.status(200).send(resText);
        }
    });
});

// Browser side use ajax updater.
app.post('/t/update/:id', function(req, res) {
    var id = req.params.id;
    var content = req.body.content;
    var newPost = {
        content: content
    }
    Post.findOne({id: id}, function(err, post) {
        if (err) {
            console.log(err);
        } else if (post.user == req.auth) {
            Post.update({id: id}, {'$set': newPost}, function(err) {
                if (err) {
                    console.log(err);
                    res.status(300);
                } else {
                    Post.findOne({id: id}, function(err, post) {
                        if (err) {
                            console.log(err);
                        } else {
                            var resText = '<p>' + moment(post.created_at).format('YYYY-MM-DD hh:mm:ss') + '</p><hr>\
                                    <p>' + post.content + '</p>\
                                    <a ic-get-from="./post/' + post.id + '" ic-target="#' + post.id + '" class="btn btn-warning" role="button">Edit</a>\
                                    <a ic-delete-from="./delete/' + post.id + '" ic-confirm="Are you sure?" ic-target="#' + post.id + '" class="btn btn-danger" role="button">Delete</a>\
                            ';
                            res.status(200).send(resText);
                        }
                    });
                }
            });
        }
    });
});

// Browser side use ajax deleter.
app.post('/t/delete/:id', function(req, res) {
    var id = req.params.id;
    Post.findOne({id: id}, function(err, post) {
        if (err) {
            console.log(err);
        } else if (post.user == req.auth) {
            User.update({username: post.user}, {'$inc': {posts_sum: -1}}, function(err) {
                Post.remove({id: id}, function(err) {
                    if (err) {
                        console.log(err);
                        res.status(300);
                    } else {
                        res.append('X-IC-Remove', 'true').send();
                    }
                });
            });
        }
    });
});

app.listen(port);
console.log('Server is start at port: '+port);
