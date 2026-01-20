// ===================================
// WEATHER & SWELL FORECAST
// ===================================

// Punta Mita coordinates
const PUNTA_MITA_LAT = 20.7878;
const PUNTA_MITA_LON = -105.5208;

// Trip dates (Jan 29 - Feb 1, 2026)
const TRIP_START = new Date('2026-01-29');
const TRIP_END = new Date('2026-02-01');

// Fetch Weather Data
async function fetchWeather() {
    try {
        // Weather forecast (up to 16 days to ensure we get trip dates)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${PUNTA_MITA_LAT}&longitude=${PUNTA_MITA_LON}&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_direction_10m_dominant&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/Mexico_City&forecast_days=16`;

        // Marine/swell data - daily forecast with multiple swell components
        const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${PUNTA_MITA_LAT}&longitude=${PUNTA_MITA_LON}&daily=wave_height_max,wave_direction_dominant,wave_period_max,swell_wave_height_max,swell_wave_direction_dominant,swell_wave_period_max,wind_wave_height_max,wind_wave_direction_dominant,wind_wave_period_max&timezone=America/Mexico_City&forecast_days=16`;

        const [weatherResponse, marineResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(marineUrl)
        ]);

        const weatherData = await weatherResponse.json();
        const marineData = await marineResponse.json();

        updateSidebar(weatherData, marineData);
    } catch (error) {
        console.error('Error fetching weather:', error);
    }
}

// Update Sidebar with Trip Dates Only
function updateSidebar(weatherData, marineData) {
    const container = document.getElementById('sidebar-forecast-days');
    if (!container) return;

    container.innerHTML = '';

    const weatherDaily = weatherData.daily;
    const marineDaily = marineData.daily;

    // Filter for trip dates only (Jan 29 - Feb 1, 2026)
    const tripDays = [];
    for (let i = 0; i < weatherDaily.time.length; i++) {
        const date = new Date(weatherDaily.time[i]);
        if (date >= TRIP_START && date <= TRIP_END) {
            tripDays.push({
                date: date,
                weatherIndex: i,
                marineIndex: i
            });
        }
    }

    // Create sidebar card for each trip day
    tripDays.forEach((day, index) => {
        const i = day.weatherIndex;
        const date = day.date;

        const dayNames = ['Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayName = dayNames[index] || date.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        // Weather data
        const tempMax = Math.round(weatherDaily.temperature_2m_max[i]);
        const tempMin = Math.round(weatherDaily.temperature_2m_min[i]);
        const weatherCode = weatherDaily.weather_code[i];
        const windSpeed = Math.round(weatherDaily.wind_speed_10m_max[i]);
        const windDir = getWindDirection(weatherDaily.wind_direction_10m_dominant[i]);

        // Swell data - check if available (API only goes ~10 days out)
        const hasSwellData = marineDaily.wave_height_max[i] !== null &&
                            marineDaily.wave_height_max[i] !== undefined;

        let swellHTML = '';

        if (!hasSwellData) {
            // Data not available yet - show when it will be available
            // Marine API provides ~10 day forecast, so available 9 days before
            const availableDate = new Date(date);
            availableDate.setDate(availableDate.getDate() - 9);
            const availableDateStr = availableDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            swellHTML = `
                <div class="sidebar-swell-item" style="font-style: italic; opacity: 0.7;">
                    Available ${availableDateStr}
                </div>
            `;
        } else {
            // Build swell data
            const groundSwell = {
                height: marineDaily.swell_wave_height_max[i] || 0,
                period: marineDaily.swell_wave_period_max[i] || 0,
                direction: marineDaily.swell_wave_direction_dominant[i] || 0
            };

            const windSwell = {
                height: marineDaily.wind_wave_height_max[i] || 0,
                period: marineDaily.wind_wave_period_max[i] || 0,
                direction: marineDaily.wind_wave_direction_dominant[i] || 0
            };

            if (groundSwell.height > 0.5) {
                swellHTML += `
                    <div class="sidebar-swell-item">
                        <strong>${groundSwell.height.toFixed(1)}ft</strong> @ ${groundSwell.period.toFixed(0)}s
                        ${getWindDirection(groundSwell.direction)} (Ground)
                    </div>
                `;
            }
            if (windSwell.height > 0.5) {
                swellHTML += `
                    <div class="sidebar-swell-item">
                        <strong>${windSwell.height.toFixed(1)}ft</strong> @ ${windSwell.period.toFixed(0)}s
                        ${getWindDirection(windSwell.direction)} (Wind)
                    </div>
                `;
            }
            if (!swellHTML) {
                const totalWave = marineDaily.wave_height_max[i] || 0;
                const totalPeriod = marineDaily.wave_period_max[i] || 0;
                const totalDir = marineDaily.wave_direction_dominant[i] || 0;
                swellHTML = `
                    <div class="sidebar-swell-item">
                        <strong>${totalWave.toFixed(1)}ft</strong> @ ${totalPeriod.toFixed(0)}s ${getWindDirection(totalDir)}
                    </div>
                `;
            }
        }

        const dayCard = document.createElement('div');
        dayCard.className = 'sidebar-day';
        dayCard.innerHTML = `
            <div class="sidebar-day-header">
                <div>
                    <div class="sidebar-day-name">${dayName}</div>
                    <div class="sidebar-day-date">${dateStr}</div>
                </div>
                <div class="sidebar-icon">${getWeatherIcon(weatherCode)}</div>
            </div>
            <div class="sidebar-weather">
                <div class="sidebar-temp">${tempMax}°/${tempMin}°F</div>
                <div style="font-size: 0.8rem; color: rgba(255,255,255,0.7);">
                    💨 ${windSpeed}mph ${windDir}
                </div>
            </div>
            <div class="sidebar-swell">
                <div class="sidebar-swell-title">🌊 Surf</div>
                ${swellHTML}
            </div>
        `;

        container.appendChild(dayCard);
    });
}

// Weather code to description
function getWeatherDescription(code) {
    const descriptions = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Fog',
        51: 'Light drizzle',
        53: 'Drizzle',
        55: 'Heavy drizzle',
        61: 'Light rain',
        63: 'Rain',
        65: 'Heavy rain',
        71: 'Light snow',
        73: 'Snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Light showers',
        81: 'Showers',
        82: 'Heavy showers',
        85: 'Light snow',
        86: 'Snow',
        95: 'Thunderstorm',
        96: 'Thunderstorm',
        99: 'Heavy thunderstorm'
    };
    return descriptions[code] || 'Unknown';
}

// Weather code to emoji icon
function getWeatherIcon(code) {
    if (code === 0 || code === 1) return '☀️';
    if (code === 2 || code === 3) return '⛅';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 55) return '🌦️';
    if (code >= 61 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '🌨️';
    if (code >= 80 && code <= 82) return '🌧️';
    if (code >= 85 && code <= 86) return '🌨️';
    if (code >= 95) return '⛈️';
    return '🌤️';
}

// Wind direction from degrees
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// Sidebar scroll detection
let sidebarVisible = false;
let sidebarCollapsed = false;

function handleSidebarScroll() {
    const sidebar = document.getElementById('weather-sidebar');
    if (!sidebar) return;

    const scrollPosition = window.scrollY;
    const heroHeight = window.innerHeight; // Hero takes full viewport

    // Show sidebar after scrolling past hero
    if (scrollPosition > heroHeight * 0.8 && !sidebarCollapsed) {
        if (!sidebarVisible) {
            sidebar.classList.add('visible');
            sidebarVisible = true;
        }
    } else {
        if (sidebarVisible && !sidebarCollapsed) {
            sidebar.classList.remove('visible');
            sidebarVisible = false;
        }
    }
}

// Toggle sidebar collapse
function toggleSidebar() {
    const sidebar = document.getElementById('weather-sidebar');
    if (!sidebar) return;

    if (sidebar.classList.contains('visible')) {
        sidebar.classList.remove('visible');
        sidebar.classList.add('collapsed');
        sidebarCollapsed = true;
        sidebarVisible = false;
    } else {
        sidebar.classList.remove('collapsed');
        sidebar.classList.add('visible');
        sidebarCollapsed = false;
        sidebarVisible = true;
    }
}

// Make toggleSidebar available globally
window.toggleSidebar = toggleSidebar;

// Initialize weather sidebar
if (document.getElementById('weather-sidebar')) {
    fetchWeather();
    // Update every 30 minutes
    setInterval(fetchWeather, 30 * 60 * 1000);

    // Listen for scroll events
    window.addEventListener('scroll', handleSidebarScroll);

    // Initial check
    handleSidebarScroll();
}