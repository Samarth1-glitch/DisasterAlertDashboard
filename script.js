document.addEventListener("DOMContentLoaded", fetchDisasterAlerts);

async function fetchDisasterAlerts() {
    const usgsApi = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson";

    try {
        const response = await fetch(usgsApi);
        const data = await response.json();
        const alertsContainer = document.getElementById("alerts");
        alertsContainer.innerHTML = "";

        if (data.features.length > 0) {
            data.features.forEach(event => {
                const alertItem = document.createElement("div");
                alertItem.classList.add("alert-item");
                alertItem.innerHTML = `
                    <strong>${event.properties.place}</strong><br>
                    Magnitude: ${event.properties.mag}<br>
                    Time: ${new Date(event.properties.time).toLocaleString()}<br>
                    <a href="${event.properties.url}" target="_blank">More Info</a>
                `;
                alertsContainer.appendChild(alertItem);
            });
        } else {
            alertsContainer.innerHTML = "No significant disasters reported this week.";
        }
    } catch (error) {
        console.error("Error fetching alerts:", error);
        document.getElementById("alerts").innerHTML = "Failed to load alerts.";
    }
}

// Map Initialization
const map = L.map("map").setView([20, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

async function findHelpCenters() {
    const location = document.getElementById("location").value;
    if (!location) {
        alert("Please enter a location.");
        return;
    }

    let lat, lon;
    if (location.includes(",")) {
        [lat, lon] = location.split(",").map(coord => coord.trim());
    } else {
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
        const geoData = await geoResponse.json();
        if (geoData.length === 0) {
            alert("Location not found.");
            return;
        }
        lat = geoData[0].lat;
        lon = geoData[0].lon;
    }

    map.setView([lat, lon], 12);
}
