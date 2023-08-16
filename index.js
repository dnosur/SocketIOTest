const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const {Server} = require('socket.io');
const io = new Server(server);

const fs = require('fs');
const { updateUserId } = require('./helpers/helpers');

const PORT = 3000;

let db = fs.readFileSync('db.json', {encoding: 'utf8', flag: fs.constants.O_CREAT});

if(db.length > 0){
    db = JSON.parse(db);
}
else{
    db = {
        users: [],
        chats: []
    }

    db.chats.push({
        chatId: 0, 
        users: [],
        messages: []
    });
}

app.get('/', (req, res, next) => {
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
    console.log(`User with id ${socket.id} connected!'`);

    socket.on('singUp', (user) => {
        if(db.users.find(value => value.name === user.name)) {
            updateUserId(db, user);
            io.emit('auth', db.users[db.users.findIndex(value => value.name === user.name)]);

            return;
        };

        db.users.push(user);
        db.chats[0].users.push(user);

        fs.writeFile('db.json', JSON.stringify(db),{encoding: 'utf8'}, (err) => {
            console.log(err);
        });
        io.emit('singUp', user);
    });

    socket.on('chat message', (message) => {
        db.chats.forEach((chat, index) => {
            if(chat.chatId === message.chatId){
                db.chats[index].messages.push({
                    user: message.from,
                    message: message.message
                });
            }
        });

        fs.writeFile('db.json', JSON.stringify(db),{encoding: 'utf8'}, (err) => {
            console.log(err);
        });
        io.emit('chat message', message);
    });

    socket.on('chat load', (data) => {

        let found = false;

        updateUserId(db, data.user);

        db.chats.forEach(chat => {
            console.log(chat.users.find(value => value.name == data.user.name));
            if(chat.chatId == data.chatId && chat.users.find(value => value.name == data.user.name)){
                socket.emit('chat load',{chatId: chat.chatId, messages: chat.messages});
                found = true;
            }
        });

        if(!found) socket.emit('chat load', {error: 'Chat not found!'});
    });

    socket.on('writing', (from) => {
        io.emit('writing', { userId: socket.id, from: from });
    });

    socket.on('disconnect', () => {
        console.log(`User with id ${socket.id} disconnect`);
    });
});

server.listen(PORT, () => {
    console.log('Server start at http://localhost:' + PORT + '/')
});