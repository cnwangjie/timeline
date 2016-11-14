var express = require('express');
var exphbs = require('express-handlebars');
var mongoose = require('mongoose');
var moment = require('moment');
var Post = require('./models/post.js');
var port = process.env.PORT || 80;
var app = express();

var db = mongoose.connect('mongodb://127.0.0.1:27017/test');
var hbs = exphbs.create({
    defaultLayout: 'main',
    helpers: {
        date: function(timestamp) {
            var time = moment(timestamp);
            return moment.format('lll');
        }
    }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.get('/', function(req, res) {
    res.render('home', {
        title: 'home'
    });
});

app.get('/t/:user', function(req, res) {
    var user = req.params.user;
    Post.find(function(err, posts) {
        if (err) {
            console.log(err);
        }

        res.render('timeline', {
            user: user,
            title: user+'\'s timeline',
            posts: posts
        });
    });
});

app.post('/t/:user/new', function(req, res) {
    var newPost = {
        content: req.params.content,
        user: req.params.user
    }
    Post.create(newPost, function(err) {
        if (err) {
            console.log(err);
            res.status(300);
        } else {
            console.log('new model created!');
            res.status(200).json(newPost);
        }
        db.close();
    });
});

app.post('/t/update/:id', function(req, res) {
    var id = req.params.id;
    var newPost = {
        content: req.params.content
    }
    Post.update({_id: id}, newPost, {upsert: true}, function(err) {
        if (err) {
            console.log(err);
            res.status(300);
        } else {
            console.log('id '+id+' updated!');
            res.status(200).json(newPost);
        }
        db.close();
    });
});

app.delete('/t/delete/:id', function(req, res) {
    var id = req.params.id;
    Post.remove({_id: id}, function(err) {
        if (err) {
            console.log(err);
            res.status(300);
        } else {
            console.log('delete '+id+' ok!');
            res.status(200);
        }
        db.close();
    });
});

app.listen(port);
