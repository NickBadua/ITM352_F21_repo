var day = 25;
var month = "August";
var year = 2000;

//step 1
if (month == "January" || month == "February") {
    step1 = year - 1;
} else {
    step1 = year;
};

//step 2
step2 = (Math.floor(step1/4))+ step1;

//step 3
step3 = step2 - (Math.floor(step1/100));

//step 4
step4 = (Math.floor(step1/400)) + step3;

//step 5
step5 = step4 + day;

//step 6
monthkey = {"January":0,"February":3,"March":2,"April":5,"May":0,"June":3,"July":5,"August":1,"September":4,"October":6,"November":2,"December":4};
step6 = step5 + monthkey[month];

//step 7
step7 = step6%7;

//step 8
day_of_week = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

//output
console.log(`${month} ${day}, ${year} is on a ${day_of_week[step7]}`);