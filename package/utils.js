// utils.js

const utils = {

  uid : function(prefix){
    return (prefix||"") + (Math.random() * Date.now()).toFixed(0);
  },

  omit : function(obj, fn){
    var result = {};
    for(var key in obj){
      if(!fn(obj[key], key)){
        result[key] = obj[key];
      }
    }
    return result;
  },

  matchFn : function(baseObj){
    return function(item){
      for(var key in baseObj){
        var objVal = baseObj[key];
        var itemVal = item[key];
        if(itemVal === undefined || itemVal !== objVal){
          return false;
        }
      }
      return true;
    };
  },

  isObject : function(toTest){
    return toTest && typeof(toTest) === "object" && !Array.isArray(toTest);
  },

  result : function(something){
    if(typeof(something) === "function"){
      return something();
    }
    return something;
  }

};

module.exports = utils;