

function myFilter(arr,fn){
    const filteredArray = [];

    for(let i=0;i<arr.length;i++){
        if(fn(arr[i])){ //passes the condition then push into the filtered array
            filteredArray.push(arr[i]);
        }
    }
    return filteredArray;
}

const arr = [1,2,3,4,5,6,7,8,12];
 console.log(myFilter(arr,elem => elem %2 === 0))
// console.log(myFilter(arr,(a,b)=> a%b == 1))