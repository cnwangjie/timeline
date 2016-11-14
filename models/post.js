var mongoose = require('mongoose');
var PostSchema = new mongoose.Schema({
    content: String,
    user: String,
    id: Number,
    meta: {
        created_at: {
            type: Date,
            default: Date.now()
        },
        updated_at: {
            type: Date,
            default: Date.now()
        }
    }
});

PostSchema.pre('save', function(next) {
    var curDate = new Date();
    this.updated_at = curDate;
    if (!this.created_at) {
        this.meta.created_at = curDate;
    }
    next();
});

PostSchema.statics = {
    fetch: function(user, cb) {
        return this
            .find({user: user})
            .sort('meta.createAt')
            exec(cb);
    },
    findById: function(id, cb) {
        return this
            .findOne({_id: id})
            exec(cb);
    }
};

var Post = mongoose.model('Post', PostSchema);
module.exports = Post;
