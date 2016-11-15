var mongoose = require('mongoose');
var PostSchema = new mongoose.Schema({
    content: String,
    user: String,
    id: Number,
    created_at: {
        type: Date,
        default: Date.now()
    }
});

PostSchema.statics = {
    list: function(start, limit, cb) {
        return this
            .find()
            .sort({created_at: -1})
            .skip(start)
            .limit(limit)
            .exec(cb);
    }
};

var Post = mongoose.model('Post', PostSchema);
module.exports = Post;
