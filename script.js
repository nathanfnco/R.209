const geoApiUrl = "https://geo.api.gouv.fr/communes?codePostal=";
const meteoApiUrl = "https://api.meteo-concept.com/api";
const meteoToken = "8ee016add0cb1a0d590cb3065d3c80d96f2d00f4ae744aef440a36ecca085d10";

const postalCodeInput = document.getElementById("postal-code");
const citySelect = document.getElementById("city");
const form = document.getElementById("weather-form");
const resultSection = document.getElementById("weather-result");

// Mise à jour des communes selon le code postal
postalCodeInput.addEventListener("input", async () => {
  const code = postalCodeInput.value;
  if (/^\d{5}$/.test(code)) {
    try {
      const res = await fetch(`${geoApiUrl}${code}&fields=nom,code,centre`);
      const cities = await res.json();

      citySelect.innerHTML = "";
      cities.forEach(city => {
        const option = document.createElement("option");
        option.value = JSON.stringify({
          code: city.code,
          lat: city.centre.coordinates[1],
          lon: city.centre.coordinates[0]
        });
        option.textContent = city.nom;
        citySelect.appendChild(option);
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des communes :", error);
      citySelect.innerHTML = "<option value=''>Erreur de chargement</option>";
    }
  } else {
    citySelect.innerHTML = "";
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

  try {
    const res = await fetch(`${meteoApiUrl}/forecast/daily?token=${meteoToken}&insee=${inseeCode}`);
    const data = await res.json();
    const forecasts = data.forecast.slice(0, days);

    resultSection.innerHTML = "";

    forecasts.forEach((day, index) => {
      const card = document.createElement("div");
      card.className = "weather-card";

      const date = new Date(day.datetime);
      const dayName = date.toLocaleDateString("fr-FR", { weekday: "long" });
      const dayNumber = date.getDate();
      const monthName = date.toLocaleDateString("fr-FR", { month: "long" });
      const year = date.getFullYear();
      const formattedDate = `${dayName} ${dayNumber} <span class="mois">${monthName}</span> ${year}`;

      // Sélection de l'icône météo dynamique
      let iconSrc = "images/unknown.jpg"; // Par défaut
      if (day.weather >= 0 && day.weather <= 3) {
        iconSrc = "images/sun.jpg"; // Soleil
      } else if ((day.weather >= 4 && day.weather <= 7) || day.weather === 10) {
        iconSrc = "images/nuage.jpg"; // Nuageux
      } else if ((day.weather >= 8 && day.weather <= 14) || (day.weather >= 40 && day.weather <= 48)) {
        iconSrc = "images/pluie.jpg"; // Pluie
      }
      card.innerHTML = `
      <div style="text-align: center;">
      <img src="${iconSrc}" alt="Icône météo" style="width: 120px; height: 120px;" />
      </div>
      <h3>Jour ${index + 1} - ${formattedDate}</h3>
      <p><strong>T° min :</strong> ${day.tmin}°C</p>
      <p><strong>T° max :</strong> ${day.tmax}°C</p>
      <p><strong>Pluie :</strong> ${day.probarain}%</p>
      <p><strong>Ensoleillement :</strong> ${day.sun_hours}h</p>
      ${showLat ? `<p><strong>Latitude :</strong> ${lat.toFixed(4)}</p>` : ""}
      ${showLon ? `<p><strong>Longitude :</strong> ${lon.toFixed(4)}</p>` : ""}
      ${showRain ? `<p><strong>Cumul pluie :</strong> ${day.rr10} mm</p>` : ""}
      ${showWind ? `<p><strong>Vent moyen :</strong> ${day.wind10m} km/h</p>` : ""}
      ${showDir ? `<p><strong>Direction vent :</strong> ${day.dirwind10m}°</p>` : ""}
      ${showFog ? `<p><strong>Probabilité de brouillard :</strong> ${day.probafog}%</p>` : ""}
      `;

      resultSection.appendChild(card);
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des données météo :", error);
    resultSection.innerHTML = "<p>Erreur lors de la récupération des données météo.</p>";
  }
});

// Gestion du slider pour le nombre de jours avec boutons +/-
const slider = document.getElementById('days');
const decreaseBtn = document.getElementById('decrease-days');
const increaseBtn = document.getElementById('increase-days');
const daysValue = document.getElementById('days-value');

function updateDaysValue(val) {
  daysValue.textContent = val;
}

decreaseBtn.addEventListener('click', () => {
  if (slider.value > slider.min) {
    slider.value = Number(slider.value) - 1;
    updateDaysValue(slider.value);
  }
});

increaseBtn.addEventListener('click', () => {
  if (slider.value < slider.max) {
    slider.value = Number(slider.value) + 1;
    updateDaysValue(slider.value);
  }
});

slider.addEventListener('input', () => {
  updateDaysValue(slider.value);
});

// Initialisation de l'affichage du slider
updateDaysValue(slider.value);

// Gestion du mode sombre
const darkToggle = document.getElementById("dark-toggle");

darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    darkToggle.textContent = "☀️ Mode clair";
  } else {
    darkToggle.textContent = "🌓 Mode sombre";
  }

  localStorage.setItem("dark-mode", document.body.classList.contains("dark"));
});

// Appliquer le mode sombre si activé précédemment
window.addEventListener("DOMContentLoaded", () => {
  const darkEnabled = localStorage.getItem("dark-mode") === "true";
  if (darkEnabled) {
    document.body.classList.add("dark");
    darkToggle.textContent = "☀️ Mode clair";
  }
});
