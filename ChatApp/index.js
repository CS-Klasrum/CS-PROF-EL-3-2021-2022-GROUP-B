
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./helpers/formatDate')

const mysql = require('mysql2');

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "live_chat"
}); 

db.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");

});
const {
  getActiveUser,
  getDuplicate,
  exitRoom,
  newUser,
  getIndividualRoomUsers
} = require('./helpers/userHelper');

const app = express();
const server = http.createServer(app);
const io = socketio(server);


// Set public directory
app.use(express.static(path.join(__dirname, 'public')));


app.use("/chat_messages", (req, res) => {

  db.query("SELECT * FROM chat_messages", (error, messages) => {
    res.end();
  });
  
});

const botName = "SYSTEM";

// this block will run when the client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = newUser(socket.id, username, room);
    db.query("INSERT INTO users (username) VALUES (' " + username + " ')",);

    socket.join(user.room);

    // General welcome
    socket.emit('message', formatMessage(botName,
      `${user.username} Welcome to TARA Live Chat`));

    // Broadcast everytime users connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName,`${user.username} has joined the room`)
      );

    // Current active users and room name
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getIndividualRoomUsers(user.room)
      
    });
  });

  // Listen for client message
  socket.on('chatMessage', msg => {
    const user = getActiveUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
    db.query("INSERT INTO chat_messages (messages) VALUES (' " + msg + " ')");
  });



  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = exitRoom(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} is disconnected`)
      );

      // Current active users and room name
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getIndividualRoomUsers(user.room)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));