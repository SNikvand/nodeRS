const socket = io()
// On socketio connection emit the tls socket key

const shellInput = document.getElementById('shell-input')
const clientId = document.getElementById('client-id')

socket.emit('bind', clientId.innerHTML)

shellInput.addEventListener('keypress', (e) => {
    if (e.key == 'Enter') {
        socket.emit('cmd', {
            clientId: clientId.innerHTML,
            shellInput: shellInput.value
        })
        shellInput.value = ''
    }
})

socket.on('cmdRes', (data) => {
    console.log(data)
})