var http = require('http');
var axios = require('axios').default;

async function makeCalls() {
    for (i = 0; i < 10; i++) {
        var promises = [];
        for (j = 0; j < 50; j++) {
            var promise = axios.get("http://127.0.0.1:8125/api")
                .then(data => { console.log("Call succeeded.")})
                .catch(err => { console.log("Call failed.")});
            promises.push(promise)
        }
        await Promise.all(promises);
        console.log("Batch number " , i, " done.");
    }
}
 makeCalls();

