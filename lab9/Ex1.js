var month = 8;
var day = 25;
var year = 2000;

//step 1
step1 = 00;

//step 2
step2 = Math.floor(step1/4);

//step 3
step3 = step2 + step1;

//step 4
step4 = 2;

//step 6
step6 = step4 + step3;

//step 7
step7 = day + step6;

//step 8
step8 = step7;

//step 9 
step9 = step8-1; //not a leap

//final step
step10 = step9%7;

console.log(step10);
