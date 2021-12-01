/*
Author: Nicholas Badua
Date: 30 November 2021
Description: This is the script for the server which handles incoming requests through the various routes. 
*/

const fs = require('fs');
var express = require('express'); //allows use of express framework
var app = express(); //places express function in "app" variable

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
    let quantity_string = "login_page.html?"; //Created so we can then add on the individual "quantity${}" from the textboxes with the for loop
    let products_page = "products_display.html?";
    let redirected = false; //Used to check if the user has already been redirected by one of the prior if statements so the server doesn't try the next if statements (essentially prevents an error in temrinal).
    let error_counter = 0;

    //VALIDATING QUANTITY: First checking if all values are valid.
     quantities_array = []; //Creating an empty array for all desired quantities.
    var sum_of_quantities_array = 0; //Setting sum of quantities to 0 by default
    var should_sell = true; //Setting should sell to true by default.

    for (i in products_array) {
        var quantity_desired_by_user = request.body[`quantity${i}`].replace(/#/g, "%20"); //Gets textbox value and places it variable 'quantity_desired_by_user'

        if (quantity_desired_by_user == "") { //When a textbox is left blank... 
            quantity_desired_by_user = "0"; //The quantity for said product will be submitted as a 0 to the invoice.
        };
 
        quantities_array.push(quantity_desired_by_user); //At the end of each cycle in the loop, push the value into the quantities_array.

    };

    for (i in quantities_array) {

        if (!isNonNegInt(Number(quantities_array[i]))) { //If the quantity is not a valid number...
            should_sell = false; //Tell server that we should not sell
            products_page += `quantity${i}=` + quantities_array[i] + "++" + "invalid_number" + "&&";
            error_counter++;
        } else if (Number(quantities_array[i]) > products_array[i].quantity_available) { //If the quantity is greater than the amount we have available...
            should_sell = false; //Tell the server that we should not sell
            products_page += `quantity${i}=` + quantities_array[i] + "++" + "too_many_selected" + "&&";
            error_counter++;
        } else { //if there are no errors, then just add the (valid) quantity to the query string
           products_page += `quantity${i}=` + quantities_array[i] + "&&";
        };

    };

    if (error_counter > 0) {
        response.redirect(products_page);
    };
    //If we are able to successfully create the quantities_array following the loop...
    if (should_sell) {
        for (i in products_array) {
            sum_of_quantities_array += quantities_array[i]; //Gets sum of the entered quantities to be used to see if any values were actually added.

            //UPDATING Query String   
            quantity_string = quantity_string + `quantity${i}=` + quantities_array[i] + "&"; //Creates and adds a new "quantity${}" for each textbox and adds it to the end of the query string.
        
        };
    }

    //VALIDATION: Entered at least 1 value into a textbox
    if (should_sell && sum_of_quantities_array == 0 && !redirected) { //If the sum of all the quantity boxes are 0, then that means nothing was input so we have to prevent them from going to the invoice. 
        should_sell = false;
        redirected = true; //We are telling the server that we are going to be redirected, do not try to set the next header. 
        response.redirect("products_display.html?error=true_no_items_were_selected"); //Redirect to products_display but with an alert that says no items were selected.
    };

    //REDIRECT TO LOGIN: If everything checks out (i.e., good quantities)
    if (should_sell && !redirected) { //prevents error message in console and stops this code from being executed if there are errors
        response.redirect(quantity_string); //if there are no errors, then go to login.
    }
    
});
app.get("/login", function (request, response) {

    let params = new URLSearchParams(request.query);
    response.redirect("login_page.html?" + params);

});

app.post('/login', function (request, response, next) {
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    let login_username = request.body['username'].toLowerCase().replace(/#/g, "%20"); //Adapted from lab14 Ex4
    let login_password = request.body['password'];
    let params = new URLSearchParams(request.query);
    let redirected = false;
    
    let login_page_query = "login_page.html?";
    //login_page_query += params.toString();

    var quantities_string = "";
    for (i in products_array) {
        quantities_string += `&quantity${i}=` + params.get(`quantity${i}`);
    }

    //check to see if they put something into the username field
    if (login_username == "") {
        redirected = true;
        response.redirect(login_page_query + quantities_string + "&" + "login=no_login_entered");
    };
    //checking if the username exists in database
    if (!redirected && typeof users_reg_data[login_username] != 'undefined') {
        //check if password matches the one in the database
        if (users_reg_data[login_username]["password"] == login_password) {
            //update total available for each products
            let quantities_array = [];
            
            for (i in products_array) {
                quantities_array.push(params.get(`quantity${i}`));
            };
            
            for (i in products_array) { 
                if (quantities_array[i] <= products_array[i].quantity_available) {
                products_array[i].total_sold += Number(quantities_array[i]);
                products_array[i].quantity_available -= Number(quantities_array[i]); //updating quantity available
            }; 
        }

            response.redirect("invoice.html?" + quantities_string + "&successful_user=" + users_reg_data[login_username].full_name.replace(/ /g,"%20") + "&successful_user_email=" + users_reg_data[login_username].email); 
        } else {
            //if not redirect with url and querystring to make sticky
            response.redirect(login_page_query + quantities_string + "&" + "attempted_login=true" + "&" + "login_username=" + login_username + "&" + "login_password=incorrect")
        }
    } else if (!redirected && typeof users_reg_data[login_username] == 'undefined') {
        //if not redirect with url and querystring to make sticky
        response.redirect(login_page_query + quantities_string + "&" + "attempted_login=true" + "&" + "login_username=" + login_username + "&" + "login_username_check=does_not_exist")
    }

});

app.get("/register", function (request, response) {
    let params = new URLSearchParams(request.query);
    response.redirect("registration_page.html?" + params);

});

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

        response.redirect("login_page.html?" + params + "&registration_successful=true"); 
    };
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

function isEmptyField(input) { //check if the input field was left blank. If it was, then it returns true.
    if (input == "") {
        has_error = true;
        return true;
    } else {
        return false;
    }
}
