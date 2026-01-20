// ===================================
// WEATHER & SWELL FORECAST
// ===================================

// Punta Mita coordinates
const PUNTA_MITA_LAT = 20.7878;
const PUNTA_MITA_LON = -105.5208;

// Fetch Weather Data
async function fetchWeather() {
    try {
        // Current weather + 5-day forecast
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${PUNTA_MITA_LAT}&longitude=${PUNTA_MITA_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/Mexico_City&forecast_days=7`;

        // Marine/swell data - current + daily forecast with multiple swell components
        const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${PUNTA_MITA_LAT}&longitude=${PUNTA_MITA_LON}&current=wave_height,wave_direction,wave_period&daily=wave_height_max,wave_direction_dominant,wave_period_max,swell_wave_height_max,swell_wave_direction_dominant,swell_wave_period_max,wind_wave_height_max,wind_wave_direction_dominant,wind_wave_period_max&timezone=America/Mexico_City&forecast_days=7`;

        const [weatherResponse, marineResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(marineUrl)
        ]);

        const weatherData = await weatherResponse.json();
        const marineData = await marineResponse.json();

        updateCurrentWeather(weatherData);
        updateSwellForecast(marineData);
        updateForecast(weatherData);
        updateDailySwellForecast(marineData);
    } catch (error) {
        console.error('Error fetching weather:', error);
        document.getElementById('current-desc').textContent = 'Unable to load weather';
    }
}

// Update Current Weather
function updateCurrentWeather(data) {
    const current = data.current;

    document.getElementById('current-temp').textContent = `${Math.round(current.temperature_2m)}°F`;
    document.getElementById('current-desc').textContent = getWeatherDescription(current.weather_code);
    document.getElementById('feels-like').textContent = `Feels like ${Math.round(current.apparent_temperature)}°F`;
    document.getElementById('humidity').textContent = `Humidity ${current.relative_humidity_2m}%`;

    // Wind data
    document.getElementById('wind-speed').textContent = `${Math.round(current.wind_speed_10m)} mph`;
    document.getElementById('wind-direction').textContent = `Direction: ${getWindDirection(current.wind_direction_10m)}`;
    document.getElementById('wind-gust').textContent = `Gusts: ${Math.round(current.wind_gusts_10m)} mph`;
}

// Update Swell Forecast
function updateSwellForecast(data) {
    const current = data.current;

    const waveHeight = current.wave_height || 0;
    document.getElementById('swell-height').textContent = `${waveHeight.toFixed(1)} ft`;
    document.getElementById('swell-period').textContent = `Period: ${current.wave_period || '--'}s`;
    document.getElementById('swell-direction').textContent = `Direction: ${getWindDirection(current.wave_direction || 0)}`;
}

// Update 5-Day Forecast
function updateForecast(data) {
    const daily = data.daily;
    const forecastGrid = document.getElementById('forecast-grid');
    forecastGrid.innerHTML = '';

    // Show next 5 days
    for (let i = 0; i < 5; i++) {
        const date = new Date(daily.time[i]);
        const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });

        const forecastDay = document.createElement('div');
        forecastDay.className = 'forecast-day';
        forecastDay.innerHTML = `
            <div class="forecast-day-name">${dayName}</div>
            <div class="forecast-icon">${getWeatherIcon(daily.weather_code[i])}</div>
            <div class="forecast-temp">${Math.round(daily.temperature_2m_max[i])}°</div>
            <div class="forecast-condition">${getWeatherDescription(daily.weather_code[i])}</div>
        `;
        forecastGrid.appendChild(forecastDay);
    }
}

// Update Daily Swell Forecast
function updateDailySwellForecast(data) {
    const daily = data.daily;
    const swellGrid = document.getElementById('swell-forecast-grid');

    if (!swellGrid) return;

    swellGrid.innerHTML = '';

    // Show next 5 days (or 4 days for the trip Jan 29 - Feb 1)
    for (let i = 0; i < Math.min(5, daily.time.length); i++) {
        const date = new Date(daily.time[i]);
        const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        const swellDay = document.createElement('div');
        swellDay.className = 'swell-forecast-day';

        // Get all swell components
        const groundSwell = {
            height: daily.swell_wave_height_max[i] || 0,
            period: daily.swell_wave_period_max[i] || 0,
            direction: daily.swell_wave_direction_dominant[i] || 0
        };

        const windSwell = {
            height: daily.wind_wave_height_max[i] || 0,
            period: daily.wind_wave_period_max[i] || 0,
            direction: daily.wind_wave_direction_dominant[i] || 0
        };

        const totalWave = {
            height: daily.wave_height_max[i] || 0,
            period: daily.wave_period_max[i] || 0,
            direction: daily.wave_direction_dominant[i] || 0
        };

        // Build swell components HTML
        let swellComponents = '';

        // Show ground swell if significant
        if (groundSwell.height > 0.5) {
            swellComponents += `
                <div class="swell-component primary">
                    <div class="swell-label">Ground Swell</div>
                    <div class="swell-size">${groundSwell.height.toFixed(1)}ft @ ${groundSwell.period.toFixed(0)}s</div>
                    <div class="swell-dir">${getWindDirection(groundSwell.direction)} (${Math.round(groundSwell.direction)}°)</div>
                </div>
            `;
        }

        // Show wind swell if significant
        if (windSwell.height > 0.5) {
            swellComponents += `
                <div class="swell-component secondary">
                    <div class="swell-label">Wind Swell</div>
                    <div class="swell-size">${windSwell.height.toFixed(1)}ft @ ${windSwell.period.toFixed(0)}s</div>
                    <div class="swell-dir">${getWindDirection(windSwell.direction)} (${Math.round(windSwell.direction)}°)</div>
                </div>
            `;
        }

        // If no components, show total
        if (!swellComponents) {
            swellComponents = `
                <div class="swell-component">
                    <div class="swell-size">${totalWave.height.toFixed(1)}ft @ ${totalWave.period.toFixed(0)}s</div>
                    <div class="swell-dir">${getWindDirection(totalWave.direction)} (${Math.round(totalWave.direction)}°)</div>
                </div>
            `;
        }

        swellDay.innerHTML = `
            <div class="swell-day-header">
                <div class="swell-day-name">${dayName}</div>
                <div class="swell-day-icon">🌊</div>
            </div>
            <div class="swell-components">
                ${swellComponents}
            </div>
        `;

        swellGrid.appendChild(swellDay);
    }
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

// Initialize weather on page load
if (document.getElementById('current-weather')) {
    fetchWeather();
    // Update every 30 minutes
    setInterval(fetchWeather, 30 * 60 * 1000);
}