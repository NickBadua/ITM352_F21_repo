
var attributes = "Nick;21;21.5;-20.5";

var parts = attributes.split(";");


/*
for(part of parts) {
    console.log(`${part} isNonNegInt: ${isNonNegInt(part, true)}`);
}
*/

parts.forEach (checkIt);
 
function isNonNegInt(q, returnErrors = false) {
   //Checks if a string q is a non-neg integer. If returnErrors is ture, the array of errors is erturned, otherwise, returns true q is non-neg int.
   errors = []; // assume no errors at first
   if(Number(q) != q) errors.push('Not a number!'); // Check if string is a number value
   if(q < 0) errors.push('Negative value!'); // Check if it is non-negative
   if(parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer
 
   return (returnErrors ? errors : (errors.length == 0));
}
 
function checkIt (item, index) {
   console.log(`part ${index} is ${(isNonNegInt(item)?'a':'not a')} quantity`);
}

