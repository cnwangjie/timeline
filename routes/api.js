var express = require('express');
var mongoose = require('mongoose');
var Post = require('./../models/post.js');
var User = require('./../models/user.js');
var moment = require('moment');
var uuid = require('node-uuid');
var router = express.Router();

router.use(function(req, res, next) {
    var token = req.body.token;
    User.findOne({token: req.token}, function(err, user) {
        req.user = user.username;
        next();
    });
});

router.get('/:user', function(req, res) {
    var user = req.params.user;
    var start = req.query.start;
    var sum = req.query.sum;
    Post.list(user, start, sum, function(err, posts) {
        if (err) {
            res.status(300).json({
                err: err
            });
        } else {
            var resObj = {};
            for (var i=0;i<posts.length;i+=1) {
                resObj[i] = posts[i];
            }
            res.status(200).json(resObj);
        }
    })
});

router.post('/:user/new', function(req, res) {
    var user = req.params.user;
    var content = req.body.content;
    var id = uuid.v1();
    var time = Date.now();
    if (user == req.user) {
        var  newPost = {
            id: id,
            content: content,
            user: user,
            created_at: time
        };
        Post.create(newPost, function(err) {
            if (err) {
                res.status(300).send(err);
            } else {
                User.update({username: user}, {'$inc': {'posts_sum': 1}}, function(err) {
                    if (err) {
                        res.status(300).send({
                            err: err
                        });
                    } else {
                        res.status(300).send(newPost);
                    }
                });
            }
        });
    }
});

router.put('/post/:id', function(req, res) {
    var content = req.body.content;
    var id = req.params.id;
    Post.findOne({id: id}, function(err, post) {
        if (err) {

        } else if (user == post.user) {
            var newPost = post;
            newPost.content = content;
            Post.update({id: id}, {'$set': {content: content}}, function (err) {

                res.status(200).json(newPost);
            });
        } else {
            res.status(300).json({
               err: 'token error'
            });
        }
    });
});

router.delete('/post/:id', function(req, res) {
    var id = req.params.id;
    Post.findOne({id: id}, function(err, post) {
        if (err) {
            res.status(300).json({
                err: err
            })

        } else if (user == post.user) {
            Post.remove({id: id}, function(err) {
                res.status(200).json({
                    id: id
                })
            });
        } else {
            res.status(300).json({
               err: 'token error'
            });
        }
    });
});

module.exports = router;
