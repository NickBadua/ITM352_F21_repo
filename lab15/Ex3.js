//var userdata = require('./user_data.json'); //json data will load in the data as an object
const fs = require('fs');
var express = require('express');
var app = express();

var cookieParser = require('cookie-parser');
app.use(cookieParser()); //when cookie is received on the server when a request is made, this will take the data from the request and put it into the data object

//Make session 
var session = require('express-session');
app.use(session({secret: "MySecretKey", resave: true, saveUninitialized: true})); //any request, it will look for session id cookie and give to the user

app.get('/set_cookie', function (request, response) {
    //this will send a cookie to the requester
    response.cookie('name', 'Nick', { maxAge: 5000}); //cookies can only be sent in a response to requester only. We have to manually make a cookie (i.e., key: value). Server makes the cookie, gives it to browser. When server wants to use the cookie again, the server requests it from the browser.
    response.send("The name cookie has been sent!") //you can only do a response one time 
});

app.get('/use_cookie', function (request, response) {
    //this will get the name cookie from the requester and respond with a message
    console.log(request.cookies); 
    response.send(`Welcome to the Use Cookie page ${request.cookies["name"]}`) //you can get a specific cookie this way
});

app.get('/use_session', function (request, response) {
    //this will get the name cookie from the requester and respond with a message
   //console.log(request.cookies); 
    response.send(`Welcome, your session ID is ${request.session.id}`) //you can get a specific cookie this way
});

var filename = 'user_data.json';
if (fs.existsSync(filename)) {
    var user_data_string = fs.readFileSync(filename, 'utf-8');
    var users_reg_data = JSON.parse(user_data_string) //take a json string and convert to object. Turns into javascript

    var file_stats = fs.statSync(filename);
    console.log(`${filename} has ${file_stats.size} characters`);
    //have reg data file, so read data and parse into user_registration_info object
} else {
    console.log(`Hey! ${filename} doesn't exist`);
}

/* code from Ex4a
username = 'newuser'; 
users_reg_data[username] = {};
users_reg_data[username].password = 'newpass';
users_reg_data[username].email = 'newuser@user.com';

fs.writeFileSync(filename, JSON.stringify(users_reg_data));
*/

app.use(express.urlencoded({ extended: true })); //decode data and put it in request.body

app.get("/register", function (request, response) {
    // Give a simple register form
    str = `
<body>
<form action="" method="POST">
<input type="text" name="username" size="40" placeholder="enter username" ><br />
<input type="password" name="password" size="40" placeholder="enter password"><br />
<input type="password" name="repeat_password" size="40" placeholder="enter password again"><br />
<input type="email" name="email" size="40" placeholder="enter email"><br />
<input type="submit" value="Submit" id="submit">
</form>
</body>
    `;
    response.send(str);
});

app.post("/register", function (request, response) {
    //process a simple register form
    //get information from textboxes
    let new_user_login_username = request.body['username'];
    let new_user_login_password = request.body['password'];
    let new_user_login_repeat_password = request.body['repeat_password'];
    let new_user_login_email = request.body['email'];

    if (new_user_login_username !== "") { //check if they put something into the username field. PROBLEM: they can still put just a space and it be valid :(
        //validation: check if username exists
        if (typeof users_reg_data[new_user_login_username] !== 'undefined') {
            response.send(`The username ${new_user_login_username} already exists!`);
        //check if the passwords match
        } else if (new_user_login_repeat_password !== new_user_login_password) {
            response.send("passwords don't match!")
        //add new user to user_reg_data and save updates user_reg_data to user_data.json
        } else {
            users_reg_data[new_user_login_username] = {};
            users_reg_data[new_user_login_username].password = new_user_login_password;
            users_reg_data[new_user_login_username].email = new_user_login_email;
            fs.writeFileSync(filename, JSON.stringify(users_reg_data, null, 2)); //null,2 keeps the formatting of json
            //redirect to login page
            response.redirect('/login?login=successful');
        }
    } else { //if the username is left blank, then give alert.
        response.send("you didn't put anything...")
    }
});

app.get("/login", function (request, response) {
    //check if already logged in by seeing if the username cookie already exists
    
    if(typeof request.cookies['username'] != 'undefined') {
        welcome_str = `Welcome ${request.cookies['username']}!`
    } else {
        var welcome_str = "Welcome! You need to login.";
    };
    
    // Give a simple login form
    str = `
<body>
${welcome_str}
<form action="" method="POST">
<input type="text" name="username" size="40" placeholder="enter username" ><br />
<input type="password" name="password" size="40" placeholder="enter password"><br />
<input type="submit" value="Submit" id="submit">
</form>
</body>
    `;
    response.send(str);
});

app.post("/login", function (request, response) {
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    let login_username = request.body['username'];
    let login_password = request.body['password'];
    if (typeof users_reg_data[login_username] != 'undefined') { //checking if what they put in the username is actually something in the user data
        if (users_reg_data[login_username]["password"] == login_password) { 
            //puts username in a cookie called username only if the login is successful
            response.cookie('username', login_username);
            //Check if there is a last login
            if(typeof request.session['last login'] != 'undefined') {
                var last_login = request.session['last login']; //if there is a last login: make value of last login
            } else {
                var last_login = "First login!" //if there is no last login: set to first login
            }
            request.session['last login']= new Date().toISOString(); //put login date into session
            response.send(`You last logged in on ${last_login}`);
        } else {
            response.send(`incorrect password for ${login_username}`);
        }
    } else {
        response.send(`${login_username} does not exist`);
    }
});

app.listen(8080, () => console.log(`listening on port 8080`));