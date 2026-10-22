


function secondLargestElem(arr){
    arr.sort();
    console.log(arr)
    return arr[arr.length-1];
}


const arr = [30,50,20,10,80];

console.log(secondLargestElem(arr))