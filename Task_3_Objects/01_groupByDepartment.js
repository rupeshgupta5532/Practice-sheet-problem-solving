//Group employees by department.

import { data } from "./data.js";

export function groupEmployeeByDepartment(){
    const deptEmpMap = new Map();
    for(const emp of data){
        if(deptEmpMap.has(emp.department)){
            deptEmpMap.set(emp.department,[...deptEmpMap.get(emp.department),emp])
        }else{
            deptEmpMap.set(emp.department,[emp])
        }
    }
    return deptEmpMap;
}

const result = groupEmployeeByDepartment();

const iterator = result[Symbol.iterator]();
for(const [key,val] of iterator){
    console.log(key,":" ,val)
}