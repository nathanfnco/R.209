const geoApiUrl = "https://geo.api.gouv.fr/communes?codePostal=";
const meteoApiUrl = "https://api.meteo-concept.com/api";
const meteoToken = "8ee016add0cb1a0d590cb3065d3c80d96f2d00f4ae744aef440a36ecca085d10";

const postalCodeInput = document.getElementById("postal-code");
const citySelect = document.getElementById("city");
const form = document.getElementById("weather-form");
const resultSection = document.getElementById("weather-result");


// Maj communes selon le code postal
postalCodeInput.addEventListener("input", async () => {
  const code = postalCodeInput.value;
  if (/^\d{5}$/.test(code)) {
    const res = await fetch(`${geoApiUrl}${code}&fields=nom,code,centre`);
    const cities = await res.json();

    citySelect.innerHTML = "";
    cities.forEach(city => {
      const option = document.createElement("option");
      option.value = JSON.stringify({ code: city.code, lat: city.centre.coordinates[1], lon: city.centre.coordinates[0] });
      option.textContent = city.nom;
      citySelect.appendChild(option);
    });
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const selected = JSON.parse(citySelect.value);
  const inseeCode = selected.code;
  const lat = selected.lat;
  const lon = selected.lon;

  const days = parseInt(document.getElementById("days").value);
  const showLat = document.getElementById("lat").checked;
  const showLon = document.getElementById("lon").checked;
  const showRain = document.getElementById("rain").checked;
  const showWind = document.getElementById("wind").checked;
  const showDir = document.getElementById("dir").checked;
  const showFog = document.getElementById("fog").checked;
