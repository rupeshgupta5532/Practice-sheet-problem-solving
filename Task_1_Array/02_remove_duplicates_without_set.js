


function removeDuplicatesWithoutSet(arr){
    const map = new Map();

    for(const elem of arr){
        if(map.has(elem)){
            let val = map.get(elem);
            map.set(elem,++val);
        }else{
            map.set(elem,1);
        }
    }

    let n = arr.length;
    for(let i=0 ;i<n;i++){
        if(map.has(arr[i]) && map.get(arr[i]) > 1){
            arr.splice(i,1);
            n--;
            i--;
        }
    }
    return arr;
}

const arr = [1,2,3,4,5,1,2,3,4,4,6,7]
console.log(removeDuplicatesWithoutSet(arr))