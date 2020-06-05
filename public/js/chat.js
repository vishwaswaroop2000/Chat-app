const socket = io()
const $messages = document.querySelector('#messages')
//Elements
$('#message-form').submit(() => {
  //On sending a message the send button would be disabled until the message is actually sent
  event.preventDefault()
  const message = event.target.elements.message.value
  $('button').attr('disabled', 'disabled')
  socket.emit('sendMessage', message, (error) => {
    $('button').removeAttr('disabled')
    $('input').val('')
    $('input').focus()
    if (error)
      return console.log(error)
  })
})

const {
  username,
  room
} = Qs.parse(location.search, {
  ignoreQueryPrefix: true
})

const autoscroll = () => {
  //New message element
  const $newMessage = $messages.lastElementChild
  //Height of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
  //Visible Height
  const visibleHeight = $messages.offsetHeight
  //Height of message container
  const containerHeight = $messages.scrollHeight
  const scrollOffset = Math.ceil($messages.scrollTop + visibleHeight)
  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on('message', (message) => {
  const html = Mustache.render($('#message-template').html(), {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm A')
  })
  //so what happens is Moustache.render will make the acutal message be render at index.html
  //then this is append to the messages div  below

  $('#messages').append(html)
  autoscroll()
})

socket.on('locationMessage', (urlObject) => {
  const html = Mustache.render($('#location-message-template').html(), {
    username: urlObject.username,
    url: urlObject.url,
    createdAt: moment(urlObject.createdAt).format('h:mm A')
  })

  $('#messages').append(html)
  autoscroll()
})

socket.on('roomData', ({
  room,
  users
}) => {
  const html = Mustache.render($('#sidebar-template').html(), {
    room,
    users
  })
  $('#sidebar').empty()
  $('#sidebar').append(html)
})

$('#send-location').click(() => {
  if (!navigator.geolocation)
    return alert('Geolocation is not supported by your browser.')
  $('#send-location').attr('disabled', 'disabled')
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }, () => {
      $('#send-location').removeAttr('disabled')
    })
  })

})

socket.emit('join', {
  username,
  room
}, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})