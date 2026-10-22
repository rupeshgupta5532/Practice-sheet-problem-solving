

let p1 = new Promise((resolve,reject)=>{
    try {
        resolve("Resolved 1")
    } catch (error) {
        reject("Rejected",error)
    }
})


let p2 = new Promise((_,reject)=>{
   try {
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

let p1res = p1
            .then(console.log("P1 Resolved"))
            .catch((error)=>{
                console.log("Rejected P1",error)
            })

let p2res = p2
            .then(()=>
            console.log("P2 Resolved"))
            .catch((error)=>{
                console.log("Rejected P2",error)
            })



let p3res = p3
            .then(console.log("P3 Resolved"))
            .catch((error)=>{
                console.log("Rejected P3",error)
            })
            