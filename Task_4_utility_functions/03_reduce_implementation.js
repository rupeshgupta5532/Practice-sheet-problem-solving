


function customReduce(arr,fn,initialValue){
    let accumulator = initialValue;
    for(let i=0;i<arr.length;i++){
        // console.log("acc ; ",accumulator)
        accumulator = fn(arr[i],accumulator);
    }
    return accumulator;
}

const arr = [1,2,4,6,8]

const reducedValue = customReduce(arr,(a,b) => a * b,1)
console.log(reducedValue)