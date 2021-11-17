    /*
    Author: Nicholas Badua
    Date: 16 November 2021
    Description: This is the script for the server which handles incoming requests through the various routes. 
    */

var express = require('express');
var app = express(); //places express function in app variable

// Routing 

// monitor all requests
app.all('*', function (request, response, next) {
    console.log(request.method + ' to ' + request.path);
    next();
});

var products_array = require('./products_data.json'); //Adapted from lab13
products_array.forEach((products_array, i) => { products_array.total_sold = 0 });

app.get("/products_data.js", function (request, response, next) { //Adapted from lab13. Responds to the get request on the the client pages to respond with the products data from json file but now defined in javascript.
    response.type('.js');
    var products_str = `var products_array = ${JSON.stringify(products_array)};`;
    response.send(products_str);
    next();
});

app.use(express.urlencoded({ extended: true })); //decodes url encoded data in body and puts it in request.body

// Process purchase request (validate quantities, check quantity available)
app.post('/purchase', function (request, response, next) { //Adapted from lab 13 Exercise 5
    let quantity_string = "invoice.html?"; //Created so we can then add on the individual "quantity${}" from the textboxes with the for loop
    let redirected = false; //used to check if the user has already been redirected

    //VALIDATING QUANTITY
        quantities_array = [];
        var check_for_only_valid_product_quantities = [];
        var sum_of_quantities_array = 0;
        //Loop
        for (i in products_array) {
            var quantity_desired_by_user = request.body[`quantity${i}`]; //gets textbox value and places it variable 'quantity_desired_by_user'
            
            if (quantity_desired_by_user == "") { //When a textbox is left blank, it will be submitted as a 0 to the invoice
                quantity_desired_by_user = "0";
            };

            //VALIDATION: Integer Check
                if (!isNonNegInt(quantity_desired_by_user)) { //If quantity_desired_by_user is not a valid quantity, then we get redirected back to products_display.html
                    redirected = true; //We are telling the server that we've been redirected 
                    
                    response.redirect("products_display.html?error=true");
                };

            //VALIDATION: Enough in Inventory
                if (quantity_desired_by_user > products_array[i].quantity_available) {
                    redirected = true; //We are telling the server that we've been redirected 
                    response.redirect("products_display.html?error=true_not_enough_in_inventory");
                };

            //Used for checking if at least one value was added to a textbox
                quantities_array[i] = Number(quantity_desired_by_user); //having the objects each indexed position be "quantity_desired_by_user" so we can then add that to the total sum of quantities
                sum_of_quantities_array += quantities_array[i]; //gets sum of the entered quantities

            //UPDATING "Total Sold" and "Quantity Available" for each item
                if (!redirected && isNonNegInt(sum_of_quantities_array) == true && quantity_desired_by_user <= products_array[i].quantity_available) {
                    products_array[i].total_sold += Number(quantity_desired_by_user); //PROBLEM: IF ONE QUANTITY IS GOOD AND THE OTHER IS BAD, IT WILL GIVE WARNING, BUT WILL STILL REMOVE ITEMS FROM INVENTORY BC IT'S DOING IT FOR THE INDIVIDUAL ITEMS BC OF FOR LOOP. HAVE IT CHECK THE QUANTITIES FIRST, THEN DO THE CALCULATIONS AFTERWARDS.
                    products_array[i].quantity_available -= Number(quantity_desired_by_user); //updating quantity available
                };

            //UPDATING Query String   
                quantity_string = quantity_string + `quantity${i}=` + quantity_desired_by_user + "&&"; //Creates and adds a new "quantity${}" for each textbox and adds it to the query string
            //Array to ensure that all quantities are valid before we update the total sold/available
                check_for_only_valid_product_quantities.push(quantity_desired_by_user);
            }; //End of Loop
        
console.log()
    //VALIDATION: Entered at least 1 value into a textbox
        if(sum_of_quantities_array == 0) {
            response.redirect("products_display.html?error=true_no_items_were_selected");
        };

    //REDIRECT TO INVOICE
        if (!redirected) { //prevents error message in console and stops this code from being executed if there are errors
        response.redirect(quantity_string); //if there are no errors, then go to this file with the now updated query string
        }
        
});
//Return to Shopping Button After Invoice
app.get('/back', function (request, response, next) {
    response.redirect("products_display.html");
});

// route all other GET requests to files in public 
app.use(express.static('./public')); 

// start server
app.listen(8080, () => console.log(`listening on port 8080`));


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


