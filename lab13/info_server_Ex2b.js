var express = require('express'); //instead of http, it uses express package
var app = express();


app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path);
    next();
});

app.get('/test', function (request, response, next) {
    response.send("I'm in GET/test");
});

app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback