var express = require('express');
var mongoose = require('mongoose');
var Post = require('./../models/post.js');
var User = require('./../models/user.js');
var moment = require('moment');
var uuid = require('node-uuid');
var router = express.Router();

router.get(':user/new', function(req, res) {
    
});

module.exports = router;
