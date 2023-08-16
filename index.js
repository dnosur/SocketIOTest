const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const {Server} = require('socket.io');
const io = new Server(server);

const fs = require('fs');
const { updateUserId, writeDbFile } = require('./helpers/helpers');

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

    //Авторизация. Вызывается после ввода имени пользователя
    socket.on('singUp', (user) => {

        //Если такой пользователь есть - авторизируем его
        if(db.users.find(value => value.name === user.name)) {
            updateUserId(db, user);
            io.emit('auth', db.users[db.users.findIndex(value => value.name === user.name)]);

            return;
        };

        //Если пользователь новый - добавляем его в базу пользователей, и в первый чат
        db.users.push(user);
        db.chats[0].users.push(user);

        //Обновляем базу
        writeDbFile(db);
        io.emit('singUp', user);
    });

    //Отправка сообщения
    socket.on('chat message', (message) => {
        db.chats.forEach((chat, index) => {
            if(chat.chatId === message.chatId){
                db.chats[index].messages.push({
                    user: message.from,
                    message: message.message
                });
            }
        });

        writeDbFile(db);
        io.emit('chat message', message);
    });

    //Подгрузка сообщений чата, которые были отправлены ранее
    socket.on('chat load', (data) => {
        let found = false;

        //Обновляем socket id в базе пользователей для конкретного пользователя
        updateUserId(db, data.user);

        //Поиск нужного нам чата
        db.chats.forEach(chat => {
            console.log(chat.users.find(value => value.name == data.user.name));
            if(chat.chatId == data.chatId && chat.users.find(value => value.name == data.user.name)){
                socket.emit('chat load',{chatId: chat.chatId, messages: chat.messages});
                found = true;
            }
        });

        if(!found) socket.emit('chat load', {error: 'Chat not found!'});
    });

    //Реализация вывода сообщения '{user} печатает'
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