


async function retryMechanism(fn,maxAttempts=3,time){
    let attempts = 0;
    while(attempts < maxAttempts){
        try {
            return await fn()
        } catch (error) {
            attempts++;
            if(attempts === maxAttempts){
                throw new Error("Max Limit hitted")
            }
            await new Promise((resolve,reject)=> setTimeout(resolve,time))
        }
    }
}

function callbackFn(){
    console.log("callback called");
    throw new Error("error")
}
retryMechanism(callbackFn,3,1000).then((data)=> console.log("promise resolved")).catch((error)=>console.log("Promise Rejected",error))