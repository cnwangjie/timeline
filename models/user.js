var mongoose = require('mongoose');
var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    created_at: {
        type: Date,
        default: Date.now()
    },
    token: String,
    posts_sum: {
      type: Number,
      default: 0
    }
});

UserSchema.statics = {
    list: function(limit, cb) {
        return this
            .find()
            .sort({created_at: 1})
            .limit(limit)
            .exec(cb);
    }
};

var User = mongoose.model('User', UserSchema);
module.exports = User;
