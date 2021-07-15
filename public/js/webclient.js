const socket = io()

// web dom objects that will be used by event listeners
const shellInput = document.getElementById('shell-input')
const clientId = document.getElementById('client-id')
const responseBlock = document.getElementById('response-block')

// Tracking shell input stack and index of the stack
let lastShellInput = []
let lastShellTracker = 1

// On client connection send socketio bind event (on server.js will bind socketio to the tlsSocket)
socket.emit('bind', clientId.innerHTML)

/**
 * Function: Escapes all special characters in a string
 * @param {*} unsafe takes string object
 * @returns string with all special characters escaped
 */
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\s/g, "&nbsp;");
}

// will emit a socketio in attempt to reset the shell
function resetClient() {
    socket.emit('rst', clientId.innerHTML)
    responseBlock.innerHTML += `<code class="text-danger">------ Attempting to Reset Shell ------</code>\n`
}

/**
 * Listener for the shell input keystrokes
 */
shellInput.addEventListener('keydown', (e) => {

    // If user presses enter, it will submit the message to server and add last input to stack to track
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

    // If the user presses the up arrow go to previous index on the last input stack
    if (e.key == 'ArrowUp') {
        shellInput.value = lastShellInput[lastShellInput.length - lastShellTracker]
        if (lastShellTracker < lastShellInput.length) {
            lastShellTracker++
        }
    }

    // if the user presses the down arrow go to the next index on the last input stack
    if (e.key == 'ArrowDown') {
        if (lastShellTracker > 1) {
            lastShellTracker--
        }
        shellInput.value = lastShellInput[lastShellInput.length - lastShellTracker]
    }
})

/**
 * Upon receiving data from the socketio (post tlsSocket communication on server.js) render on screen
 */
socket.on('cmdRes', (data) => {
    var lines = data.split('\n')

    for (var i = 0; i < lines.length; i++) {
        lines[i] = escapeHtml(lines[i]) //.replace(/\s/g, '&nbsp;');
        document.getElementById('cmdbox').scrollIntoView({ block: 'end', behavior: 'smooth' });
        responseBlock.innerHTML += `<code>${lines[i]}</code>\n`
        document.getElementById('cmdbox').scrollIntoView({ block: 'end', behavior: 'smooth' });

    }
    console.log(data)
})