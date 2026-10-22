

function checkAnagrams(str1,str2){
    
    const map1 = new Map();
    Mapper(str1,map1);


    const map2 = new Map();
    Mapper(str2,map2);

    if(map1.size !== map2.size){
        return false;
    }

    for(const [key,val] of map1){
        if(!map2.has(key) || map2.get(key) !== val){
            return false;
        }
    }
    return true
}


function Mapper(str,map){
    for(let elem of str){
        if(map.has(elem)){
            let val = map.get(elem);
            map.set(elem,++val);
        }else{
            map.set(elem,1);
        }
    }
}

const str1 = "angelufs";
const str2 = "Galenus"
console.log(checkAnagrams(str1.toLowerCase(),str2.toLowerCase()))