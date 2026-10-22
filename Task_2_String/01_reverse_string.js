

// Algorithm for reversing a String

// step - 1 : take input from the user 
// step - 2 : trim the text
// find the length of the string 
// use reverse for loop and create an another stringBuilder and append into it


// sample text = "hello"
export function reverseString(text){
    let str = "";
    text.trim();
    let len = text.length;
    // console.log("len is : ",len, text)

    for (let i=len-1;i>=0;i--){
        // console.log("charAt ; ","hello".charAt(i))
        str += text.charAt(i);
        // console.log("str is ; ", str)
    }
    // console.log("old stirng : ",text , " \nnew String : " , str)
    return str;
}

console.log(reverseString("hello"))


