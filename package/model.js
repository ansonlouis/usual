// base-class.js

const utils = require('./utils');
const mergeAndDiff = require('./merge-and-diff');
const EventEmitter2 = require('eventemitter2');

class Model{

  constructor(...modelAttrs /* attrObj1...cfgN, baseAttrs */){

    // used for internal implementation purposes for tracking models
    this._internalId = utils.uid('iid-');

    // usual config parameters
    this.usual = {
      eventConfig : {
        wildcard : true,
        maxListeners : 0
      }
      /*
      idProperty  : null
       */
    };

    // merge modelAttrs arguments from last to first
    // ...last arg should be the base modelAttrs, and
    // any subsequent args will merge into it
    for(let i=modelAttrs.length-1; i>=0; i--){
      this._merge(modelAttrs[i]);
    }

    // if model wants a different property on the model
    // to act as an id, use that
    if(this.usual.idProperty && this[this.usual.idProperty]){
      this.id = this[this.usual.idProperty];
    }

    // if no explicit id prop passed
    if(!this.id){
      this.id = this.generateId();
    }

    // dont allow overriding of event emitter (just yet)
    this._events = new EventEmitter2(new mergeAndDiff({}, this.usual.eventConfig).target);

    // holds any foreign models that we are listening upon so we can keep track if
    // us/them gets destroyed, listening events are removed as well
    this._foreignListeners = [];

  };

  /**
   * Listens to another usual/model class while allowing the listener to be
   * removed if this model happens to be destroyed before the listened-on model.
   * Otherwise, the other model will keep firing the callback even if this
   * model is destroyed.
   */
  listenTo(model, eventName, callback){
    var _this = this;
    if(!this._foreignListeners[model._internalId]){
      this._foreignListeners[model._internalId] = [];
      model.events.on('destroy', function(){
        delete _this._foreignListeners[model._internalId];
      });
    }

    this._foreignListeners[model._internalId].push({
      model : model,
      eventName : eventName,
      callback : callback
    });
    model.events.on(eventName, callback);
  };

  /**
   * Simple getter for the internal EventEmitter2 instance, since we want to limit
   * exposing explicitly set variables on the class so toJSON() only returns model properties.
   */
  get events(){
    return this._events;
  };

  /**
   * Destructor method that you can call yourself but also gets called
   * in the cache class when a model is removed.
   */
  destroy(){
    this.events.emit('destroy');
    this.removeAllListeners();
  };

  /**
   * Removes all local listeners as well as any listeners added to another model class
   * using the listenTo() method.
   */
  removeAllListeners(){
    this.events.removeAllListeners();
    for(var key in this._foreignListeners){
      this._foreignListeners[key].map(function(listener){
        listener.model.events.off(listener.eventName, listener.callback);
      }, this);
    }
    this._foreignListeners = {};
  };

  /**
   * Simple merge method that merges in a passed
   * modelAttr object into the model itself.
   */
  _merge(modelAttrs){
    return new mergeAndDiff(this, modelAttrs);
  };

  /**
   * Updates the model with the passed model data object. You
   * cannot override a models ID however onces the model is
   * instantiated. Fires the "update" event with the original
   * data object that was passed in as the first argument.
   */
  update(data){
    if(data){
      delete data['id'];
      delete data['usual'];
    }
    let mergeData = this._merge(data);
    this.events.emit('update', data, mergeData.diff);
  };

  /**
   * Method to generate a unique ID for the model in the case where
   * no id or valid idProperty property was passed in the original
   * modelAttrs. You can override to use your own method of ID creation.
   */
  generateId(){
    return utils.uid('m-');
  };

  /**
   * If a model is an item inside of a collection, this will return the collection,
   * otherwise it returns undefined
   */
  getCollection(){
    return this._collection;
  };

  trigger(...args){
    return this._events.emit(...args);
  };

  on(...args){
    return this._events.on(...args);
  };

  off(...args){
    return this._events.off(...args);
  };

  /**
   * Used to serialize the model. Initially just returns the properties passed in and
   * added to it, removing any properties that start with an underscore (_prop) and the
   * internal "usual" model config property.
   *
   * Override this for custom serialization. Usual/collections will run the toJSON method
   * on all of its items when its own toJSON method is called. Also, keep in mind that when
   * you run JSON.stringify on an object, its implementation will look for any toJSON method
   * and use that for serialization instead of serializing it as a whole.
   */
  toJSON(){
    var obj = utils.omit(this, function(value, key){
      return key[0] === '_' || key === "usual";
    });
    return new mergeAndDiff({}, obj).target;
  };

  static isInstance(model){
    return model instanceof Model;
  };


};


Model.isUsual = true;


module.exports = Model;