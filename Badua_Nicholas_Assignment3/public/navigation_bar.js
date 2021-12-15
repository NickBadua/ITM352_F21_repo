/*

Author: Nicholas Badua
Date: 14 December 2021
Description: This has file has the code for the function used to get the cookie on client-side pages. Also, it has the code for the navigation bar that appears on all pages.

*/

//found this function on https://stackoverflow.com/questions/10730362/get-cookie-by-name
function getCookie(name) {
    const value = `; ${document.cookie}`; 
    const parts = value.split(`; ${name}=`); //prepend the cookies string with "; ", so that every cookie name is enclosed with "; " and "=":
    if (parts.length === 2) return parts.pop().split(';').shift(); //if token is found in a cookie string, pull that out from an array with pop()
};

//To create the same navigation bar at the top of every page
function createTopNavigationBar(updated_cart_total) { //check if the input field was left blank. If it was, then it returns true.
    if (typeof getCookie("logged_in_user") != "undefined") {
        document.write(`
        <a>Welcome ${getCookie("logged_in_user")}!</a>
        <a href="/logout">Logout</a>
        `);
    } else {
        document.write(`
        <a href="/registration_page.html">Register</a>
        <a href="/login_page.html">Login</a>
        `);
    }
    document.write(`<a href="/view_cart">Cart (${updated_cart_total})</a>`);
}
