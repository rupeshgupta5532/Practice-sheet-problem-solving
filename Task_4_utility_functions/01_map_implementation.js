



class myMap{


    constructor(){
        this.map = {};
        this.size = 0;
    }

    set(key,val){
        this.map[key] = val;
        this.size++;
    }

    get(key){
        return this.map[key];
    }

    has(key){
        if(this.map[key]){
            return true;
        }else{
            return false;
        }
    }

}


const map = new myMap();


map.set("aman",200);

map.set("abhay",100);

console.log(map.get("aman"))

console.log(map.has("abhay"));

console.log(map)
