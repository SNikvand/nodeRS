const socket = io()

const shellInput = document.getElementById('shell-input')
const clientId = document.getElementById('client-id')
const responseBlock = document.getElementById('response-block')

let lastShellInput = []
let lastShellTracker = 1

socket.emit('bind', clientId.innerHTML)

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;")
         .replace(/\s/g, "&nbsp;");
 }

shellInput.addEventListener('keydown', (e) => {
    if (e.key == 'Enter') {
        socket.emit('cmd', {
            clientId: clientId.innerHTML,
            shellInput: shellInput.value
        })
        lastShellInput.push(shellInput.value)
        lastShellTracker = 1
        responseBlock.innerHTML += `<code class="text-success">${shellInput.value}</code>\n`
        shellInput.value = ''
    }
    if (e.key == 'ArrowUp') {
        shellInput.value = lastShellInput[lastShellInput.length - lastShellTracker]
        if (lastShellTracker < lastShellInput.length) {
            lastShellTracker++
        }
    }

    if (e.key == 'ArrowDown') {
        if (lastShellTracker > 1) {
            lastShellTracker--
        }
        shellInput.value = lastShellInput[lastShellInput.length - lastShellTracker]
    }
})

socket.on('cmdRes', (data) => {
    var lines = data.split('\n')
    //responseBlock.innerHTML = `<code class="text-success">${shellInput.value}</code>\n<code></code>\n`
    shellInput.value = ''
    
    for (var i = 0; i < lines.length; i++) {
        lines[i] = escapeHtml(lines[i]) //.replace(/\s/g, '&nbsp;');
        document.getElementById('cmdbox').scrollIntoView({block: 'end', behavior: 'smooth'});
        responseBlock.innerHTML += `<code>${lines[i]}</code>\n`
        document.getElementById('cmdbox').scrollIntoView({block: 'end', behavior: 'smooth'});

    }
    console.log(data)
})