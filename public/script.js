document.addEventListener("DOMContentLoaded", () => {
    // Mock data for temperature and humidity
    const tempData = [27, 28, 30, 32, 29, 27, 26];
    const humidityData = [45, 50, 60, 55, 52, 48, 46];

    // Calculate the compliance percentage
    const calculateCompliance = (data, min, max) => {
        const withinRange = data.filter(value => value >= min && value <= max).length;
        return (withinRange / data.length) * 100;
    };

    const tempCompliance = calculateCompliance(tempData, 25, 30);
    const humidityCompliance = calculateCompliance(humidityData, 33, 66);
    const averageCompliance = (tempCompliance + humidityCompliance) / 2;

    // Update the quality gauge
    const gaugeProgress = document.getElementById("gauge-progress");
    const gaugeLabel = document.getElementById("gauge-label");

    gaugeProgress.style.width = `${averageCompliance}%`;

    if (averageCompliance >= 90) {
        gaugeProgress.style.backgroundColor = "#4caf50"; // Green
        gaugeLabel.textContent = "Excellent";
    } else if (averageCompliance >= 60) {
        gaugeProgress.style.backgroundColor = "#ffc107"; // Yellow
        gaugeLabel.textContent = "Good";
    } else if (averageCompliance >= 30) {
        gaugeProgress.style.backgroundColor = "#ff9800"; // Orange
        gaugeLabel.textContent = "Moderate";
    } else {
        gaugeProgress.style.backgroundColor = "#f44336"; // Red
        gaugeLabel.textContent = "Poor";
    }

    // Graphs
    const tempCtx = document.getElementById("temp-chart").getContext("2d");
    const humidityCtx = document.getElementById("humidity-chart").getContext("2d");

    new Chart(tempCtx, {
        type: "line",
        data: {
            labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
            datasets: [
                {
                    label: "Temperature (°C)",
                    data: tempData,
                    borderColor: "#ff5733",
                    fill: false,
                    tension: 0.1
                }
            ]
        }
    });

    new Chart(humidityCtx, {
        type: "line",
        data: {
            labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
            datasets: [
                {
                    label: "Humidity (%)",
                    data: humidityData,
                    borderColor: "#4caf50",
                    fill: false,
                    tension: 0.1
                }
            ]
        }
    });
});