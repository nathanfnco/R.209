const weatherForm = document.getElementById("weatherForm");
const weatherCards = document.getElementById("weatherCards");

weatherForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const city = document.getElementById("city").value.trim();

  if (!city) return;

  try {
    // Étape 1 : Obtenir les coordonnées GPS avec l'API Geo
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`
    );
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      alert("Ville non trouvée.");
      return;
    }

    const { name, country, latitude, longitude } = geoData.results[0];

    // Étape 2 : Obtenir les données météo
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );
    const weatherData = await weatherResponse.json();

    const weather = weatherData.current_weather;
    if (!weather) {
      alert("Aucune donnée météo disponible.");
      return;
    }

    const temperature = weather.temperature;
    const windspeed = weather.windspeed;
    const weatherCode = weather.weathercode;

    // Générer l'icône météo en fonction du code
    const iconURL = getWeatherIcon(weatherCode);

    // Créer la carte
    const card = document.createElement("div");
    card.className = "weather-card";
    card.innerHTML = `
      <h2>${name}, ${country}</h2>
      <img src="${iconURL}" alt="Icône météo" />
      <p>Température : ${temperature}°C</p>
      <p>Vent : ${windspeed} km/h</p>
    `;

    weatherCards.innerHTML = ""; // Nettoyer les anciennes cartes
    weatherCards.appendChild(card);

  } catch (error) {
    console.error("Erreur lors de la récupération des données météo :", error);
    alert("Une erreur est survenue.");
  }
});

function getWeatherIcon(code) {
  if ([0].includes(code)) return "https://openweathermap.org/img/wn/01d.png";
  if ([1, 2, 3].includes(code)) return "https://openweathermap.org/img/wn/02d.png";
  if ([45, 48].includes(code)) return "https://openweathermap.org/img/wn/50d.png";
  if ([51, 53, 55, 56, 57].includes(code)) return "https://openweathermap.org/img/wn/09d.png";
  if ([61, 63, 65, 66, 67].includes(code)) return "https://openweathermap.org/img/wn/10d.png";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "https://openweathermap.org/img/wn/13d.png";
  if ([80, 81, 82].includes(code)) return "https://openweathermap.org/img/wn/09d.png";
  if ([95, 96, 99].includes(code)) return "https://openweathermap.org/img/wn/11d.png";
  return "https://openweathermap.org/img/wn/01d.png";
}
