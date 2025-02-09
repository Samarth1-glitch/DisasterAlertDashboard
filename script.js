document.addEventListener("DOMContentLoaded", fetchDisasterAlerts);

        async function fetchDisasterAlerts() {
            const usgsApi = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson";
            const gdacsApi = "https://www.gdacs.org/xml/rss.xml"; // Placeholder, since GDACS uses RSS (needs parsing)
            
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

            // Fetch weather data using OpenWeather API
            const weatherApiKey = "fecc4ddc6ba757a6fe98255e4a79c6ce"; // Replace with your OpenWeather API key
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;
            try {
                const weatherResponse = await fetch(weatherUrl);
                const weatherData = await weatherResponse.json();
                const weatherContainer = document.getElementById("weather");
                weatherContainer.innerHTML = `
                    <div>
                        <strong>Weather in ${weatherData.name}</strong><br>
                        Temperature: ${weatherData.main.temp}°C<br>
                        Weather: ${weatherData.weather[0].description}<br>
                        Humidity: ${weatherData.main.humidity}%<br>
                        Wind Speed: ${weatherData.wind.speed} m/s
                    </div>
                `;
            } catch (error) {
                console.error("Error fetching weather data:", error);
                document.getElementById("weather").innerHTML = "Failed to load weather data.";
            }

            // Fetch help centers using Overpass API
            const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity=hospital](around:10000,${lat},${lon});out;`;
            try {
                const response = await fetch(overpassUrl);
                const data = await response.json();
                const centersContainer = document.getElementById("help-centers");
                centersContainer.innerHTML = "";

                map.setView([lat, lon], 12);
                map.eachLayer(layer => {
                    if (!!layer.toGeoJSON) {
                        map.removeLayer(layer);
                    }
                });

                if (data.elements.length > 0) {
                    data.elements.forEach(center => {
                        const centerItem = document.createElement("div");
                        const centerName = center.tags.name || "Unknown Help Center";
                        centerItem.innerHTML = `<strong>${centerName}</strong> - (${center.lat}, ${center.lon})`;
                        centersContainer.appendChild(centerItem);

                        // Add marker to map
                        const marker = L.marker([center.lat, center.lon])
                            .addTo(map)
                            .bindPopup(`<b>${centerName}</b>`);

                        // Add click event to center item
                        centerItem.addEventListener("click", () => {
                            map.setView([center.lat, center.lon], 15); // Zoom to the location
                            marker.openPopup(); // Open the marker's popup
                        });
                    });
                } else {
                    centersContainer.innerHTML = "No help centers found in this area.";
                }
            } catch (error) {
                console.error("Error fetching help centers:", error);
                document.getElementById("help-centers").innerHTML = "Failed to load help centers.";
            }
        }
