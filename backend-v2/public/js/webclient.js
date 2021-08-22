const socket = io()

var darkMap = L.tileLayer('https://api.mapbox.com/styles/v1/snikvand/cksmsnprv31ze17mtxsg8d059/tiles/512/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoic25pa3ZhbmQiLCJhIjoiY2tzbXNmNHo2MGpkdjJ2bXJiejljczc2ZSJ9.-8JS2uOe7BYjvYpTu-zp3g', {
    attribution: '',
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoic25pa3ZhbmQiLCJhIjoiY2tzbXNqZDNpMGRwMTJvbWdtdXd4N3kxZSJ9.4HPcFhlynlFKFtuCjncvJw'
})

var lightMap = L.tileLayer('https://api.mapbox.com/styles/v1/snikvand/cksmsop0306xk18nw96tnyoku/tiles/512/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoic25pa3ZhbmQiLCJhIjoiY2tzbXNmNHo2MGpkdjJ2bXJiejljczc2ZSJ9.-8JS2uOe7BYjvYpTu-zp3g', {
    attribution: '',
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoic25pa3ZhbmQiLCJhIjoiY2tzbXNqZDNpMGRwMTJvbWdtdXd4N3kxZSJ9.4HPcFhlynlFKFtuCjncvJw'
})

var map = L.map('map', {
    center: [49.217,-122.864],
    zoom: 11,
    layers: [darkMap,lightMap],
    zoomControl: false
});

var baseMaps = {
    "Dark": darkMap,
    "Light": lightMap
    
}

L.control.layers(baseMaps).addTo(map);

socket.on('hello', () => {
    console.log('Hello from server!')
    var marker = L.marker([49.217,-122.864]).addTo(map);
    marker.bindPopup("<b>snikvand-pc</b><br>Manage PC").openPopup();
})