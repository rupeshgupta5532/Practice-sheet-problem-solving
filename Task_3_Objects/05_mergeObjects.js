


//Merge two objects and handle duplicate keys.

function mergeObjects(obj1,obj2){
    return {
        ...obj1,
        ...obj2
    }
}


const obj1 = {
    name:"Yash Gupta",
    salary:100000,
    address:"Earth",
}

const obj2 = {
    name:"Abhay Kaushal",
    address:"Moon",
    id:1,
    isAdmin:false
}


console.log(mergeObjects(obj1,obj2))