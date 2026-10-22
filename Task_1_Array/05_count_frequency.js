


function countFrequency(arr){
    let map = new Map();

    for (const elem of arr) {
        if(map.has(elem)){
            let val = map.get(elem);
            map.set(elem,++val);
        }else{
            map.set(elem,1);
        }
    }

    return map;
}

const arr = [1,8,2,2,8,9,10,20,10,1,7,3]
const freqMap = countFrequency(arr)

for(const[key,val] of freqMap){
    console.log(key , " : ",val)
}