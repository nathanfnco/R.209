const geoApiUrl = "https://geo.api.gouv.fr/communes";
const meteoApiUrl = "https://api.meteo-concept.com/api";
const meteoToken = "8ee016add0cb1a0d590cb3065d3c80d96f2d00f4ae744aef440a36ecca085d10";

const cityInput = document.getElementById("city-input");
const citySelect = document.getElementById("city");
const daysSlider = document.getElementById("days");
const daysValue = document.getElementById("days-value");
const resultSection = document.getElementById("weather-result");
const form = document.getElementById("weather-form");
const darkToggle = document.getElementById("dark-toggle");
const darkToggleImg = document.getElementById("dark-toggle-img");

// Initialisation du slider
daysValue.textContent = daysSlider.value;

// Gestion du slider
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

// Mode sombre
darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  darkToggle.setAttribute("aria-pressed", isDark);
  darkToggleImg.src = isDark ? "images/mode_clair.png" : "images/mode_sombre.png";
  darkToggleImg.alt = isDark ? "Activer le mode clair" : "Activer le mode sombre";
});

// Recherche des communes
let searchTimeout;
cityInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  const input = cityInput.value.trim();

  searchTimeout = setTimeout(async () => {
    if (input.length < 2) {
      citySelect.innerHTML = "";
      citySelect.disabled = true;
      return;
    }

    let url = "";
    if (/^\d{5}$/.test(input)) {
      url = `${geoApiUrl}?codePostal=${input}&fields=nom,code&format=json&boost=population`;
    } else {
      url = `${geoApiUrl}?nom=${encodeURIComponent(input)}&fields=nom,code&format=json&boost=population&limit=10`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();
      citySelect.innerHTML = "";
      
      if (!data.length) {
        citySelect.innerHTML = `<option value="">Aucune commune trouvée</option>`;
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
    } catch (error) {
      console.error("Erreur API:", error);
      citySelect.innerHTML = `<option value="">Erreur API</option>`;
      citySelect.disabled = true;
    }
  }, 300);
});

// Fonction pour obtenir l'image météo (version améliorée)
function getLocalWeatherImage(code) {
  // Codes correspondant à la pluie (selon l'API Meteo Concept)
  if (code >= 10 && code <= 16) return "images/pluie.jpg"; // Pluie faible à forte
  if (code >= 20 && code <= 22) return "images/pluie.jpg"; // Averses
  if (code >= 30 && code <= 32) return "images/pluie.jpg"; // Pluie et neige mêlées
  if (code === 40 || code === 41 || code === 45 || code === 46) return "images/pluie.jpg"; // Brouillard avec pluie
  if (code >= 60 && code <= 67) return "images/pluie.jpg"; // Orages avec pluie
  
  // Ensoleillé
  if (code === 0 || code === 1) return "images/sun.jpg";
  
  // Nuageux par défaut
  return "images/nuage.jpg";
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
  const days = Math.min(parseInt(daysSlider.value), 7);

  try {
    const res = await fetch(`${meteoApiUrl}/forecast/daily?token=${meteoToken}&insee=${insee}`);
    const data = await res.json();

    if (!data.forecast) {
      resultSection.innerHTML = `<p class="error">Aucune donnée météo disponible pour cette commune.</p>`;
      return;
    }

    const checkedInfos = Array.from(form.querySelectorAll('input[name="info"]:checked')).map(i => i.value);
    
    resultSection.innerHTML = data.forecast.slice(0, days).map(f => {
      const date = new Date(f.datetime);
      const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      const dayName = dayNames[date.getDay()];
      const formattedDate = date.toLocaleDateString("fr-FR");

      let additionalInfo = "";
      if (checkedInfos.includes("lat")) additionalInfo += `<p><strong>Latitude:</strong> ${f.lat?.toFixed(4) || "N/A"}</p>`;
      if (checkedInfos.includes("lon")) additionalInfo += `<p><strong>Longitude:</strong> ${f.lon?.toFixed(4) || "N/A"}</p>`;
      if (checkedInfos.includes("rain")) additionalInfo += `<p><strong>Pluie:</strong> ${f.rr10 || "0"} mm</p>`;
      if (checkedInfos.includes("wind")) additionalInfo += `<p><strong>Vent:</strong> ${f.wind10m || "N/A"} km/h</p>`;
      if (checkedInfos.includes("dir")) additionalInfo += `<p><strong>Direction vent:</strong> ${f.dirwind10m || "N/A"}°</p>`;
      if (checkedInfos.includes("fog")) additionalInfo += `<p><strong>Brouillard:</strong> ${f.probarain || "0"}%</p>`;

      return `
        <div class="weather-card" style="animation-delay: ${Math.random() * 0.3}s">
          <h3>${cityName} - ${dayName} ${formattedDate}</h3>
          <img src="${getLocalWeatherImage(f.weather)}" alt="Météo: ${f.weather}" class="weather-image" />
          <div class="temps">
            <p>🌡 Max: ${f.tmax}°C</p>
            <p>❄ Min: ${f.tmin}°C</p>
          </div>
          <div class="additional-info">
            ${additionalInfo}
          </div>
        </div>
      `;
    }).join("");
  } catch (error) {
    console.error("Erreur météo:", error);
    resultSection.innerHTML = `<p class="error">Erreur lors de la récupération des données météo. Veuillez réessayer.</p>`;
  }
});