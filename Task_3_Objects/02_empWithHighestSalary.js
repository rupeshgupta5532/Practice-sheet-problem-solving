
//Find the employee with the highest salary.

import { data } from "./data.js";



function empWithHighestSalary(){
    let HighestSalariedEmp = data[0];
    data.map((emp)=> {
        HighestSalariedEmp = emp.salary > HighestSalariedEmp.salary ? emp : HighestSalariedEmp;
    })
    return HighestSalariedEmp;
}

console.log(empWithHighestSalary())
