


//Count employees in each department.

import { groupEmployeeByDepartment } from "./01_groupByDepartment.js";
import { data } from "./data.js";

function countEmployeByDepartment(){
    const map = groupEmployeeByDepartment()
    const iterator = map[Symbol.iterator]();
    for(const [key,val] of iterator){
        console.log(key,':', val.length)
    }
    
}

countEmployeByDepartment();