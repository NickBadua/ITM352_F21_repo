/*
Author: Nicholas Badua
Date: 18 November 2021
Description: This is the script for the server which handles incoming requests through the various routes. 
*/

var express = require('express'); //allows use of express framework
var app = express(); //places express function in "app" variable

// ROUTING

// Monitor all requests
app.all('*', function (request, response, next) {
    console.log(request.method + ' to ' + request.path);
    next();
});

//Enter store button
app.get('/enter_store', function (request, response, next) {
    response.redirect("products_display.html");
});

var products_array = require('./products_data.json'); //Adapted from lab13. Makes the products data from the products_data.json file accessible on this file.
products_array.forEach((products_array, i) => { products_array.total_sold = 0 }); //Adapted from lab13 exercise 4. Adds the "total_sold" property to each product in our json file, but only on memory.

app.get("/products_data.js", function (request, response, next) { //Adapted from lab13 exercise 4. Responds to the get request on the client pages and responds with the products data from the JSON file.
    response.type('.js'); 
    var products_str = `var products_array = ${JSON.stringify(products_array)};`; //put the products data on the JSON file into a variable and loaded in as a module.
    response.send(products_str);
});

app.use(express.urlencoded({ extended: true })); //Decodes url encoded data in body and puts it in request.body

// Process purchase request (validate quantities, check quantity available)
app.post('/purchase', function (request, response, next) { //Adapted from lab 13 Exercise 5
    let quantity_string = "invoice.html?"; //Created so we can then add on the individual "quantity${}" from the textboxes with the for loop
    let redirected = false; //Used to check if the user has already been redirected by one of the prior if statements so the server doesn't try the next if statements (essentially prevents an error in temrinal).

    //VALIDATING QUANTITY: First checking if all values are valid.
    quantities_array = []; //Creating an empty array for all desired quantities.
    var sum_of_quantities_array = 0; //Setting sum of quantities to 0 by default
    var should_sell = true; //Setting should sell to true by default.

    for (i in products_array) {
        var quantity_desired_by_user = request.body[`quantity${i}`]; //Gets textbox value and places it variable 'quantity_desired_by_user'

        if (quantity_desired_by_user == "") { //When a textbox is left blank... 
            quantity_desired_by_user = "0"; //The quantity for said product will be submitted as a 0 to the invoice.
        };

        if (!isNonNegInt(Number(quantity_desired_by_user))) { //If the quantity is not a valid number...
            should_sell = false; //Tell server that we should not sell
            redirected = true; //We are telling the server that we are going to be redirected, do not try to set the next header.
            response.redirect("products_display.html?error=true&item=" + products_array[i].name.replace(/ /g, "_")); //Redirect to products_page but now have an alert that says to enter a valid number for the specific product. Replace() is used to get rid of the spaces in the name since they are not allowed in urls.
        };

        if (Number(quantity_desired_by_user) > products_array[i].quantity_available) { //If the quantity is greater than the amount we have available...
            should_sell = false; //Tell the server that we should not sell
            redirected = true; //We are telling the server that we are going to be redirected, do not try to set the next header. 
            response.redirect("products_display.html?error=true_not_enough_in_inventory&item=" + products_array[i].name.replace(/ /g, "_")); //Redirect to products_page but now have an alert that says to we don't have enough in stock to fulfill their desired quantity for the specific product. Replace() is used to get rid of the spaces in the name since they are not allowed in urls.

        };

        quantities_array.push(Number(quantity_desired_by_user)); //At the end of each cycle in the loop, push the value into the quantities_array.

    };
    //If we are able to successfully create the quantities_array following the loop...
    if (should_sell) { 
        for (i in products_array) { 
            sum_of_quantities_array += quantities_array[i]; //Gets sum of the entered quantities to be used to see if any values were actually added.

            //UPDATING "Total Sold" and "Quantity Available" for each item
            if (quantities_array[i] <= products_array[i].quantity_available) {
                products_array[i].total_sold += quantities_array[i]; 
                products_array[i].quantity_available -= quantities_array[i]; //updating quantity available
            };
            //UPDATING Query String   
            quantity_string = quantity_string + `quantity${i}=` + quantities_array[i] + "&&"; //Creates and adds a new "quantity${}" for each textbox and adds it to the end of the query string.
        }; 
    }

    //VALIDATION: Entered at least 1 value into a textbox
    if (sum_of_quantities_array == 0 && !redirected) { //If the sum of all the quantity boxes are 0, then that means nothing was input so we have to prevent them from going to the invoice. 
        redirected = true; //We are telling the server that we are going to be redirected, do not try to set the next header. 
        response.redirect("products_display.html?error=true_no_items_were_selected"); //Redirect to products_display but with an alert that says no items were selected.
    };

    //REDIRECT TO INVOICE: If everything checks out (i.e., good quantities)
    if (!redirected) { //prevents error message in console and stops this code from being executed if there are errors
        response.redirect(quantity_string); //if there are no errors, then go to this file with the now updated query string
    }

});

//Return to shopping button on Invoice page
app.get('/back', function (request, response, next) {
    response.redirect("products_display.html");
});

//Route all other GET requests to files in public 
app.use(express.static('./public'));

//Start server
app.listen(8080, () => console.log(`listening on port 8080`));


//FUNCTION--------------
function isNonNegInt(q, returnErrors = false) { //Adapted from lab11 exercise 4.
    //Checks if a string q is a non-neg integer. If returnErrors is true, the array of errors is returned, otherwise, returns true q is non-neg int.
    errors = []; // assume no errors at first
    if (Number(q) != q) errors.push('Not a number!'); // Check if string is a number value
    else {
        if (q < 0) errors.push('Negative value!'); // Check if it is non-negative
        if (parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer
    }
    return (returnErrors ? errors : (errors.length == 0));
}


