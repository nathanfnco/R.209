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

// Récupérer une icône météo (exemple générique)
function getMeteoConceptIcon(code) {
  return `https://www.meteo-concept.com/assets/images/weather/ico/${code}.svg`;
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
  const days = parseInt(daysSlider.value);

  try {
    const res = await fetch(`${meteoApiUrl}/forecast/daily?token=${meteoToken}&insee=${insee}&day=0`);
    const data = await res.json();

    if (!data.forecast) {
      resultSection.innerHTML = `<p>Aucune donnée météo disponible.</p>`;
      return;
    }

    const forecasts = data.forecast.slice(0, days);
    resultSection.innerHTML = forecasts.map(f => `
      <div class="weather-card">
        <h3>${cityName} - ${f.datetime}</h3>
        <img src="${getMeteoConceptIcon(f.weather)}" alt="Icône météo" />
        <p>Température max : ${f.tmax}°C</p>
        <p>Température min : ${f.tmin}°C</p>
        <p>Vent : ${f.wind10m} km/h</p>
        <p>Pluie : ${f.rr10} mm</p>
      </div>
    `).join("");
  } catch (err) {
    console.error(err);
    resultSection.innerHTML = `<p>Erreur lors de la récupération des données météo.</p>`;
  }
});
