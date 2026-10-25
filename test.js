

// const numbers = [5, 12, 8, 20, 3, 15];


// // Task: Return only the numbers greater than 10


// function findNumGreaterThan10(arr){

//     return arr.filter((elem)=> elem > 10);
// }


// console.log(findNumGreaterThan10(numbers))




// week 2 
//    - function scope 
//    - Array and Objects

// Task 1.7 — Find the intersection of two arrays
// Question: Return the unique elements that exist in both arrays without using Set.
// Example: [1, 2, 3, 4] and [3, 4, 5, 6] → [3, 4]

function intersectionOfArrays(arr1,arr2){
    let longestArrLength = Math.max(arr1.length,arr2.length);
    let longerArr = arr1.length >= arr2.length ? arr1 : arr2
    

    let toFindArr = longerArr.length == arr1.length ? arr2 : arr1
    let intersectionElements = []
    console.log(longestArrLength)
    console.log(longerArr)
    console.log(toFindArr)
    for(let elem of longerArr){
        if(toFindArr.includes(elem)){
            intersectionElements.push(elem);
        }
    }
    return intersectionElements;
}

const arr1 = [1, 2, 3, 4]
const arr2 =  [3, 4, 5, 6]
console.log(intersectionOfArrays(arr1,arr2))