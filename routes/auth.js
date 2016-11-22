var crypto = require('crypto');
var express = require('express');
var mongoose = require('mongoose');
var Post = require('./../models/post.js');
var User = require('./../models/user.js');
var moment = require('moment');
var uuid = require('node-uuid');
var hmacToken = require('./../config.js');
var router = express.Router();

// logout
router.get('/logout', function(req, res) {
    res.clearCookie('uss');
    res.send('<script>location.replace(document.referrer)</script>');
});

// User login or register
router.post('/', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    if ((username != undefined) && (password != undefined)) {
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
    } else {
        var resText = '<script>alert("username and password could not be empty")</script>\
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
});

module.exports = router;
