


function sortArrayWithoutSort(arr){
    let n = arr.length;
    for(let i=0;i<n;i++){
        for(let j=0;j<n-i-1;j++){
            if(arr[j]>arr[j+1]){
                //swap the element
                let temp = arr[j];
                arr[j] = arr[j+1];;
                arr[j+1] = temp;
            }
        }
    }
    return arr;
}


const arr = [2,3,4,1,7,0,8,10];

console.log(sortArrayWithoutSort(arr))

