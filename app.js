document.addEventListener("DOMContentLoaded", () => {
  const apiKey = "c7feb77af6d9ce303c6804dc20fd1552";

  async function fetchWeatherData(city = null, lat = null, lon = null) {
    let url;

    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    } else {
      showError("No city or coordinates provided.");
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        showError(`Error: ${errorData.message || "Unknown error occurred."}`);
        return;
      }
      const data = await response.json();
      displayWeatherData(data);
    } catch (error) {
      showError(`Error fetching data: ${error.message}`);
    }
  }

  function showError(message) {
    const errorMessageElement = document.getElementById("error-message");
    if (errorMessageElement) {
      errorMessageElement.textContent = message;
      errorMessageElement.classList.remove("hidden");
    }
  }

  function clearError() {
    const errorMessageElement = document.getElementById("error-message");
    if (errorMessageElement) {
      errorMessageElement.textContent = "";
      errorMessageElement.classList.add("hidden");
    }
  }

  requestLocation();
  async function requestLocation() {
    try {
      const { latitude, longitude } = await getCurrentLocation();
      fetchWeatherData(null, latitude, longitude);
    } catch (error) {
      console.error("Error retrieving location:", error.message);
      showError("Access to location denied. Showing default weather.");

      const fallbackLat = 40.7128;
      const fallbackLon = -74.006;
      fetchWeatherData(null, fallbackLat, fallbackLon);
    }
  }

  function getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        }
      );
    });
  }

  function handleLocalizationClick() {
    clearError();
    requestLocation();
  }

  document.getElementById("search-btn").addEventListener("click", handleSearch);
  document.getElementById("city-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  });

  document
    .getElementById("localization-btn")
    .addEventListener("click", handleLocalizationClick);

  function handleSearch() {
    const city = document.getElementById("city-input").value.trim();
    if (city) {
      fetchWeatherData(city);
    } else {
      showError("Please enter a city name.");
    }
  }

  function displayWeatherData(data) {
    if (
      !data ||
      !data.main ||
      !data.weather ||
      !data.weather[0] ||
      !data.wind
    ) {
      showError("Invalid weather data received.");
      return;
    }

    document.getElementById("weather-section").classList.remove("hidden");
    document.getElementById("city-name").textContent =
      data.name || "Unknown city";
    document.getElementById("temperature").textContent = `${Math.round(
      data.main.temp || 0
    )} °C`;

    const description = data.weather[0].description || "No description";
    const capitalizedDescription =
      description.charAt(0).toUpperCase() + description.slice(1);
    document.getElementById("description").textContent = capitalizedDescription;

    const highLowTemperature = `H: ${Math.round(
      data.main.temp_max || 0
    )}°C L: ${Math.round(data.main.temp_min || 0)}°C`;
    document.getElementById("high-low-temperature").textContent =
      highLowTemperature;

    const infoContainer = document.getElementById("info-container");
    while (infoContainer.firstChild) {
      infoContainer.removeChild(infoContainer.firstChild);
    }

    const infoData = [
      {
        id: "wind",
        text: `Wind Speed: ${data.wind.speed || "N/A"} m/s`,
        iconClass: "wi wi-wind",
      },
      {
        id: "humidity",
        text: `Humidity: ${data.main.humidity || "N/A"}%`,
        iconClass: "wi wi-humidity",
      },
      {
        id: "visibility",
        text: `Visibility: ${(data.visibility / 1000).toFixed(1) || "N/A"} km`,
        iconClass: "wi wi-visibility",
      },
      {
        id: "pressure",
        text: `Pressure: ${data.main.pressure || "N/A"} hPa`,
        iconClass: "wi wi-barometer",
      },
      {
        id: "sunrise",
        text: `Sunrise: ${new Date(data.sys.sunrise * 1000).toLocaleTimeString(
          [],
          { hour: "2-digit", minute: "2-digit" }
        )}`,
        iconClass: "wi wi-sunrise",
      },
      {
        id: "sunset",
        text: `Sunset: ${new Date(data.sys.sunset * 1000).toLocaleTimeString(
          [],
          { hour: "2-digit", minute: "2-digit" }
        )}`,
        iconClass: "wi wi-sunset",
      },
    ];

    infoData.forEach(({ id, text, iconClass }) => {
      const infoBox = document.createElement("div");
      infoBox.className = "info-box";
      infoBox.id = id;

      const icon = document.createElement("i");
      icon.className = `info-icon ${iconClass}`;
      infoBox.appendChild(icon);

      const infoText = document.createElement("div");
      infoText.className = "info-text";
      infoText.textContent = text;
      infoBox.appendChild(infoText);

      infoContainer.appendChild(infoBox);
    });

    displayLocalTime(data.timezone || 0);
    updateBackground(data.weather[0].main || "Clear");
    clearError();
  }

  function displayLocalTime(timezoneOffset) {
    const localTimeBox = document.getElementById("local-time");
    if (timezoneOffset === 0) {
      localTimeBox.textContent = "Local Time: Data not available";
      return;
    }

    const localTime = new Date();
    const utcOffset = localTime.getTimezoneOffset() * 60000;
    const localTimeInMs =
      localTime.getTime() + utcOffset + timezoneOffset * 1000;
    const localTimeDate = new Date(localTimeInMs);

    const options = { weekday: "short", day: "numeric", month: "short" };
    const formattedDate = localTimeDate.toLocaleDateString("en-GB", options);
    const formattedTime = localTimeDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    localTimeBox.textContent = `Local Time: ${formattedDate}, ${formattedTime}`;
  }

  function updateBackground(weatherCondition) {
    const backgroundVideo = document.getElementById("background-video");
    const videoSource = document.getElementById("video-source");
    const backgroundImage = document.getElementById("background-image");

    const backgroundPaths = {
      clear: "public/videos/clear.mp4",
      clouds: "public/videos/clouds.mp4",
      rain: "public/videos/rain.mp4",
      snow: "public/videos/snow.mp4",
      thunderstorm: "public/videos/thunderstorm.mp4",
      mist: "public/videos/mist.mp4",
      haze: "public/videos/mist.mp4",
      fog: "public/videos/mist.mp4",
    };

    const weatherKey = weatherCondition.toLowerCase();
    const backgroundPath = backgroundPaths[weatherKey] || "";

    if (backgroundPath) {
      videoSource.src = backgroundPath;
      backgroundVideo.load();
      backgroundVideo.classList.remove("hidden");
      backgroundImage.classList.add("hidden");
      backgroundVideo.play();
    } else {
      backgroundImage.src = "public/default.jpg";
      backgroundImage.classList.remove("hidden");
      backgroundVideo.classList.add("hidden");
    }
  }

  requestLocation();
});
