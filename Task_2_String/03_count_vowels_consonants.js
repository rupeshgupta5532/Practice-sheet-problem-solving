


function countVowelsAndConsonants(str){
    const vowels = ['a','e','i','o','u'];
    let vowelsCount=0,consonantsCount = 0;
    for (const elem of str) {
        if(vowels.includes(elem)){
            vowelsCount++;
        }else{
            consonantsCount++;
        }
    }
    return {
        vowelsCount,
        consonantsCount
    }
}
const str = "apple";
console.log(countVowelsAndConsonants(str))

// CAUTION !
//if needed to remove the duplicates element , we have to first remove the duplicates character !!!