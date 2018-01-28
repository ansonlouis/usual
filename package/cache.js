// cache.js

import Base from "usual/base";
const utils = require('./utils');
const extend = require('extend');


export default class Cache extends Base{

  constructor(items, ...configs){

    // apply configs
    super(...configs, {
      model : null,
      name  : null,
      _map  : {},
      items : []
    });

    // empty (in case dev tried adding cache objects through
    // the cache config prop)
    this.empty();

    // add items properly sent through the items arg
    if(items){
      this.add(items);
    }

  };

  // allows iterating through the cache using for...of loop
  [Symbol.iterator]() {
    var index = 0;
    var data  = this.items;

    return {
      next: function(){
        if(index < data.length){
          return {
            value: data[index++],
            done: false
          };
        }else{
          return { done:true };
        }
      }
    };
  };

  empty(){
    this._map = {};
    this.items = [];
  };

  generateModelId(){
    return utils.uid("cid-");
  };

  index(index){
    if(index < 0){
      return this.items[this.items.length + index] || undefined;
    }
    return this.items[index] || undefined;
  };

  ids(){
    return Object.keys(this._map);
  };

  first(){
    return this.index(0);
  };

  last(){
    return this.index(-1);
  };

  add(objects){

    if(!(objects instanceof Array)){
      objects = [objects];
    }

    var addedItems = [];

    objects.forEach(function(obj){
      var oid = null;

      // see if object with same id exists in cache...if so,
      // lets just update the current model and exit iteration
      var cachedObj = this.get(obj);
      if(cachedObj){
        cachedObj.update(obj);
        addedItems.push(cachedObj);
        return;
      }

      // if this cache should contain a specific model, lets create a new one
      if(this.model){
        obj._parentCache = this;
        obj = new this.model(obj);
      }

      // use object's id if it's an instance of Base (must have id prop) or
      // generate a new ID if the passed object is a plain js value
      oid = obj.id || this.generateModelId();

      addedItems.push(obj);

      this.items.push(obj);
      this._map[oid] = obj;

    }, this);

    if(this.sort){
      this.items.sort(this.sort);
    }

    this.trigger('add', addedItems);

    var added = addedItems.length === 1 ? addedItems[0] : addedItems;
    return added;

  };


  get(idOrObject){
    if(idOrObject !== undefined){
      if(typeof(idOrObject) === "object" && idOrObject.id){
        idOrObject = idOrObject.id;
      }
      return this._map[idOrObject];
    }
    return undefined;
  };

  remove(id){
    var item = this.get(id);
    if(item !== undefined){
      if(item instanceof Base){
        item.destroy();
      }
      this._map[item.id] = undefined;
      delete this._map[item.id];
      this.trigger('remove');
    }
  };

  update(data, useId){
    if(data.id || useId){
      var item = this.get(useId || data.id);
      if(item){
        if(item instanceof Base){
          item.update(data);
        }
        else{
          extend(true, item, data);
        }
        return item;
      }
    }
    // if you got here, the item didnt have an id or the item did have
    // an id but did not match any existing item in the cache, add it
    return this.add(data, useId);

  };

  get length(){
    return Object.keys(this._map).length;
  };

  forEach(callback, ctx){
    for(var key in this._map){
      var result = callback && callback.call(ctx || this, this._map[key], key, this._map);
      if(result === false){
        return;
      }
    }
  };

  find(query){
    var results = [];
    var regex = new RegExp('^' + query, 'i');
    this.forEach(function(item, id){
      if(id === query){
        results.unshift(item);
      }
      else if(regex.test(id)){
        results.push(item);
      }
    });
    return results;
  };

  findByProperty(obj){

    var containsAll = function(item){
      for(var key in obj){
        var objVal = obj[key];
        var itemVal = item[key];
        if(itemVal === undefined || itemVal !== objVal){
          return false;
        }
      }
      return true;
    };

    var results = [];
    this.forEach(function(item, id){
      if(containsAll(item)){
        results.push(item);
      }
    });
    return results;
  };

  getByProperty(obj){
    var items = this.findByProperty(obj);
    if(items.length){
      return items[0];
    }
    return null;
  };

  toJSON(){
    return this.items.map(function(item){
      if(item && item.toJSON){
        return item.toJSON();
      }
      return item;
    });
  };

  filter(conditionFn){
    var result = [];
    this.forEach(function(item){
      if(conditionFn.call(this, item)){
        result.push(item);
      }
    });
    return result;
  };

  /*
    Un-implemented, but useful additional methods

    // Sort method that will run on every call to add/remove/update to keep
    // your items sorted. Works just like Array.sort
    sort(a, b){
      return -1, 1, 0
    };

   */

};