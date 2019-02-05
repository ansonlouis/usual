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
      items : [],
      idProperty : 'id',
    });

    this.idProperty = utils.result(this.idProperty);

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
   * Returns the length of the collection
   */
  get length(){
    return this.items.length;
  };

  /**
   * Empties the collection, without calling any destroy() on the models
   * or calling the 'remove' event
   */
  empty(){
    this._map = {};
    this.items = [];
  };

  generateId(){
    return utils.uid('cid-');
  };

  /**
   * The function to generate a unique ID for the collection's models if the
   * models do not have ids or if the items in the collection are not instances
   * of usual/models. Override to come up with your own id format.
   */
  generateModelId(){
    return utils.uid("cmid-");
  };

  /**
   * Returns the item in the collection at the passed index. You can pass in a negative
   * number to return items from the end of the collection. For instance, -1 will return
   * the last index, -2 the second to last, and so on.
   */
  atIndex(index){
    if(index < 0){
      return this.items[this.items.length + index];
    }
    return this.items[index];
  };

  indexOf(modelOrId){
    let model = this.get(modelOrId);
    return this.items.indexOf(model);
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
    return this.atIndex(0);
  };

  /**
   * Shortcut to return the last item in the collection
   */
  last(){
    return this.atIndex(-1);
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

    let passedArray = true;

    if(!objects){
      return false;
    }

    if(!Array.isArray(objects)){
      passedArray = false;
      objects = [objects];
    }

    var addedItems = [];
    var newModels = [];

    objects.forEach((obj) => {

      if(this.model && !utils.isObject(obj)){
        return;
      }

      let oid = null;

      // see if object with same id exists in cache...if so,
      // lets just update the current model and exit iteration
      let cachedObj = this.get(obj);
      if(cachedObj){
        this.update(obj);
        addedItems.push(cachedObj);
        return;
      }

      // if this cache should contain a specific model, lets create a new one
      if(this.model){
        if(!Model.isInstance(obj)){
          obj._collection = this;
          obj = new this.model(obj);
        }
      }

      if(Model.isInstance(obj)){
        if(!obj._collection){
          obj._collection = this;
        }

        this.listenTo(obj, 'destroy', () => {
          this.remove(obj);
        });
        this.listenTo(obj, 'update', (changes) => {
          this.events.emit('modelUpdate', obj, changes);
        });
      }

      // use object's id if it's an instance of Base (must have id prop) or
      // generate a new ID if the passed object is a plain js value
      oid = obj[this.idProperty] !== undefined ? obj[this.idProperty] : this.generateModelId();

      if(utils.isObject(obj)){
        obj[this.idProperty] = oid;
      }

      addedItems.push(obj);
      newModels.push(obj);

      this.items.push(obj);
      this._map[oid] = obj;

    }, this);

    if(this.sorter){
      this.items.sort(this.sorter);
    }

    this.events.emit('add', newModels);

    // if an array of objects passed to `add`, lets return array of added items back
    if(passedArray){
      return addedItems;
    }

    // otherwise, a single object may have been sent, so dev should expect either
    // the added item returned (non-array) or null, if the item could not have
    // been added for some reason
    return addedItems.length ? addedItems[0] : null;

  };

  /**
   * Returns the item from collection with the passed id. You can also pass an
   * object and it will use its id.
   */
  get(idOrObject){
    if(idOrObject !== undefined){
      if(utils.isObject(idOrObject) && idOrObject[this.idProperty]){
        idOrObject = idOrObject[this.idProperty];
      }
      return this._map[idOrObject];
    }
    return undefined;
  };

  /**
   * Removes the item from the collection that matches the passed id.
   */
  remove(idOrObject){
    var item = this.get(idOrObject);
    if(item !== undefined){
      this.items.splice(this.indexOf(item), 1);
      this._map[item[this.idProperty]] = undefined;
      delete this._map[item[this.idProperty]];
      if(item._collection === this){
        item._collection = null;
      }
      this.events.emit('remove', item);
      item = undefined;
      return true;
    }
    return false;
  };

  update(data){
    if(data[this.idProperty]){
      var item = this.get(data[this.idProperty]);
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

  reset(items){
    this.empty();
    this.add(items);
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





  /*
    ITERATOR FNS
   */

  /**
   * Loops through the collection's items. You can return false from the
   * passed callback to exit early from the array.
   */
  forEach(callback){
    let length = this.items.length;

    if(typeof(callback) === "function"){
      for(let i=0; i<length; i++){
        if(callback(this.items[i], i) === false){
          break;
        }
      }
    }

    return this;

  };

  /**
   * Filters the collections items, however it does not modify the
   * collection, but simply returns the filtered array.
   */
  filter(conditionFnOrObject){
    let cnstctr = this.__proto__.constructor;
    if(typeof(conditionFnOrObject) === "function"){
      return new cnstctr(this.items.filter(conditionFnOrObject));
    }
    else if(utils.isObject(conditionFnOrObject)){
      return new cnstctr(this.findAllByProperty(conditionFnOrObject));
    }
    return new cnstctr();
  };

  find(conditionFnOrObject){

    if(typeof(conditionFnOrObject) === "function"){
      return this.items.find(conditionFnOrObject);
    }
    else if(utils.isObject(conditionFnOrObject)){
      return this.findByProperty(conditionFnOrObject);
    }

    return undefined;

  };

  map(fn){
    return this.items.map(fn);
  };

  /**
   * Returns an array of matching items in the array that contain
   * all of the same prop/values as the passed in test object. An
   * empty array is returned if no items are matched.
   */
  findByProperty(obj){
    let matchFn = utils.matchFn(obj);
    return this.items.find(function(item){
      return matchFn(item);
    });
  };

  findAllByProperty(obj){
    let results = [];
    let matchFn = utils.matchFn(obj);
    return this.items.filter(function(item){
      return matchFn(item);
    });
  };

  /*
    Un-implemented, but useful additional methods

    // Sort method that will run on every call to add/remove/update to keep
    // your items sorted. Works just like Array.sort
    sorter(a, b){
      return -1, 1, 0
    };

   */

};

module.exports = Collection;
