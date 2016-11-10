var mongoose = require('mongoose');
var PostSchema = new mongoose.Schema({
    content: String,
    user: String,
    id: Number,
    meta: {
        createAt: {
            type: Date,
            default: Date.now()
        },
        updateAt: {
            type: Date,
            default: Date.now()
        }
    }
});

PostSchema.pre('new', function(next) {
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now();
    } else {
        this.meta.updateAt = Date.now()
    }

    next();
});

PostSchema.statics = {
    fetch: function(user, cb) {
        return this
            .find({_user: user})
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
