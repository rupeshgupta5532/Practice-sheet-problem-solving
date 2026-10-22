


function HigherOrderFunction(callbkfn){
    return function (a,b){
        return callbkfn(a,b)
    };
}


function callbkfn(a,b){
    return a + b;
}

const result = HigherOrderFunction(callbkfn)

console.log("result is :",result(3,5))



//converting the callback function into the promises

let promise = (a,b)=>{
    return new Promise((resolve,reject)=>{
        try {
            // console.log("a b is : ",a, b)
            resolve({a,b})
        } catch (error) {
            reject("rejected",error)
        }
    })
}

const res = promise(5,3)
                    .then(data=>{
                        console.log("Promise Resolved!",data)
                        const output = callbkfn(data.a,data.b)
                        console.log("output Promise : ",output)
                    })
                    .catch((error)=>{
                        console.log("Promise Rejected inside",error)
                    })


