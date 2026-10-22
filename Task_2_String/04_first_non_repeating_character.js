

function firstnonRepeatingCharacter(str){
    const map = new Map();
    for(let elem of str){
        if(map.has(elem)){
            let val = map.get(elem);
            map.set(elem,++val);
        }else{
            map.set(elem,1);
        }
    }

    for(char of str){
        if(map.get(char)==1){
            return char;
        }
    }
    return "NOT_FOUND"
}


const str = "aaaaaeabbfbcddcde";

console.log(firstnonRepeatingCharacter(str));