/*
Author: Nicholas Badua
Date: 14 December 2021
Description: This is the script for the server which handles incoming requests through the various routes. 
*/

const fs = require('fs');
const nodemailer = require("nodemailer");
var express = require('express'); //allows use of express framework
var app = express(); //places express function in "app" variable
var cookieParser = require('cookie-parser');
app.use(cookieParser()); //when cookie is received on the server when a request is made, this will take the data from the request and put it into the data object

//Make session 
var session = require('express-session');
app.use(session({ secret: "MySecretKey", resave: true, saveUninitialized: true })); //any request, it will look for session id cookie and give to the user

//Adapted from lab13. 
var products_array = require('./products_data.json'); //Makes the products data from the products_data.json file accessible on this file.

var filename = 'user_data.json'; //Adapted from lab14 Ex4
if (fs.existsSync(filename)) {
    var user_data_string = fs.readFileSync(filename, 'utf-8');
    var users_reg_data = JSON.parse(user_data_string) //take a json string and convert to object. Turns into javascript

    var file_stats = fs.statSync(filename);
    console.log(`${filename} has ${file_stats.size} characters`);
    //have reg data file, so read data and parse into user_registration_info object
} else {
    console.log(`Hey! ${filename} doesn't exist`);
}

// ROUTING
// Monitor all requests
app.all('*', function (request, response, next) {
    console.log(request.method + ' to ' + request.path);
    if (typeof request.session.cart == 'undefined') {  //creates a session cart whenever a request is sent and there is no session cart already
        request.session.cart = {};
        request.session.cart["cart_total"] = 0; //also initialize the cart total to 0. To be used for the top nav bar
    }
    next();
});

//Display the products page with rackets
app.get('/display_rackets', function (request, response, next) {
    response.redirect("products_display.html?product_key=rackets");
});

//Display the products page with clothes
app.get('/display_clothing', function (request, response, next) {
    response.redirect("products_display.html?product_key=clothing");
});

//Display the products page with footwear
app.get('/display_footwear', function (request, response, next) {
    response.redirect("products_display.html?product_key=footwear");
});

//Display the products page with racket accessories
app.get('/display_accessories', function (request, response, next) {
    response.redirect("products_display.html?product_key=accessories");
});


//Adds total_sold key with the value to 0 to every single product
for (product_key in products_array) {
    products_array[product_key].map(function (array_of_objects) { //found on: "https://stackoverflow.com/questions/39827087/add-key-value-pair-to-all-objects-in-array"
        array_of_objects.total_sold = 0;
    });
};

//Used so we can access the session cart from the client pages
app.get("/session_data.js", function (request, response, next) {
    response.type('.js');
    var session_str = `var cart_items_array = ${JSON.stringify(request.session.cart)};`;
    response.send(session_str);
});

//Used so we can access the products_array from the client pages (Adapted from lab13 exercise 4)
app.get("/products_data.js", function (request, response, next) { //Responds to the get request on the client pages and responds with the products data from the JSON file.
    response.type('.js');
    var products_str = `var products_array = ${JSON.stringify(products_array)};`; //put the products data on the JSON file into a variable and loaded in as a module.
    response.send(products_str);
});

app.use(express.urlencoded({ extended: true })); //Decodes url encoded data in body and puts it in request.body

