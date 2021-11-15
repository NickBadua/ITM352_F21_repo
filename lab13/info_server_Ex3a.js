var express = require('express'); //instead of http, it uses express package
var app = express();
var myParser = require("body-parser"); 

app.get('/test', function (request, response, next) {
    response.send("I'm in GET /test");
    next();
});

app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path);
    next();
});

app.use(express.urlencoded({ extended: true }));
app.post("/process_form", function (request, response) {
    response.send(request.body); 
});


app.use(express.static('./public')); //if there is nothing that it can respond with, then it will use the thing in the parenthesis in static. Currently, it is looking for things in the public folder
app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback