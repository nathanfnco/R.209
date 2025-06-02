const geoApiUrl = "https://geo.api.gouv.fr/communes?codePostal=";
const meteoApiUrl = "https://api.meteo-concept.com/api";
const meteoToken = "8ee016add0cb1a0d590cb3065d3c80d96f2d00f4ae744aef440a36ecca085d10";

const postalCodeInput = document.getElementById("postal-code");
const citySelect = document.getElementById("city");
const daysSlider = document.getElementById("days");
const daysValue = document.getElementById("days-value");
const resultSection = document.getElementById("weather-result");
const form = document.getElementById("weather-form");
const darkToggle = document.getElementById("dark-toggle");

// Actualiser la valeur du slider
daysSlider.addEventListener("input", () => {
  daysValue.textContent = daysSlider.value;
});

document.getElementById("decrease-days").addEventListener("click", () => {
  if (daysSlider.value > 1) {
    daysSlider.value--;
    daysSlider.dispatchEvent(new Event("input"));
  }
});

document.getElementById("increase-days").addEventListener("click", () => {
  if (daysSlider.value < 7) {
    daysSlider.value++;
    daysSlider.dispatchEvent(new Event("input"));
  }
});

// Activer/désactiver le mode sombre
darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Chargement dynamique des communes
postalCodeInput.addEventListener("input", async () => {
  const code = postalCodeInput.value;
  if (/^\d{5}$/.test(code)) {
    try {
      const res = await fetch(`${geoApiUrl}${code}`);
      const data = await res.json();
      citySelect.innerHTML = "";
      if (data.length === 0) {
        citySelect.innerHTML = `<option>Aucune commune trouvée</option>`;
        citySelect.disabled = true;
        return;
      }
      data.forEach(commune => {
        const option = document.createElement("option");
        option.value = commune.code;
        option.textContent = commune.nom;
        citySelect.appendChild(option);
      });
      citySelect.disabled = false;
    } catch (e) {
      console.error(e);
      citySelect.innerHTML = `<option>Erreur API</option>`;
      citySelect.disabled = true;
    }
  } else {
    citySelect.innerHTML = "";
    citySelect.disabled = true;
  }
});

// Fonction pour retourner le chemin d'une image locale selon le code météo
function getLocalWeatherImage(weatherCode) {
  if ([41].includes(weatherCode)) return "images/phenomene_special.jpg";  // ajout pour code 41
  if ([0, 1].includes(weatherCode)) return "images/sun.jpg";
  if ([2, 3].includes(weatherCode)) return "images/nuage.jpg";
  if ([4].includes(weatherCode)) return "images/brouillard.jpg";
  if ([5, 6, 7].includes(weatherCode)) return "images/pluie.jpg";
  if ([8, 9, 10].includes(weatherCode)) return "images/neige.jpg";
  if ([11, 12].includes(weatherCode)) return "images/orage.jpg";
  return "images/default.png"; // image par défaut si code inconnu
}

// Soumission du formulaire
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (citySelect.disabled || !citySelect.value) {
    alert("Veuillez sélectionner une commune valide.");
    return;
  }

  const insee = citySelect.value;
  const cityName = citySelect.options[citySelect.selectedIndex].text;
  let days = parseInt(daysSlider.value);
  if (days > 7) days = 7; // limite max 7 jours

  try {
    const res = await fetch(`${meteoApiUrl}/forecast/daily?token=${meteoToken}&insee=${insee}`);
    const data = await res.json();

    if (!data.forecast) {
      resultSection.innerHTML = `<p>Aucune donnée météo disponible.</p>`;
      return;
    }

    const forecasts = data.forecast.slice(0, days);

    // Récupérer les infos supplémentaires cochées
    const checkedInfos = Array.from(form.querySelectorAll('input[name="info"]:checked')).map(i => i.value);

    resultSection.innerHTML = forecasts.map(f => {
      // Conversion date YYYY-MM-DD en jour + date format JJ/MM/AAAA
      const dateObj = new Date(f.datetime);
      const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      const jourSemaine = jours[dateObj.getDay()];
      const dateFormatee = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
      const titre = `${jourSemaine} - ${dateFormatee}`;

      let extraInfosHtml = "";

      if (checkedInfos.includes("lat") && f.lat !== undefined) extraInfosHtml += `<p>Latitude : ${f.lat}</p>`;
      if (checkedInfos.includes("lon") && f.lon !== undefined) extraInfosHtml += `<p>Longitude : ${f.lon}</p>`;
      if (checkedInfos.includes("rain") && f.rr10 !== undefined) extraInfosHtml += `<p>Pluie : ${f.rr10} mm</p>`;
      if (checkedInfos.includes("wind") && f.wind10m !== undefined) extraInfosHtml += `<p>Vent moyen : ${f.wind10m} km/h</p>`;
      if (checkedInfos.includes("dir") && f.dirwind10m !== undefined) extraInfosHtml += `<p>Direction du vent : ${f.dirwind10m}°</p>`;
      if (checkedInfos.includes("fog") && f.fog !== undefined) extraInfosHtml += `<p>Brouillard : ${f.fog} %</p>`;

      return `
        <div class="weather-card">
          <h3>${cityName} - ${titre}</h3>
          <img src="${getLocalWeatherImage(f.weather)}" alt="Météo code ${f.weather}" class="weather-image" />
          <p>Température max : ${f.tmax}°C</p>
          <p>Température min : ${f.tmin}°C</p>
          <p>Vent : ${f.wind10m} km/h</p>
          <p>Pluie : ${f.rr10} mm</p>
          ${extraInfosHtml}
        </div>
      `;
    }).join("");
  } catch (err) {
    console.error(err);
    resultSection.innerHTML = `<p>Erreur lors de la récupération des données météo.</p>`;
  }
});