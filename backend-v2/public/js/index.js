const socket = io();
var selectedWorkstation = '';
const shellInput = document.getElementById('shell-cmd-input')
const shellOutput = document.getElementById('shell-output')
const modalCheckBox = document.getElementById("show-hide-shell");
const shellModalExit = document.getElementById('shell-modal-exit')
const shellModalHeaderLabel = document.getElementById("shell-modal-header-label");
let lastShellInput = []
let lastShellTracker = 1

var darkMap = L.tileLayer('https://api.mapbox.com/styles/v1/snikvand/cksmsnprv31ze17mtxsg8d059/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoic25pa3ZhbmQiLCJhIjoiY2tzbXNmNHo2MGpkdjJ2bXJiejljczc2ZSJ9.-8JS2uOe7BYjvYpTu-zp3g', {
    attribution: '',
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoic25pa3ZhbmQiLCJhIjoiY2tzbXNqZDNpMGRwMTJvbWdtdXd4N3kxZSJ9.4HPcFhlynlFKFtuCjncvJw'
})

var lightMap = L.tileLayer('https://api.mapbox.com/styles/v1/snikvand/cksmsop0306xk18nw96tnyoku/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoic25pa3ZhbmQiLCJhIjoiY2tzbXNmNHo2MGpkdjJ2bXJiejljczc2ZSJ9.-8JS2uOe7BYjvYpTu-zp3g', {
    attribution: '',
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoic25pa3ZhbmQiLCJhIjoiY2tzbXNqZDNpMGRwMTJvbWdtdXd4N3kxZSJ9.4HPcFhlynlFKFtuCjncvJw'
})

var map = L.map('map', {
    center: [0,0],//[49.217,-122.864],
    zoom: 11,
    layers: [darkMap,lightMap],
    zoomControl: false
});

var baseMaps = {
    "Dark": darkMap,
    "Light": lightMap
    
}

L.control.layers(baseMaps).addTo(map);

// socket.on('hello', () => {
//     console.log('Hello from server!')
//     var marker = L.marker([49.217,-122.864]).addTo(map);
//     marker.bindPopup("<b>snikvand-pc</b><br>Manage PC").openPopup();
// })

shellInput.addEventListener('keydown', (e) => {

    // If user presses enter, it will submit the message to server and add last input to stack to track
    if (e.key == 'Enter') {
        socket.emit('execWorkstation', {
            'workstationId': selectedWorkstation,
            'cmd': shellInput.value
        })
        lastShellInput.push(shellInput.value)
        lastShellTracker = 1
        shellOutput.innerHTML += `<p class="shell-meta-text"><b>${shellInput.value}</b></p>`
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

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\s/g, "&nbsp;");
}

function selectWorkstationModal(workstationId) {
    modalCheckBox.checked = true;
    shellModalHeaderLabel.innerHTML = `> ${workstationId}`;
    shellModalHeaderLabel.setAttribute('href', `/clients/${workstationId}`);
    shellModalExit.setAttribute('onclick', `exitWorkstationModal('${workstationId}')`)
    shellOutput.innerHTML = '';
    selectedWorkstation = workstationId;
    lastShellInput = [];
    lastShellTracker = 1;

    socket.emit('joinWorkstation', {
        workstationId
    })
}

function exitWorkstationModal(workstationId) {
    modalCheckBox.checked = false;
    shellModalHeaderLabel.innerHTML = `> NULL`;
    shellModalHeaderLabel.setAttribute('href', `#`);
    shellOutput.innerHTML = '';
    selectedWorkstation = '';
    lastShellInput = [];
    lastShellTracker = 1;

    socket.emit('exitWorkstation', {
        workstationId
    })
}

function onLoad() {
    var modalCheckBox = document.getElementById("show-hide-shell");
    modalCheckBox.checked = false;
}

socket.on('workstation', (data) => {
    var marker = L.marker([data.ll.latitude,data.ll.longitude]).addTo(map);
    marker.bindPopup(`<a href="javascript:{}" onclick="selectWorkstationModal('${data.id}')"><b>${data.id}</b></a><br>${data.ip}`)
    // console.log(data)
})

socket.on('execResponse', (data) => {
    var lines = data.split('\n')

    for (var i = 0; i < lines.length; i++) {
        lines[i] = escapeHtml(lines[i]) //.replace(/\s/g, '&nbsp;');
        // shellOutput.scrollIntoView({ block: 'end', behavior: 'smooth' });
        shellOutput.innerHTML += `<code>${lines[i]}</code>\n`
        shellOutput.scrollTop = shellOutput.scrollHeight;
        // shellOutput.scrollIntoView({ block: 'end', behavior: 'smooth' });

    }
})
onLoad();