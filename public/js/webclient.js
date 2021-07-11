const socket = io()

const shellInput = document.getElementById('shell-input')
const clientId = document.getElementById('client-id')
const responseBlock = document.getElementById('response-block')

let lastShellInput = ''

socket.emit('bind', clientId.innerHTML)

shellInput.addEventListener('keydown', (e) => {
    if (e.key == 'Enter') {
        socket.emit('cmd', {
            clientId: clientId.innerHTML,
            shellInput: shellInput.value
        })
        lastShellInput = shellInput.value
    }
    if (e.key == 'ArrowUp') {
        console.log('test')
        shellInput.value = lastShellInput
    }
})

socket.on('cmdRes', (data) => {
    var lines = data.split('\n')
    responseBlock.innerHTML = `<code class="text-success">${shellInput.value}</code>\n<code></code>\n`
    shellInput.value = ''
    
    for (var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].replace(/\s/g, '&nbsp;');
        responseBlock.innerHTML += `<code>${lines[i]}</code>\n`
    }
    console.log(data)
})