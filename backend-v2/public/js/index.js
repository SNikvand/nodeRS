// Load socketio module
const socket = io();

// Static list of elements that will be manipulated
const shellInput = document.getElementById('shell-cmd-input')
const shellOutput = document.getElementById('shell-output')
const modalCheckBox = document.getElementById("show-hide-shell");
const shellModalExit = document.getElementById('shell-modal-exit')
const shellModalHeaderLabel = document.getElementById("shell-modal-header-label");
// ===========================================================================

// Global Variables
var selectedWorkstation = '';
var lastShellInput = []
var lastShellTracker = 1
// ===========================================================================

// Dark Map theme from mapbox
var darkMap = L.tileLayer('https://api.mapbox.com/styles/v1/snikvand/cksmsnprv31ze17mtxsg8d059/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoic25pa3ZhbmQiLCJhIjoiY2tzbXNmNHo2MGpkdjJ2bXJiejljczc2ZSJ9.-8JS2uOe7BYjvYpTu-zp3g', {
    attribution: '',
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoic25pa3ZhbmQiLCJhIjoiY2tzbXNqZDNpMGRwMTJvbWdtdXd4N3kxZSJ9.4HPcFhlynlFKFtuCjncvJw'
})

// Light Map theme from mapbox
var lightMap = L.tileLayer('https://api.mapbox.com/styles/v1/snikvand/cksmsop0306xk18nw96tnyoku/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoic25pa3ZhbmQiLCJhIjoiY2tzbXNmNHo2MGpkdjJ2bXJiejljczc2ZSJ9.-8JS2uOe7BYjvYpTu-zp3g', {
    attribution: '',
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoic25pa3ZhbmQiLCJhIjoiY2tzbXNqZDNpMGRwMTJvbWdtdXd4N3kxZSJ9.4HPcFhlynlFKFtuCjncvJw'
})

// Map configuration
var map = L.map('map', {
    center: [0,0],
    zoom: 2,
    layers: [darkMap,lightMap],
    zoomControl: false
});

// Setup the map layers
var baseMaps = {
    "Dark": darkMap,
    "Light": lightMap
}

// Create map markers
var markerGroup = L.layerGroup().addTo(map)
var markers = {}
L.control.layers(baseMaps).addTo(map);
// ===========================================================================

// Check shell for enter key being pressed
shellInput.addEventListener('keydown', (e) => {

    // If user presses enter, it will submit the message to server and add last input to stack to track
    if (e.key == 'Enter') {
        var shellTokens = shellInput.value.split(',')
        switch (shellTokens[0]) {
            case 'SEND':
                socket.emit('fileServerToClient', {
                    'workstationId': selectedWorkstation,
                    'srcFilePath': shellTokens[1],
                    'dstFileName': shellTokens[2]
                })
                break
            case 'GET':
                //do something
                break
            default:
                socket.emit('execWorkstation', {
                    'workstationId': selectedWorkstation,
                    'cmd': shellInput.value
                })
                break
        }
                     
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

/**
 * escapes unsafe html characters
 * @param {String} unsafe 
 * @returns escaped html string
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

/**
 * Shell Modal setup once a workstation is selected from a map marker
 * @param {String} workstationId client workstation id
 * @param {string} prettyName client custom name set by admin 
 */
function selectWorkstationModal(workstationId, prettyName) {
    modalCheckBox.checked = true;
    shellModalHeaderLabel.innerHTML = `> ${(prettyName ? prettyName + ' - ' + workstationId : workstationId)}`;
    shellModalHeaderLabel.setAttribute('href', `/workstations/${workstationId}`);
    shellModalExit.setAttribute('onclick', `exitWorkstationModal('${workstationId}')`)
    shellOutput.innerHTML = '';
    selectedWorkstation = workstationId;
    lastShellInput = [];
    lastShellTracker = 1;

    socket.emit('joinWorkstation', {
        workstationId
    })
}

/**
 * when the front end closes the shell modal, it will deselect the current workstation on front end
 * @param {String} workstationId 
 */
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

// Force closes any open shell modals (sometimes this occurs when user presses back)
function onLoad() {
    var modalCheckBox = document.getElementById("show-hide-shell");
    modalCheckBox.checked = false;
}

// this event is received from the server to add a new map marker
socket.on('workstation', (data) => {
    markers[data.id] = L.marker([data.ll.latitude,data.ll.longitude]).addTo(markerGroup);
    var popupHtml = '';
    if (data.prettyName) {
        popupHtml = `<a href="javascript:{}" onclick="selectWorkstationModal('${data.id}','${data.prettyName}')" class="map-marker-link"><b>${data.prettyName}</b></a><br>${data.id}<br>${data.ip}`
    } else {
        popupHtml = `<a href="javascript:{}" onclick="selectWorkstationModal('${data.id}')" class="map-marker-link"><b>${data.id}</b></a><br>${data.ip}`
    }
    markers[data.id].bindPopup(popupHtml)
    // console.log(data)
})

// this event is received from the server to remove a map marker
socket.on('removeWorkstationMarker', (data) => {
    markerGroup.removeLayer(markers[data.id])
})

// Display exec response from backend to the frontend
socket.on('execResponse', (data) => {
    var lines = data.split('\n')
    for (var i = 0; i < lines.length; i++) {
        lines[i] = escapeHtml(lines[i]) //.replace(/\s/g, '&nbsp;');
        shellOutput.innerHTML += `<code>${lines[i]}</code>\n`
        shellOutput.scrollTop = shellOutput.scrollHeight;
    }
})

// Clear all markers from the map if the front end socket or the back end socket disconnects
socket.on('disconnect', () => {
    markerGroup.clearLayers()
})

onLoad();