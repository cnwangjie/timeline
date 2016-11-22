var express = require('express');
var mongoose = require('mongoose');
var Post = require('./../models/post.js');
var User = require('./../models/user.js');
var moment = require('moment');
var uuid = require('node-uuid');
var router = express.Router();


// Timeline page of one user. Browser using.
router.get('/:user', function(req, res) {
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
router.post('/:user/new', function(req, res) {
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
router.get('/post/:id', function(req, res) {
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
router.post('/update/:id', function(req, res) {
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
router.post('/delete/:id', function(req, res) {
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


module.exports = router;
