




let p1 = new Promise((resolve,reject)=>{
    try {
        resolve("Resolved 1")
    } catch (error) {
        reject("Rejected",error)
    }
})


let p2 = new Promise((resolve,reject)=>{
   try {
    // resolve("Resolve 2")
    reject("Rejected 2")
   } catch (error) {
    reject("Rejected 2")
   }
})


let p3 = new Promise((resolve,reject)=>{
    try {
        resolve("Resolved 3")
    } catch (error) {
        reject("Rejected",error)
    }
})
 
// Promise.all([p1,p2,p3]).then((data)=>console.log(data)).catch((error)=>console.log(error))

async function resolveAllPromise() {
    const [p1Res,p2Res,p3Res]= await Promise.all([p1,p2,p3]);
    console.log(p1Res,p2Res,p3Res)
}

resolveAllPromise().then(()=>console.log("All Resolved")).catch(error=> console.log("All Rejected ",error))