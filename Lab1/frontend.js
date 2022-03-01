var languages;
fetch("http://127.0.0.1:8125/api/languages")
    .then(response => response.json())
    .then(data => {
        languages = data;
        const languageList = document.getElementById("languageList");
        for (const language in languages) {
            languageList.innerHTML += "<li> " + languages[language]["name"] + " - " + language;
        }
    });

var receivedWord = document.getElementById("receivedWord");
var translatedWord = document.getElementById("translatedWord");
var language = document.getElementById("language");
var metricsList = document.getElementById("metrics");

function updateResultArea(newWords) {
    receivedWord.innerHTML = newWords["translatedWord"];
    translatedWord.innerHTML = newWords["word"];
    if (newWords["language"]) {
        language.innerHTML = languages[newWords["language"]]["name"];
    }
    else {
        language.innerHTML = "";
    }
}

function useRandomLanguage() {
    fetch("http://127.0.0.1:8125/api")
        .then(response => response.json())
        .then(data => {
            updateResultArea(data);
        })
}

function useChosenLanguage() {
    const chosenLanguage = document.getElementById("chosenLanguage").value;
    if (Object.keys(languages).includes(chosenLanguage)) {
        fetch("http://127.0.0.1:8125/api/word?lang=" + chosenLanguage)
        .then(response => response.json())
        .then(data => {
            updateResultArea(data);
        })
    }
}

function getMetrics() {
    fetch("http://127.0.0.1:8125/api/metrics")
        .then(response => response.json())
        .then(metrics => {
            metricsList.innerHTML = "";
            for (var metricIndex in metrics) {
                const metric = metrics[metricIndex];
                var newMetric = "<li> request: " + metric["request"] + "<ul>";
                for (var apiCallIndex in metric["apiCalls"]) {
                    const apiCall = metric["apiCalls"][apiCallIndex];   
                    newMetric += "<li> API Call: <ul> <li> request: <ul>";
                    for (var requestMetric in apiCall["request"]) {
                        newMetric += "<li>" + requestMetric + ": " + apiCall["request"][requestMetric] + "</li>" ;
                    }
                    newMetric += "</ul></li> <li> response: <ul>";
                    for (var responseMetric in apiCall["response"]) {
                        newMetric += "<li>" + responseMetric + ": " + apiCall["response"][responseMetric] + "</li>";
                    }
                    newMetric += "</ul></li> <li> latency: " + apiCall["latency"] + "</li>";
                    newMetric += "</ul></li>";
                }
                newMetric += "</ul></li>";
                metricsList.innerHTML = newMetric + metricsList.innerHTML;
            }
        })
}