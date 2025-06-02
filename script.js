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

// Mise à jour affichage jours slider
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

// Mode sombre toggle
darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  darkToggle.setAttribute("aria-pressed", isDark);
  darkToggleImg.src = isDark ? "images/mode_clair.png" : "images/mode_sombre.png";
  darkToggleImg.alt = isDark ? "Activer le mode clair" : "Activer le mode sombre";
});

// Recherche des communes par code postal OU nom de ville
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
    } catch {
      citySelect.innerHTML = `<option>Erreur API</option>`;
      citySelect.disabled = true;
    }
  }, 300);
});

// Fonction pour icône météo locale
function getLocalWeatherImage(code) {
  if ([0, 1].includes(code)) return "images/sun.jpg";
  if ([5, 6, 7].includes(code)) return "images/pluie.jpg";
  return "images/nuage.jpg";
}

// Soumission du formulaire
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (citySelect.disabled || !citySelect.value) {
    alert("Veuillez sélectionner une commune.");
    return;
  }

  const insee = citySelect.value;
  const cityName = citySelect.options[citySelect.selectedIndex].text;
  let days = parseInt(daysSlider.value);
  if (days > 7) days = 7;

  try {
    const res = await fetch(`${meteoApiUrl}/forecast/daily?token=${meteoToken}&insee=${insee}`);
    const data = await res.json();

    if (!data.forecast) {
      resultSection.innerHTML = `<p>Aucune donnée météo disponible.</p>`;
      return;
    }

    const checkedInfos = Array.from(form.querySelectorAll('input[name="info"]:checked')).map(i => i.value);

    resultSection.innerHTML = data.forecast.slice(0, days).map(f => {
      const d = new Date(f.datetime);
      const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      const titre = `${jours[d.getDay()]} - ${d.toLocaleDateString("fr-FR")}`;

      let extras = "";
if (checkedInfos.includes("lat")) extras += `<p>Latitude : ${f.lat ?? "N/A"}</p>`;
if (checkedInfos.includes("lon")) extras += `<p>Longitude : ${f.lon ?? "N/A"}</p>`;
if (checkedInfos.includes("rain")) extras += `<p>Pluie : ${f.rr10 ?? "N/A"} mm</p>`;
if (checkedInfos.includes("wind")) extras += `<p>Vent : ${f.wind10m ?? "N/A"} km/h</p>`;
if (checkedInfos.includes("dir")) extras += `<p>Direction : ${f.dirwind10m ?? "N/A"}°</p>`;


      console.log("Code météo:", f.weather); // <-- Ajout ici

      return `
        <div class="weather-card">
          <h3>${cityName} - ${titre}</h3>
          <img src="${getLocalWeatherImage(f.weather)}" alt="Météo code ${f.weather}" class="weather-image" />
          <p>Max : ${f.tmax}°C</p>
          <p>Min : ${f.tmin}°C</p>
          ${extras}
        </div>
      `;
    }).join("");
  } catch {
    resultSection.innerHTML = `<p>Erreur lors de la récupération des données météo.</p>`;
  }
});
