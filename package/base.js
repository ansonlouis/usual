// base-class.js

const utils = require('./utils');
const extend = require('extend');
const EventEmitter2 = require('eventemitter2');


export default class Base{

  constructor(...modelAttrs /* attrObj1...cfgN, baseAttrs */){

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

    this._parentCache = null;

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
      this.id = this.generateModelId();
    }

    this._events = new EventEmitter2(extend(true, {}, this.usual.eventConfig));

  };

  get events(){
    return this._events;
  };

  /**
   * Destructor method that you can call yourself but also gets called
   * in the cache class when a model is removed.
   */
  destroy(){
    this.events.emit('destroy');
    this.events.removeAllListeners();
  };

  /**
   * Simple merge method that merges in a passed
   * modelAttr object into the model itself.
   */
  _merge(modelAttrs){
    extend(true, this, modelAttrs);
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
    }
    this._merge(data);
    this.events.emit('update', data);
  };

  /**
   * Method to generate a unique ID for the model in the case where
   * no id or valid idProperty property was passed in the original
   * modelAttrs. You can override to use your own method of ID creation.
   */
  generateModelId(){
    return utils.uid('m-');
  };

  getCache(){
    return this._parentCache
  };

  removeFromCache(){
    if(this._parentCache){
      this._parentCache.remove(this.id);
    }
  };

  toJSON(){
    var obj = utils.omit(this, function(value, key){
      return key[0] === '_' || key === "usual";
    });
    return extend(true, {}, obj);
  };


};