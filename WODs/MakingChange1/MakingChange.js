amount_needed = 175;

//Amount of quarters
quarters = Math.floor(amount_needed/25);
//Amount after quarters
amount_after_quarters = amount_needed%25;
//Amount of dimes
dimes = Math.floor(amount_after_quarters/10);
//Amount after dimes
amount_after_dimes = amount_after_quarters%10;
//Amonut of nickels
nickels = Math.floor(amount_after_dimes/5);
//Amount after nickels
amount_after_nickels = amount_after_dimes%5;
//Amount pennies
pennies = amount_after_nickels;

console.log(`For ${amount_needed} pennies, we need ${quarters} quarters, ${dimes} dimes, ${nickels} nickels, and ${pennies} pennies.`);