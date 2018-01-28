// utils.js

var utils = {
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
  }
};

module.exports = utils;