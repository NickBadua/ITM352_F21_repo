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
    var q = request.body['quantity_textbox'];
    if (isNonNegInt(q) == true) {
    response.send(`Thank you for purchasing ${q} things!`);
    } else {
        response.send(`Error: ${q} is not a quantity. Hit the back button to fix..`)
    };

});

function isNonNegInt(q, returnErrors = false) {
    //Checks if a string q is a non-neg integer. If returnErrors is ture, the array of errors is erturned, otherwise, returns true q is non-neg int.
    errors = []; // assume no errors at first
    if (Number(q) != q) errors.push('Not a number!'); // Check if string is a number value
    else {
    if (q < 0) errors.push('Negative value!'); // Check if it is non-negative
    if (parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer
    }
    return (returnErrors ? errors : (errors.length == 0));
}


app.use(express.static('./public')); //if there is nothing that it can respond with, then it will use the thing in the parenthesis in static. Currently, it is looking for things in the public folder
app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback