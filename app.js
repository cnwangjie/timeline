var express = require('express');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var mongoose = require('mongoose');
var moment = require('moment');
var uuid = require('node-uuid');
var Post = require('./models/post.js');
var port = process.env.PORT || 8080;
var app = express();

var db = mongoose.connect('mongodb://127.0.0.1:27017/test');
var hbs = exphbs.create({
    defaultLayout: 'main',
    helpers: {
        date: function(timestamp) {
            return moment(timestamp).format('YYYY-MM-DD hh:mm:ss');
        }
    }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(req, res) {
    res.render('home', {
        title: 'home'
    });
});

app.get('/t/:user', function(req, res) {
    var user = req.params.user;
    if (req.query.page) {
        var page = req.query.page;
        Post.list((page-1)*5, 5, function(err, posts) {
            if (err) {
                console.log(err);
            }
            var resText = '';
            console.log(posts);
            for (var i=0;i<posts.length;i+=1) {
                resText += "<div id=" + posts[i].id + " class='jumbotron'>\
                        <p>" + moment(posts[i].created_at).format('YYYY-MM-DD hh:mm:ss') + "</p><hr>\
                        <p>" + posts[i].content + "</p>\
                        <a class='btn btn-warning' role='button'>Edit</a>\
                        <a class='btn btn-danger' role='button'>Delete</a>\
                    </div>";
            }
            resText += "<div id='loader' class='jumbotron'>\
                <a ic-get-from='./" + user + "?page=" + (parseInt(page)+1) + "' ic-target='#loader' ic-replace-target='true' class='btn btn-default btn-lg btn-block' role='button'>Load More</a>\
            </div>";
            res.status(200).send(resText);
        });
    } else {
        Post.list(0, 5, function(err, posts) {
            if (err) {
                console.log(err);
            }

            res.render('timeline', {
                user: user,
                title: user+'\'s timeline',
                posts: posts
            });
        });
    }
});

app.post('/t/:user/new', function(req, res) {
    var now = Date.now();
    var content = req.body.content;
    var user = req.params.user;
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
            var resText = "<div id='writer' class='jumbotron'>\
                <form ic-post-to='./" + user + "/new' ic-target='#writer' ic-replace-target='true' role='form'>\
                    <div class='form-group'>\
                        <textarea name='content' class='form-control' rows='3'></textarea>\
                    </div>\
                    <div class='form-group'>\
                        <button type='submit' class='btn btn-default'>add</button>\
                    </div>\
                </form>\
            </div>";
            resText += "<div id=" + id + " class='jumbotron'>\
                    <p>" + moment(now).format('YYYY-MM-DD hh:mm:ss') + "</p><hr>\
                    <p>" + content + "</p>\
                    <a class='btn btn-warning' role='button'>Edit</a>\
                    <a class='btn btn-danger' role='button'>Delete</a>\
                </div>"
            res.status(200).send(resText);
        }
    });
});

app.post('/t/update/:id', function(req, res) {
    var id = req.params.id;
    var content = req.body.content;
    var newPost = {
        content: content
    }
    Post.update({id: id}, newPost, {upsert: true}, function(err) {
        if (err) {
            console.log(err);
            res.status(300);
        } else {
            console.log('id '+id+' updated!');
            res.status(200).json(newPost);
        }
    });
});

app.post('/t/delete/:id', function(req, res) {
    var id = req.params.id;
    console.log('start delete' + id);
    Post.remove({id: id}, function(err) {
        if (err) {
            console.log(err);
            res.status(300);
        } else {
            console.log('delete '+id+' ok!');
            res.set('X-IC-Remove', 'true');
        }
    });
});

app.listen(port);
