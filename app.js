var express = require('express');
var exphbs = require('express-handlebars');
var mongoose = require('mongoose');
var Post = require('./models/post.js');
var port = process.env.PORT || 80;
var app = express();

var db = mongoose.createConnect('mongodb://127.0.0.1:27017/test')

db.on('error', function(err) {
    console.log(error);
});

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/', function(req, res) {
    res.render('home', {
        title: 'home'
    });
});

app.get('/t/:user', function(req, res) {
    var user = req.params.user;
    Post.fetch(user, function(err, posts) {
        if (err) {
            console.log(err);
        }

        res.render('timeline', {
            user: user,
            title: user+'\'s timeline',
            posts: posts
        });
        db.close();
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
