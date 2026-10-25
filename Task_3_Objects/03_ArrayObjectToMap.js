
// Convert an array of objects into an object keyed by ID.

import { data } from "./data.js";


function convertArrayObjectsToMap(){
    const map = new Map();
    for(const emp of data){
        map.set(emp.empId,emp);
    }
    return map;
}

const result = convertArrayObjectsToMap();

const iterator = result[Symbol.iterator]();
for(const[key,val] of iterator){
    console.log(key, " : ",val)
}