//Route for when they press the add to cart button on every page (Adapted from lab 13 Exercise 5)
app.post('/add_to_cart', function (request, response, next) { 
    let params = new URLSearchParams(request.query);
    let quantity_string = "login_page.html?"; //Created so we can then add on the individual "quantity${}" from the textboxes with the for loop
    let redirected = false; //Used to check if the user has already been redirected by one of the prior if statements so the server doesn't try the next if statements (Prevents an error in terminal).
    var should_sell = true; //Setting should sell to true by default.
    let error_counter = 0;
    let sum_of_quantities_array = 0; //Setting sum of quantities to 0 by default
    //check what the product type is from url
    var product_type = params.get('product_key');
    let products_page = `products_display.html?product_key=${product_type}&&`;
    
    quantities_array = []; //Creating an empty array for all desired quantities.
    //PREPARING QUANTITIES: Give all empty qty textboxes the value 0 
    for (i in products_array[product_type]) {
        var quantity_desired_by_user = request.body[`quantity${i}`].replace(/#/g, "%20"); //Gets textbox value and places it variable 'quantity_desired_by_user'
        if (quantity_desired_by_user == "") { //When a textbox is left blank... 
            quantity_desired_by_user = "0"; //The quantity for said product will be submitted as a 0 to the invoice.
        };

        quantities_array.push(quantity_desired_by_user); //At the end of each cycle in the loop, push the value into the quantities_array.
    };
    //VALIDATING QUANTITY: First checking if all values are valid (i.e., positive whole numbers).
    for (i in quantities_array) {
        //Check if it is a positive whole number
        if (!isNonNegInt(Number(quantities_array[i]))) { 
            should_sell = false; //Tell server that we should not sell
            products_page += `quantity${i}=` + quantities_array[i] + "++" + "invalid_number" + "&&"; //add error to querystring
            error_counter++;
        //Check if it is less than 4 characters (so they can't put a lot)
        } else if (Number(quantities_array[i].length > 4)) {
            should_sell = false; //Tell the server that we should not sell
            products_page += `quantity${i}=` + "too_many_characters" + "&&";
        //Check if there is enough in stock for the desired qty
        } else if (Number(quantities_array[i]) > products_array[product_type][i].quantity_available) { 
            should_sell = false; //Tell the server that we should not sell
            products_page += `quantity${i}=` + quantities_array[i] + "++" + "too_many_selected" + "&&"; //add error to querystring
            error_counter++;
        //if there are no errors, then just add the (valid) quantity to the query string
        } else { 
            products_page += `quantity${i}=` + quantities_array[i] + "&&"; 
        };
    };

    //If there are errors, then redirect to the products page
    if (error_counter > 0) {
        response.redirect(products_page);
    };

    //If there are no errors go to last validation: check if anything was entered at all into any qty box
    if (should_sell) {
        for (i in products_array[product_type]) {
            sum_of_quantities_array += Number(quantities_array[i]); //Gets sum of the entered quantities.

            //UPDATING Query String   
            quantity_string = quantity_string + `quantity${i}=` + quantities_array[i] + "&"; //Creates and adds a new "quantity${}" for each textbox and adds it to the end of the query string.
        };
    }

    //VALIDATION: Entered at least 1 value into a textbox
    if (should_sell && sum_of_quantities_array == 0 && !redirected) { //If the sum of all the quantity boxes are 0, then that means nothing was input so we have to prevent them from going to the invoice. 
        should_sell = false;
        redirected = true; //We are telling the server that we are going to be redirected, do not try to set the next header. 
        response.redirect(`products_display.html?product_key=${product_type}&&error=true_no_items_were_selected`); //Redirect to products_display but with an alert that says no items were selected.
    };

    if (should_sell && sum_of_quantities_array != 0) {
        for (i in products_array[product_type]) {
            products_array[product_type][i].total_sold = Number(quantities_array[i]);
            products_array[product_type][i].quantity_available = products_array[product_type][i].quantity_available - products_array[product_type][i].total_sold; //Removing the amount in the cart from the quantity available of the product
        }
        console.log(products_array);
    }

    //REDIRECT BACK TO PRODUCTS PAGES: If everything checks out (i.e., good quantities), create the array of quantities with product_key
    if (request.session.cart[product_type] != undefined) { //if there are already quantities array for the product_key (category), then just just update the quantities.
        redirected = true;
        for (i in products_array[product_type]) {
            request.session.cart[product_type][i] = Number(request.session.cart[product_type][i]) + Number(quantities_array[i]); //adding new quantities to old quantities
        }
        products_page += "added_to_cart=successful";
    }

    if (typeof request.session.cart[product_type] == "undefined" && should_sell && !redirected) { //if there isn't already an array of quantities for the product_key, create a new one 
        //add items to cart
        request.session.cart[product_type] = quantities_array;
        //if there are no errors, then go back to products display to let them continue shopping.
        products_page += "added_to_cart=successful";
    }
    //UPDATE the cart total in nav bar to include the sum of the new quantities
    request.session.cart["cart_total"] += sum_of_quantities_array;
    console.log(products_array);
    //if the quantities pass every validation, go back to the products_page to allow them to continue shopping
    if (should_sell) {
        response.redirect(products_page);
    };
});


//ROUTE for changes to quantities made on shopping cart page
app.post("/update_quantities", function (request, response) {
    is_valid = true; //initialize variable to say that the item quantity is valid
    for (product_key in request.body["product_quantity"]) { 
        for (i in request.body["product_quantity"][product_key]) { //runs loops through each of the quantity boxes on shopping cart page under the specified product_key
            quantity = Number(request.body["product_quantity"][product_key][i]); //for convenience, I set the quantity value under a variable name 'quantity'
            //VALIDATION: check if positive whole number. Checking each box individually and immediately redirecting back to shopping cart to indicate errors
            if (!isNonNegInt(quantity) && is_valid) {
                is_valid = false; //no longer valid quantity
                response.redirect(`shopping_cart.html?product_key=${product_key}&index=${i}&quantity${i}=${quantity}++not_valid_qty`) //go back to shopping cart
            };
            var total_count_of_items = products_array[product_key][i].quantity_available + products_array[product_key][i].total_sold; //Keeps count of total items in the store. Used to allow user to put the whole quantity of stock in their shopping cart
            //VALIDATION: check if there is enough in stock
            if (quantity > total_count_of_items && is_valid) {
                is_valid = false;
                response.redirect(`shopping_cart.html?product_key=${product_key}&index=${i}&quantity${i}=${quantity}++too_many_selected`) //go back to shopping cart
            }
        };
    };
    if (is_valid) { //If it passes all validations, then move onto updating cart total for top nav bar and update the quantity in the session cart array
        request.session.cart["cart_total"] = 0; //recreate the cart_total key
        for (product_key in request.body["product_quantity"]) {

            for (i in request.body["product_quantity"][product_key]) {
                quantity = request.body["product_quantity"][product_key][i]; 
                request.session.cart["cart_total"] += Number(quantity); //updating the session cart_total with the new values in shopping cart
                if (quantity != products_array[product_key][i].total_sold) { //if quantity of box is no longer equal to the total sold in products_array
                    update_quantity_diff = quantity - products_array[product_key][i].total_sold; //find the difference between the quantity and old total_sold
                    products_array[product_key][i].total_sold = products_array[product_key][i].total_sold + update_quantity_diff; //add the difference
                    products_array[product_key][i].quantity_available = products_array[product_key][i].quantity_available - update_quantity_diff; //Removing the amount in the cart from the quantity available of the product
                };
                request.session.cart[product_key][i] = quantity; //updating the quantity in the session cart array under the specified product key with the new quantities
            };
            
        };
        response.redirect("shopping_cart.html?quantities_updated=true"); //if everything passes validation, go back to shopping cart.
    };

});

//ROUTE for login button on login_page.html
app.post('/login', function (request, response, next) { // (Adapted from lab14 Ex4)
    let login_username = request.body['username'].toLowerCase().replace(/#/g, "%20"); //put value from username field in variable "login_username"
    let login_password = request.body['password']; //put value from password field in variable "login_password"
    let params = new URLSearchParams(request.query);
    let redirected = false; 
    let login_page_query = "login_page.html?";

    //VALIDATION: check to see if they put something into the username field
    if (login_username == "") {
        redirected = true;
        response.redirect(login_page_query + "&&" + "login=no_login_entered");
    };
    //VALIDATION: checking if the username exists in database
    if (!redirected && typeof users_reg_data[login_username] != 'undefined') {
        //VALIDATION: check if password matches the one in the database
        if (users_reg_data[login_username]["password"] == login_password) {
            response.cookie('logged_in_user', login_username, { maxAge: 5000}); //put current successfully logged in user in a cookie for personalization use
            //Dictating which page they should go next:
            //check to see if they came from the checkout page (bc they can't continue without logging in)
            if (params.get("checkout") == "in_progress") {
                response.redirect("review_order.html") //continue on with their purchase to invoice
            } else {
                response.redirect("products_display.html?product_key=rackets"); //continue to a products browsing page
            }
        } else {
            //if password is incorrect, redirect with url and querystring to make sticky
            response.redirect(login_page_query + "&&" + "attempted_login=true" + "&&" + "login_username=" + login_username + "&&" + "login_password=incorrect")
        }
    } else if (!redirected && typeof users_reg_data[login_username] == 'undefined') {
        //if username doesn't exist, redirect with url and querystring to make sticky
        response.redirect(login_page_query + "&&" + "attempted_login=true" + "&&" + "login_username=" + login_username + "&&" + "login_username_check=does_not_exist")
    }

});

//ROUTE for registration button on registration page
app.get("/register", function (request, response) {
    let params = new URLSearchParams(request.query);
    response.redirect("registration_page.html?" + params);

});

//ROUTE for logout button on top nav bar
app.get("/logout", function (request, response) { //logout. This also clears the cart.
    response.clearCookie('logged_in_user'); //gets rid of logged in user from cookie
    response.clearCookie('logged_in_user_email');

    response.redirect("/index.html?&&logout=true");

});

//ROUTE to process registration form
app.post("/register", function (request, response) {
    //process a simple register form
    //get information from textboxes
    let new_user_full_name = request.body['full_name'].replace(/#/g, "%20");
    let new_user_email = request.body['email'].toLowerCase().replace(/#/g, "%20");
    let new_user_username = request.body['username'].toLowerCase().replace(/#/g, "%20");
    let new_user_password = request.body['password'];
    let new_user_repeat_password = request.body['reentered_password'];

    let params = new URLSearchParams(request.query);

    var quantities_string = "";
    for (i in products_array) {
        quantities_string += `&quantity${i}=` + params.get(`quantity${i}`);
    }
    //Used to make form fields sticky
    let querystring = "registration_page.html?";
    querystring += quantities_string + "&full_name=" + new_user_full_name + "&email=" + new_user_email + "&username=" + new_user_username;

    //VALIDATIONS: Form Fields
    let has_error = false; //initialize has_error to say there are no errors before any checking

    //Check FULL NAME field: something is entered
    if (isEmptyField(new_user_full_name) == true) {
        querystring += "&full_name_error=true"
    };

    //Check FULL NAME field: only letters are used 
    var only_letters = /^[A-Za-z ]+$/; //This is adapted from https://www.w3resource.com/javascript/form/all-letters-field.php
    if (!new_user_full_name.match(only_letters)) {
        has_error = true;
        querystring += "&full_name_syntax_error=true"
    };
    //Check FULL NAME field: entered value is less than 30 characters
    if (new_user_full_name.length > 30) {
        has_error = true;
        querystring += "&full_name_length_error=long"
    };

    //Check EMAIL field: something is entered
    if (isEmptyField(new_user_email) == true) {
        querystring += "&email_error=true"
    };
    //Check EMAIL field: correct email formatting
    var correct_mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; //referenced from https://www.w3resource.com/javascript/form/email-validation.php
    if (!new_user_email.match(correct_mailformat)) {
        has_error = true;
        querystring += "&email_format_error=true"
    };

    //Check USERNAME field: something is entered
    if (isEmptyField(new_user_username) == true) {
        querystring += "&username_error=true"
    };
    //Check USERNAME field: only letters and numbers are used 
    var only_letters_and_numbers = /^[A-Za-z0-9]+$/; //referenced from https://www.w3resource.com/javascript/form/all-numbers.php
    if (!new_user_username.match(only_letters_and_numbers)) {
        has_error = true;
        querystring += "&username_syntax_error=true"
    };
    //Check USERNAME field: entered value is greater than 4 characters long
    if (new_user_username.length < 4) {
        has_error = true;
        querystring += "&username_length_error=short"
    };
    //Check FULL NAME field: entered value is less than 10 characters
    if (new_user_username.length > 10) {
        has_error = true;
        querystring += "&username_length_error=long"
    }
    //Check USERNAME field: make sure username isn't taken by another user
    if (typeof users_reg_data[new_user_username] !== 'undefined') {
        has_error = true;
        querystring += "&username_exists=true"
    };

    //Check PASSWORD field: something is entered
    if (isEmptyField(new_user_password) == true) {
        querystring += "&password_error=true"
    };
    //Check PASSWORD field: entered value is greater than 6 characters
    if (new_user_password.length < 6) {
        has_error = true;
        querystring += "&password_length_error=short"
    }

    //Check REPEAT PASSWORD field: matches the password in the previous field
    if (new_user_repeat_password !== new_user_password) {
        has_error = true;
        querystring += "&password_match_error=true"
    }

    if (has_error) {
        response.redirect(querystring + "&attempted_registration=true"); //redirect back to registration page if has_error was changed to true.
    } else { //if registration fields are correct and pass the validations, then add the information to the user_data.json file
        users_reg_data[new_user_username] = {};
        users_reg_data[new_user_username].full_name = new_user_full_name;
        users_reg_data[new_user_username].password = new_user_password;
        users_reg_data[new_user_username].email = new_user_email;
        fs.writeFileSync(filename, JSON.stringify(users_reg_data, null, 2)); //null,2 keeps the formatting of json. 
        response.cookie('logged_in_user', new_user_username);
        response.redirect("products_display.html?product_key=rackets");

        if (params.has("checkout")) {
            response.redirect("review_order.html?registration_at_checkout_successful=true");  //to stop them from being able to skip login confirmation
        } else {
            response.redirect("login_page.html?" + params + "&registration_successful=true");
        };
    };
});

//ROUTE for when user clicks the cart button on the top nav bar
app.get("/view_cart", function (request, response) {
    //var current_cart_items = request.session.cart;
    //response.send(request.session.cart);
    response.redirect("shopping_cart.html");
});

//ROUTE to prevent user from accessing review_order.html without logging in
app.get('/review_order.html', function (request, response, next) {
    if (typeof request.cookies["logged_in_user"] == "undefined") {
        response.redirect("/login_page.html");
    }
    next();
});

//ROUTE to prevent user from accessing invoice.html without logging in
app.get('/invoice.html', function (request, response, next) {
    if (typeof request.cookies["logged_in_user"] == "undefined") {
        response.redirect("/login_page.html");
    }
    next();
});

//ROUTE for when they click the checkout button on shopping cart page
app.get('/checkout', function (request, response) {
    //VALIDATION: check if there is nothing in the cart
    if (JSON.stringify(request.session.cart["cart_total"]) == 0) {
        response.redirect("shopping_cart.html?cart=empty"); //send an alert that says the cart is empty
    }
    //VALIDATION: check if they are logged in
    if (typeof request.cookies["logged_in_user"] != "undefined") {
        response.redirect("review_order.html?successful_user=" + request.cookies["logged_in_user"]) //if they are logged in move onto the review order page
    } else {
        response.redirect("login_page.html?checkout=in_progress") //if they are not logged in, then go to login page
    }
});

//ROUTE for place order button on review order page. This sends an email and redirects user to invoice.html. Adapted from: "https://www.w3schools.com/nodejs/nodejs_email.asp"
app.get("/place_order", function (request, response) {
    // Generate HTML invoice string for email
    let invoice_str = `
  <body style="background-color:white; text-align:center;">
  <h2 style="font-size:50px; color:black;">Thank you for your order ${request.cookies["logged_in_user"]}!</h2>
  <table style="text-align:center;width:50%;border:3px solid black;border-collapse:collapse;margin-left:auto;margin-right:auto">
  <th style="background-color:black; color:white">Item</th>
  <th style="background-color:black; color:white">Quantity</th>
  <th style="background-color:black; color:white">Price</th>`;
    
  //loading the session shopping cart quantities into the invoice str
  let shopping_cart = request.session.cart;
    for (product_key in products_array) {
        for (i = 0; i < products_array[product_key].length; i++) {
            if (typeof shopping_cart[product_key] == 'undefined') continue;
            quantity = shopping_cart[product_key][i];
            if (quantity > 0) {
                invoice_str += `
          <tr>
          <td style="border:1px solid black">${products_array[product_key][i].name}</td>
          <td style="border:1px solid black">${quantity}</td>
          <td style="border:1px solid black">${products_array[product_key][i].price}</td>
          <tr>`;
            }
        }
    }
    invoice_str += '</table></body>';

    //sender information for authentication
    const transporter = nodemailer.createTransport({ 
        service: "outlook",
        auth: {
            user: "nicktennisshop@outlook.com",
            pass: "passward123123"
        }
    });

    //specify the the email information
    const options = {
        from: "nicktennisshop@outlook.com",
        to: users_reg_data[request.cookies["logged_in_user"]].email,
        subject: "ORDER RECEIVED!",
        html: invoice_str // html body

    };

    transporter.sendMail(options, function (err, info) {
        if (err) {
            console.log(err);
            return;
        }
        console.log("A copy of the invoice has been sent to " + users_reg_data[request.cookies["logged_in_user"]].email);
    });

    response.cookie('logged_in_user_email', users_reg_data[request.cookies["logged_in_user"]].email); //create a cookie with the user's email in it to be used on the invoice
    response.redirect("invoice.html");
});


//Return to shopping button on Invoice page
app.get('/back', function (request, response) {
    request.session.destroy(); //log out user and clear cart
    response.clearCookie("logged_in_user"); //got this from https://www.geeksforgeeks.org/express-js-res-clearcookie-function/
    response.redirect("products_display.html?product_key=rackets");
});

//Route all other GET requests to files in public 
app.use(express.static('./public'));

//Start server
app.listen(8080, () => console.log(`listening on port 8080`));


//FUNCTIONS--------------
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

function isEmptyField(input) { //check if the input field was left blank. If it was, then it returns true.
    if (input == "") {
        has_error = true;
        return true;
    } else {
        return false;
    }
}
