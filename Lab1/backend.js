var http = require('http');
var fs = require('fs');
var path = require('path');
var axios = require('axios').default;

var apiKey = JSON.parse(fs.readFileSync('config.json'))["rapid-api-key"];
var globalLogs = [];

async function log(logs) {
    var data = fs.readFileSync('metrics.json');
    var json = JSON.parse(data);
    json.push(...globalLogs);
    fs.writeFileSync("metrics.json", JSON.stringify(json, null, 4));
}

function getRequestMetrics(request) {
    return { 'method': request['method'], 'url': request['url']};
}

function getResponseMetrics(response) {
    return {'status': response.status, 'server': response.headers['server'], 'date': response.headers['date'], 'content-type': response.headers['content-type']};
}

async function makeRequest(options, logEntry) {
    var start = process.hrtime();
    var errorOccurred = false;
    const response = await axios.request(options)
        .then(data => data)
        .catch(err => { errorOccurred = true; return err; });
    var end = process.hrtime(start);
    var latency = end[0] * 1000 + end[1] / 1000000;
    logEntry.push({
        'request': getRequestMetrics(options),
        'response': getResponseMetrics(response),
        'latency': latency.toString()
    });
    if (errorOccurred) {
        throw new Error();
    }
    return response;
}

async function getRandomNumbers(numberCount, min, max, logEntry) {
    var options = {
        method: 'GET',
        url: "http://www.randomnumberapi.com/api/v1.0/random",
        params: { 'min': min, 'max': max, 'count': numberCount }
    };
    const response = await makeRequest(options, logEntry);
    return response.data;
}

async function getRandomWord(logEntry) {
    var options = {
        method: 'GET',
        url: "https://random-word-api.herokuapp.com/word"
    };
    const response = await makeRequest(options, logEntry);
    return response.data[0];
}

async function getLanguages(logEntry) {
    var options = {
        method: 'GET',
        url: 'https://microsoft-translator-text.p.rapidapi.com/languages',
        params: {'api-version': '3.0'},
        headers: {
          'x-rapidapi-host': 'microsoft-translator-text.p.rapidapi.com',
          'x-rapidapi-key': apiKey
        }
      };
      const response = await makeRequest(options, logEntry);
      delete response.data["translation"]["en"];
      return response.data["translation"];
}

async function translateWord(word, language, logEntry) {
    var options = {
        method: 'POST',
        url: 'https://microsoft-translator-text.p.rapidapi.com/translate',
        params: {
          to: language,
          'api-version': '3.0',
          from: 'en',
          profanityAction: 'NoAction',
          textType: 'plain'
        },
        headers: {
          'content-type': 'application/json',
          'x-rapidapi-host': 'microsoft-translator-text.p.rapidapi.com',
          'x-rapidapi-key': apiKey
        },
        data: [{Text: word}]
      };
      const response = await makeRequest(options, logEntry);
      if (!response["data"]) {
          return "error";
      }
      return response.data[0]["translations"][0]["text"];
}

http.createServer(async function (request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    response.setHeader('Access-Control-Max-Age', 2592000);

    var logEntry = {
        'request': request.url,
        'apiCalls': []
    };

    try {
        if (request.url == "/api") {
            var word = await getRandomWord(logEntry["apiCalls"]);
            var languages = await getLanguages(logEntry["apiCalls"]);
            var languageIndex = await getRandomNumbers(1, 0, Object.keys(languages).length, logEntry["apiCalls"]);
            var language = Object.keys(languages)[languageIndex];
            var translatedWord = await translateWord(word, language, logEntry["apiCalls"]);
            response.writeHead(200);
            response.write(JSON.stringify({'word': word, 'translatedWord': translatedWord, 'language': language}))
            response.end();
        }
        else if (request.url == "/api/languages") {
            languages = await getLanguages(logEntry["apiCalls"]);
            response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
            response.write(JSON.stringify(languages));
            response.end();
        }
        else if (request.url.startsWith("/api/word?lang=")) {
            var language = request.url.substring(15);
            var word = await getRandomWord(logEntry["apiCalls"]);
            var translatedWord = await translateWord(word, language, logEntry["apiCalls"]);
            response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
            response.write(JSON.stringify({'word': word, 'translatedWord': translatedWord}));
            response.end();
        }
        else if (request.url == "/api/metrics") {
            var metrics = fs.readFileSync('metrics.json');
            response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
            response.write(metrics);
            response.end();
        }
        else {
            response.writeHead(404);
            response.end();
        }
    }
    catch (ex) {
        response.writeHead(500);
        response.end();
    }
    
    response.on('finish', () => {
        globalLogs.push(logEntry);
    })

}).listen(8125);
console.log('Server running at http://127.0.0.1:8125/');

setInterval(() => {
    log(globalLogs);
    globalLogs = [];
    console.log("Wrote metrics to file.");
}, 10000)