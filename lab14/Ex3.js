//var userdata = require('./user_data.json'); //json data will load in the data as an object
const fs = require('fs');
var express = require('express');
var app = express();

var filename = 'user_data.json';
if (fs.existsSync(filename)) {
    var user_data_string = fs.readFileSync(filename, 'utf-8');
    var user_data_obj = JSON.parse(user_data_string) //take a json string and convert to object and arrays. Turns into javascript
    var file_stats = fs.statSync(filename);
    console.log(`${filename} has ${file_stats.size} characters`);
    //have reg data file, so read data and parse into user_registration_info object
} else {
    console.log(`Hey! ${filename} doesn't exist`);
    console.log(user_data_obj);
}

app.use(express.urlencoded({ extended: true })); //decode data and put it in request.body

app.get("/login", function (request, response) {
    // Give a simple login form
    str = `
<body>
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
    if (typeof user_data_obj[login_username] != 'undefined') { //checking if what they put in the username is actually something in the user data
        if (user_data_obj[login_username]["password"] == login_password) {
            response.send(`${login_username} is logged in`); 
        } else {
            response.send(`incorrect password for ${login_username}`); 
        }
    }  else {
        response.send(`${login_username} does not exist`);
    }
});

app.listen(8080, () => console.log(`listening on port 8080`));