//var userdata = require('./user_data.json'); //json data will load in the data as an object
const fs = require('fs');

var filename = 'user_data.json';
if (fs.existsSync(filename)) {
    var user_data_string = fs.readFileSync(filename, 'utf-8');
    var user_data_obj = JSON.parse(user_data_string) //take a json string and convert to object and arrays. Turns into javascript
    var file_stats = fs.statSync(filename);
    console.log(`${filename} has ${file_stats.size} characters`);
    
} else {
    console.log(`Hey! ${filename} doesn't exist`);
}

