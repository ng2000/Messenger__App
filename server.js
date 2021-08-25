require("dotenv").config();
require('./db/conn');
const cookieParser = require('cookie-parser');
const path = require("path");
const auth = require("./middleware/auth")
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
// console.log("public")
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })) //To extract the data from the website to the app.js file


// PUG SPECIFIC STUFF
app.set('view engine', 'pug') // Set the template engine as pug
app.set('views', path.join(__dirname, '/views')) // Set the views directory
app.use(cookieParser())

const loginPageRouter = require('./routes/loginPage');
app.use('/login',loginPageRouter);


// delelting token and removing cookies for current user only
app.get("/logout", auth, async (req, res) => {
  try {
    console.log(req.user)
    try {
      req.user.tokens = req.user.tokens.filter((currentElement) => {
        return currentElement.token !== req.token
      })

    } catch (error) {
      console.log(error)
    }

    res.clearCookie('jwt');
    await req.user.save();

    res.redirect("/login") 
  } catch (error) {
    res.status(500).send(error)
  }
});

// deleting tokens from database to logout all users 
app.get("/logoutall", auth, async (req, res) => {
  try {
    console.log(req.user)
    try {
      req.user.tokens = []
    } catch (error) {
      console.log(error)
    }

    res.clearCookie('jwt');
    await req.user.save();

    res.redirect("/login")
  } catch (error) {
    res.status(500).send(error)
  }

});

const registerPageRoute = require('./routes/registerPage');
app.use('/register',registerPageRoute);

app.get("/", auth , (req, res) => {
  res.redirect("/home")
});
// rendering login page
app.get("/home", auth , (req, res) => {
  res.render("index.pug")
});

app.get("/chat", (req, res) => {
  
  res.redirect("/")
});

app.get("/chat:id",auth, (req, res) => {
  console.log(req.body.username);
  username=req.body.username
  userroom=req.body.room
  console.log(req.params)
  res.render("index.pug",{ 'username': username, 'roomname': req.params.id})
});
app.post("/chat", (req, res) => {
  console.log(req.body.username);
  username=req.body.username
  userroom=req.body.room
  res.render("chat.pug",{ 'username': username, 'roomname':userroom})
});

const botName = 'Bot';

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to Fun-Talk!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
