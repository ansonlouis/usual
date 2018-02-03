// collection.js

const Model = require("./model");
const utils = require('./utils');
const extend = require('extend');


class Collection extends Model{

  /**
   * Unlike the base usual/model, the collection first takes in an item or
   * array of initial items, following by the normal prop object arguments,
   * like the model.
   */
  constructor(items, ...configs){

    // apply configs
    super(...configs, {
      model : null,
      name  : null,
      _map  : {},
      items : []
    });

    // empty (in case dev tried adding items through
    // the items config prop)
    this.empty();

    // add items properly sent through the items arg
    if(items){
      this.add(items);
    }

  };

  // allows iterating through the models using for...of loop
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

  /**
   * Empties the collection, without calling any destroy() on the models
   * or calling the 'remove' event
   */
  empty(){
    this._map = {};
    this.items = [];
  };

  /**
   * The function to generate a unique ID for the collection's models if the
   * models do not have ids or if the items in the collection are not instances
   * of usual/models. Override to come up with your own id format.
   */
  generateModelId(){
    return utils.uid("cid-");
  };

  /**
   * Returns the item in the collection at the passed index. You can pass in a negative
   * number to return items from the end of the collection. For instance, -1 will return
   * the last index, -2 the second to last, and so on.
   */
  index(index){
    if(index < 0){
      return this.items[this.items.length + index] || undefined;
    }
    return this.items[index] || undefined;
  };

  /**
   * Returns an array of the IDs of the collection's items
   */
  ids(){
    return Object.keys(this._map);
  };

  /**
   * Shortcut to return the first item in the collection
   */
  first(){
    return this.index(0);
  };

  /**
   * Shortcut to return the last item in the collection
   */
  last(){
    return this.index(-1);
  };

  /**
   * The main function for adding items to the collection. You can pass one
   * item or an array of items.
   *
   * If a passed item already exists in the collection (based on the item's id)
   * then that model will be updated and not added. Keep in mind that means the
   * model's 'update' event will fire.
   *
   * If the collection's 'model' property is set, added items will be instantiated
   * as those models.
   *
   * If there is a sort method implemented on the collection, that will be called after
   * the items are added.
   *
   * A 'add' event will be fired at the end of the function with the added models as
   * the argument in the event callback. This array of added models will also contain
   * any models that were not added, but updated.
   *
   * The return value of this function will be either a single item, if only one item
   * was passed originally, or the array of all added items (included updated items)
   * if multiple items were passed.
   */
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

  /**
   * Returns the item from collection with the passed id. You can also pass an
   * object and it will use its id.
   */
  get(idOrObject){
    if(idOrObject !== undefined){
      if(typeof(idOrObject) === "object" && idOrObject.id){
        idOrObject = idOrObject.id;
      }
      return this._map[idOrObject];
    }
    return undefined;
  };

  /**
   * Removes the item from the collection that matches the passed id. If the item
   * is an instance of usual/model, its destroy method will be called. You can pass
   * a truthy value for the second argument to not call destroy on the model. A 'remove'
   * event will be fired after the item is removed.
   */
  remove(id, keepModel){
    var item = this.get(id);
    if(item !== undefined){
      if(!keepModel && item instanceof Model){
        item.destroy();
      }
      this._map[item.id] = undefined;
      delete this._map[item.id];
      this.trigger('remove');
    }
  };

  update(data){
    if(data.id){
      var item = this.get(data.id);
      if(item){
        if(item instanceof Model){
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
    return this.add(data);

  };

  /**
   * Returns the length of the collection
   */
  get length(){
    return this.items.length;
  };

  /**
   * Loops through the collection's items. You can return false from the
   * passed callback to exit early from the array.
   */
  forEach(callback, context){
    let length = this.items.length;
    for(let i=0; i<length; i++){
      if(callback.call(context, this.items[i], i) === false){
        return;
      }
    }
  };

  /**
   * Returns an array of matching items in the array that contain
   * all of the same prop/values as the passed in test object. An
   * empty array is returned if no items are matched.
   */
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

  /**
   * Same as findByProperty, but only returns the first result found,
   * otherwise null is returned.
   */
  getByProperty(obj){
    var items = this.findByProperty(obj);
    if(items.length){
      return items[0];
    }
    return null;
  };

  /**
   * Used for serializing the collection. All collection models will
   * have their toJSON method called in the returned array.
   */
  toJSON(){
    return this.items.map(function(item){
      if(item && item.toJSON){
        return item.toJSON();
      }
      return item;
    });
  };

  /**
   * Filters the collections items, however it does not modify the
   * collection, but simply returns the filtered array.
   */
  filter(conditionFn, context){
    return this.items.filter(conditionFn, context);
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

module.exports = Collection;
