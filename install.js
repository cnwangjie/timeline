var fs = require('fs');
var crypto = require('crypto');
var token = crypto.randomBytes(16).toString('hex');
var code = 'module.exports = \'' + token + '\';'
fs.unlink('./config.js', function(err) {
    fs.writeFile('./config.js', code, function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log('installed!');
        }
    })
})
