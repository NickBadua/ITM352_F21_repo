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

var products = require('./product_data.json');
products.forEach((prod, i) => { prod.total_sold = 0});

app.get("/product_data.js", function (request, response, next) { //when the script src sends a get request for /product_data.js
    response.type('.js'); //they respond with a javascript file
    var products_str = `var products = ${JSON.stringify(products)};`; //puts the json string of the products array into a variable
    response.send(products_str); //sends back that variable.
});


app.use(express.urlencoded({ extended: true }));
app.post("/process_form", function (request, response) { //responds to POST request from order_page.html
    let brand = products[0]['brand'];
    let brand_price = products[0]['price'];
    var q = request.body['quantity_textbox'];
    if (isNonNegInt(q) == true) { //if it is a valid number, then go to receipt
        response.redirect('receipt.html?quantity=' + q);
        products[0]["total_sold"] += Number(q); //updates total sold amount for the product in the index
    } else { //if invalid number, go back to order page
        response.redirect('order_page.html?error=Invalid%20Quantity&quantity_textbox=' + q);

    };
    
});

app.use(express.static('./public')); //if there is nothing that it can respond with, then it will use the thing in the parenthesis in static. Currently, it is looking for things in the public folder
app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback


//FUNCTION

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

