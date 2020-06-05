const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {
  generateLocationMessage,
  generateMessage
} = require('./utils/messages')
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require('./utils//users')

const app = express()
//'create a new server' with the express application
const server = http.createServer(app)
const io = socketio(server) // create a socket io server by passing a raw http server.
const port = process.env.PORT || 3000

const publicDirectory = path.join(__dirname, '../public')

//app.use sets up a middle ware - express.static which is used to serve up static files in the `public directory`
app.use(express.static(publicDirectory))

let count = 0

io.on('connection', (socket) => {

  socket.on('join', (options, callback) => {
    const {
      error,
      user
    } = addUser({
      id: socket.id,
      ...options
    })

    if (error) {
      return callback(error)
    }


    socket.join(user.room) //Makes the socket get a room through which it can interact with other other sockets
    //in the same room
    socket.emit('message', generateMessage('Admin', 'Welcome!'))
    socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`))
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })
    callback()
  })

  socket.on('sendMessage', (message, callback) => {
    user = getUser(socket.id)
    const filter = new Filter()
    if (filter.isProfane(message))
      return callback('Profanity is not allowed')
    io.to(user.room).emit('message', generateMessage(user.username, message))
    callback()
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)
    if (user) {
      io.to(user.room).emit('message', generateMessage(`${user.username} has left`))
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })

  socket.on('sendLocation', (coords, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
    callback()
  })
})
//But how will it know that the client is connected to the server? That is why it has client version of the library,
//which needs to be included in the client version of the JS

server.listen(port, () => {
  console.log(`server is up on port ${port}`)
})