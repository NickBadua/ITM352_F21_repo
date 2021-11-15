var express = require('express'); //instead of http, it uses express package
var app = express();
app.all('*', function (request, response, next) { //for all http requests that match any (*) path, execute this function
    response.send(request.method + ' to path ' + request.path); //get the request and just respond by telling what the request was
});
app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback