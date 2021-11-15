var http = require('http'); //first, loads a package called http to respond to requests

//create a server object:
http.createServer(function (req, res) { //when a request comes from http, it will be stored in the variable req
    console.log(req.headers); //output the request headers to the console
    res.writeHead(200, { 'Content-Type': 'text/html' }); // set MIME type to HTML; telling server to respond with html 
    res.write(`<h1>The server date is: ${Date.now()}</h1>`); //send a response to the client
    res.write('<h1>The client date is: <script>document.write( Date.now() );</script></h1>'); // send another response
    res.end(); //end the response
}).listen(8080); //the server object listens on port 8080

console.log('Hello world HTTP server listening on localhost port 8080');

//after node starts, the server continues to run and is waiting for a request