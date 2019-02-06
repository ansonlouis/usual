// merge-and-diff.js

module.exports = class MergeAndDiff{
    
    constructor(target, ...objs){
        this.target = target;
        this.diff = {};

        for(let i=0; i<objs.length; i++){
            let rightObj = objs[i];
            this.merge(this.target, rightObj, this.diff);
        }
        if(Object.keys(this.diff).length === 0){
            this.diff = null;
        }
    };

    isPlain(obj){
      return Object.getPrototypeOf(obj) === Object.prototype;
    };

    merge(left, right, diff, target){
    
        if(typeof(right) !== "object"){
            return;
        }

        for(let key in right){
            let rightItem = right[key];
            let leftItem = left[key];
            let rightType = typeof(rightItem);
            let leftType = typeof(leftItem);
            
            if(leftItem === rightItem){
                continue;
            }
            else if(leftItem && leftType === "object" && !Array.isArray(leftItem) && this.isPlain(rightItem)){
                diff[key] = {};
                this.merge(leftItem, rightItem, diff[key]);
            }
            else{
                left[key] = rightItem;
                diff[key] = rightItem;
            }
        }
    };

};

