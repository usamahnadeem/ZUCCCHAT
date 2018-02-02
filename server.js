const express = require('express');
const app = express();
const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;
//const http = require('http').Server(app)
const io = require('socket.io');



// Connect to mongo
mongo.connect('mongodb://localhost:32768/mongochat', function(err, db){
    if(err){
        console.log(err);
    }

    console.log('MongoDB connected...');

    app.get('', function(req,res){
        res.sendFile(__dirname + '/index.html');
    })

    app.use(express.static(__dirname + "/"));

    app.get('/zucc', function(req,res){
        res.sendFile(__dirname + '/zucc.html');
    })


    // Connect to Socket.io
    client.on('connection', function(socket){
        let chat = db.db('mongochat').collection('chat');

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                console.log(err);
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            // Check for name and message
            if(name == '' || message == ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                chat.insert({name: name, message: message}, function(){
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});

app.listen(3000, function(){
    console.log('listening on port 3000');
})