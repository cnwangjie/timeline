var express = require('express');
var exphbs = require('express-handlebars');
var mongoose = require('mongoose');
var Post = require('./models/post.js');
var port = process.env.PORT || 80;
var app = express();

mongoose.connect('mongodb://localhost/test')

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

    })
});

app.post('/t/:user/new', function(req, res) {

});

app.delete('/t/:user/delete/:id', function(req, res) {

});

app.listen(port);
