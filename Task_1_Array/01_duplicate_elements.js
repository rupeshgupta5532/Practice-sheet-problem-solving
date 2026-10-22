



function findDuplicateElementsInArray(arr){
    const duplicateElements = [];

    const set = new Set();

    arr.forEach(element => {
        if(set.has(element)){
            duplicateElements.push(element);
        }else{
            set.add(element)
        }
    });

    return duplicateElements;
}


const arr = [1,2,3,4,2,4,3,7]
const duplicates = findDuplicateElementsInArray(arr)

console.log(duplicates)