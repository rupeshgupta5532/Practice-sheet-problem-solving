

// Check if a string is a palindrome. "madam" → true

import { reverseString } from "./01_reverse_string.js";

// step 1 - reverse a String
// step 2 - check if both strings are equals 

function checkPalindrome(text){


    let reverseStr = reverseString(text);

    if(text === reverseStr){
        return true;
    }
    return false
}

console.log(checkPalindrome("madam"))