const socket = io();

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            console.log(`Location accuracy: ${accuracy} meters`);
            socket.emit("send-location", { latitude, longitude, accuracy });
        },
        (error) => {
            console.error("Geolocation error:", error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );

    // Backup location update every 5 seconds
    setInterval(() => {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude, accuracy } = position.coords;
            socket.emit("send-location", { latitude, longitude, accuracy });
        });
    }, 5000);
}

const map = L.map("map").setView([0, 0], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap",
}).addTo(map);

const markers = {};
let firstUpdate = true; // Prevent map resetting on every update

socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    let offset = 0.0001 * (Object.keys(markers).length % 2 === 0 ? 1 : -1); // Small shift

    // Set map view only on first update
    if (firstUpdate) {
        map.setView([latitude + offset, longitude + offset], 16);
        firstUpdate = false;
    }

    if (markers[id]) {
        markers[id].setLatLng([latitude + offset, longitude + offset]);
    } else {
        markers[id] = L.marker([latitude + offset, longitude + offset]).addTo(map);
    }
});


socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});
