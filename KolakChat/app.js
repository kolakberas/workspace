var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var mongoose = require('mongoose');
mongoose.connect('mongodb://heroku_pptjbc1l:nii97hpdgrlut2k6jkul0hnog@ds041394.mongolab.com:41394/heroku_pptjbc1l', function(err) {
    if (!err) {
        console.log('connected to MongoDB');
    }
    else {
        throw err;
    }
});

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

// User Account database schema
var accountSchema = new Schema({
    name: String,
    email: String,
    username: String,
    password: String
});
var Account = mongoose.model('Account', accountSchema);

var cool = require('cool-ascii-faces');
var nicknames = [];

server.listen(process.env.PORT || 3000);
    
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket) {
    // User login event
    socket.on('login', function(data, callback) {
        Account.find({username: data.username, password: data.password}, function (err, docs) {
            if (docs.length == 0) {
                callback(false);
            }
            else {
                callback(true);
                nicknames.push(data.username);
                socket.nickname = data.username;
                console.log('Nicknames are  ' + nicknames);
                io.sockets.emit('nicknames', nicknames);
                io.sockets.emit('user join', { nick: socket.nickname });
            }
        });
    });
    
    // User create new account event
    socket.on('create account', function(data, callback) {
        Account.find({username: data.username}, function(err, docs) {
            if (docs.length == 0) {
                var account = new Account ({
                                    name: data.name,
                                    email: data.email,
                                    username: data.username,
                                    password: data.password
                                });
                                
                account.save(function (err) {
                    if (!err) {
                        callback(true);
                        nicknames.push(data.username);
                        socket.nickname = data.username;
                        console.log('Nicknames are  ' + nicknames);
                        io.sockets.emit('nicknames', nicknames);
                        io.sockets.emit('user join', { nick: socket.nickname });
                    }
                    else {
                        console.log(err);
                        callback(false);
                    }
                });
            }
            else {
                callback(false);
            }
        });
    });
    
    // User send a message event
    socket.on('user message', function(data) {
        io.sockets.emit('user message', {
            nick: socket.nickname,
            message: data
        });
    });
    
    // Cool emoticon event
    socket.on('kolak', function(data) {
        io.sockets.emit('user message', {
            nick: socket.nickname,
            message: cool()
        });
    });
    
    // User disconnect event
    socket.on('disconnect', function() {
        if (!socket.nickname) return;
        if (nicknames.indexOf(socket.nickname) > -1) {
            nicknames.splice(nicknames.indexOf(socket.nickname), 1);
        }
        console.log('Nicknames are  ' + nicknames);
        io.sockets.emit('nicknames', nicknames);
        io.sockets.emit('user left', { nick: socket.nickname });
    });
});
