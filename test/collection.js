// collection.js
//

var assert = require('chai').assert;
import Collection from 'usual/collection';
import Model from 'usual/model';


class ChildModel extends Model{
  constructor(...configs){
    super(...configs);
    this.isChild = true;
  };
};

class ChildCollection extends Collection{
  constructor(items, ...configs){
    super(items, ...configs);
    this.isChild = true;
  };
};

class NonUsualModel{
  constructor(){
    this.iAmNotUsual = true;
  };
};


var myId = "my-collection";
var myProp = "my-prop";
var myModelId = "my-model";
var myModelProp = "my-model-prop";
var myModelId2 = "my-model-2";
var myModelProp2 = "my-model-prop-2";

let myCollection = new Collection(null, {
  id : myId,
  myProp : myProp
});

let myItemCollection = new Collection({
  id : myModelId,
  myProp : myModelProp
}, {
  id : myId,
  myProp : myProp
});

let myItemsCollection = new Collection([{
  id : myModelId,
  myProp : myModelProp
},{
  id : myModelId2,
  myProp : myModelProp2
}], {
  id : myId,
  myProp : myProp
});

let myChildCollection = new ChildCollection([
  {id:'one'}, {id:'two'}, {id:'three'}
], {
  myChildProp : 'myChildProp'
});



describe('Base Collection', function(){

  describe('Basics', function(){

    it('can take in falsey as first argument to initialize without items', function(){
      assert.equal(myCollection.items.length, 0);
      assert.equal(myCollection.id, myId);
    });

    it('can take in a single object as first argument to initialize with 1 item', function(){
      assert.equal(myItemCollection.items.length, 1);
      assert.equal(myItemCollection.items[0].id, myModelId);
      assert.equal(myItemCollection.items[0].myProp, myModelProp);
    });

    it('can take in an array of objects as first argument to initialize with N items', function(){
      assert.equal(myItemsCollection.items.length, 2);
      assert.equal(myItemsCollection.items[0].id, myModelId);
      assert.equal(myItemsCollection.items[0].myProp, myModelProp);
      assert.equal(myItemsCollection.items[1].id, myModelId2);
      assert.equal(myItemsCollection.items[1].myProp, myModelProp2);
    });

    it('passing in items in the items array is not allowed', function(){
      let col = new Collection(null, {items:[{id:"model-id"}]});
      assert.equal(col.items.length, 0);
    });

    it('`length` returns `items.length`', function(){
      let col = new Collection(null);
      assert.equal(col.length, 0);
      col.add({id:'my-model'});
      assert.equal(col.length, 1);
    });

    it('`empty()` empties out the map and items', function(){
      let col = new Collection({id:'my-model'});
      assert.equal(col.length, 1);
      col.empty();
      assert.equal(col.length, 0);
      assert.isEmpty(col._map);
    });

    it('can have a `model` prop to auto initialize items in that model', function(){
      let col = new Collection(null, {
        model : ChildModel
      });

      col.add({id:"my-child"});

      let model = col.items[0];

      assert.equal(model instanceof Model, true, 'is instance of model');
      assert.equal(model instanceof ChildModel, true);
      assert.equal(model.isChild, true);

      col.add(new ChildModel({id:"already-instance"}));
      let model2 = col.items[1];

      assert.equal(model2 instanceof Model, true);
      assert.equal(model2 instanceof ChildModel, true);

    });

    it('can have a function that returns a class as the `model` property', function(){
      let col = new Collection(null, {
        model : function(obj){
          return new NonUsualModel(obj);
        }
      });

      col.add(new NonUsualModel());

      let model = col.first();

      assert.equal(model instanceof Model, false);
      assert.equal(model instanceof NonUsualModel, true);

    });

    it('will not override a model if the passed model is already an instance of the base model', function(){
      let col = new Collection(null, {
        model : ChildModel
      });

      col.add(new Model({id:"already-instance"}));
      let model = col.items[0];

      assert.equal(model instanceof Model, true);
      assert.equal(model instanceof ChildModel, false);

    });

    it('`atIndex()` will return item at that index, including negative numbers to search in reverse', function(){
      let item1 = myItemsCollection.atIndex(0);
      let item2 = myItemsCollection.atIndex(1);
      let item3 = myItemsCollection.atIndex(2);
      let item4 = myItemsCollection.atIndex(-1);

      assert.equal(item1.id, myModelId);
      assert.equal(item2.id, myModelId2);
      assert.equal(item3, undefined);
      assert.equal(item4.id, myModelId2);

    });

    it('`indexOf()` will return the index of the passed item or item id', function(){

      assert.equal(myItemsCollection.indexOf(myModelId), 0);
      assert.equal(myItemsCollection.indexOf(myModelId2), 1);
      assert.equal(myItemsCollection.indexOf(myItemsCollection.atIndex(0)), 0);
      assert.equal(myItemsCollection.indexOf(myItemsCollection.atIndex(1)), 1);

    });

    it('`ids()` will return an array of the model ids for each item', function(){

      let ids = myItemsCollection.ids();
      assert.equal(ids[0], myModelId);
      assert.equal(ids[1], myModelId2);

    });

    it('`first()` will return the first item', function(){
      let item = myItemsCollection.first();
      assert.equal(item.id, myModelId);
    });

    it('`last()` will return the last item', function(){
      let item = myItemsCollection.last();
      assert.equal(item.id, myModelId2);
    });

    it('can take anything as an `idProperty`', function(){
      let col = new Collection([{id:'one', prop:'one'}, {prop:'two'}]);
      assert.equal(col.atIndex(0).id, 'one');
      assert.isOk(col.atIndex(1).id);

      let col2 = new Collection([{id:'one', prop:'one'}, {prop:'two'}, {anson:'three', prop:'three'}], {
        idProperty : 'anson'
      });

      assert.isOk(col2.atIndex(0).anson);
      assert.isOk(col2.atIndex(1).anson);
      assert.equal(col2.atIndex(2).anson, 'three');
      assert.isNotOk(col2.atIndex(2).id);

      let id = col2.atIndex(0).anson;
      assert.equal(col2.get(id), col2.atIndex(0));

    });

  });

  describe('Iterating and Searching', function(){

    describe('forEach()', function(){

      it('should loop through all items, passing item and index and return this', function(){
        let length = myItemsCollection.length;
        let iterationCount = 0;
        let result = myItemsCollection.forEach(function(item, index){
          assert.equal(iterationCount, index);
          let atIndexItem = myItemsCollection.atIndex(index);
          assert.deepEqual(item, atIndexItem);
          iterationCount++;
        });
        assert.equal(iterationCount, length);
        assert.equal(result, myItemsCollection);
      });

      it('should stop iterating if `false` is explicitly returned and return this', function(){
        let iterationCount = 0;
        let result = myItemsCollection.forEach(function(item, index){
          iterationCount++;
          if(index === 0){
            return false;
          }
        });
        assert.equal(iterationCount, 1);
        assert.equal(result, myItemsCollection);
      });

      it('should not stop iterating if `falsey` (not `false`) is returned and return this', function(){
        let iterationCount = 0;
        let result = myItemsCollection.forEach(function(item, index){
          iterationCount++;
          if(index === 0){
            return 0;
          }
        });
        assert.equal(iterationCount, myItemsCollection.length);
        assert.equal(result, myItemsCollection);
      });

    });

    describe('filter()', function(){

      it('should return a new instance of the class that calls it', function(){

        let indexCounter = 0;
        let filtered = myItemsCollection.filter(function(item, index){
          assert.equal(indexCounter++, index);
          return true;
        });

        let filteredChild = myChildCollection.filter(function(item, index){
          return true;
        });

        assert.isTrue(filtered instanceof Collection);
        assert.isTrue(filteredChild instanceof ChildCollection);
        assert.notEqual(filtered, myItemsCollection);
        assert.notEqual(filteredChild, myChildCollection);
        assert.equal(myItemsCollection.length, filtered.length);
      });

      it('should filter the items', function(){

        let filtered = myItemsCollection.filter(function(item, index){
          if(index === 0){
            return false;
          }
          return true;
        });

        assert.equal(filtered.length, myItemsCollection.length - 1);
        assert.equal(filtered.atIndex(0).id, myItemsCollection.atIndex(1).id);

      });

    });

    describe('find()', function(){
      it('should allow a condition function to find a single item', function(){

        let found = myItemsCollection.find(function(item){
          return item.id === myModelId;
        });

        assert.isObject(found);
        assert.equal(found.id, myModelId);

      });

      it('should allow an object of properties to exactly match (findByProperty)', function(){

        let found = myItemsCollection.find({id:myModelId});
        let found2 = myItemsCollection.find({myProp : myModelProp2});

        assert.isObject(found);
        assert.equal(found.id, myModelId);
        assert.isObject(found2);
        assert.equal(found2.id, myModelId2);
      });

      it('should return `undefined` when no item is found', function(){

        let found = myItemsCollection.find(function(item){
          return item.id === "BOGUS";
        });

        let found2 = myItemsCollection.find({id:'BOGUS'});

        assert.isUndefined(found);
        assert.isUndefined(found2);

      });

    });

    it('map() should simply alias map() of the items property', function(){
      let col = new Collection([{index:0},{index:1},{index:2}]);
      let result = col.map(function(item, i){
        assert.equal(item.index, i);
        return item.index;
      });

      assert.sameOrderedMembers(result, [0, 1, 2]);

    });

  });

  describe('Adding, Removing, Updating, Getting', function(){

    describe('add()', function(){

      it('should be able to add a simple object', function(){
        let col = new Collection();
        let mod = {prop:'prop'};
        col.add(mod);

        assert.equal(col.length, 1);
        assert.equal(col.atIndex(0).prop, mod.prop);
      });

      it('should be able to take in an array of objects', function(){
        let col = new Collection();
        col.add([
          {prop:'one'},
          {prop:'two'}
        ]);

        assert.equal(col.length, 2);

      });

      it('a collection with no set model should be able to take in any non-object and not modify it', function(){
        let col = new Collection();
        let items = [
          "string me!",
          100,
          99.99,
          {prop:"one"},
          [1,2,3,4],
          new Model(),
          false,
          true
        ];
        let returned = col.add(items);

        assert.equal(col.length, items.length);
        assert.equal(col.length, returned.length);

        items.forEach(function(item, index){
          if(typeof(item) === "object" && !Array.isArray(item)){
            // assert.isString(item.id);
          }else{
            assert.equal(item, col.atIndex(index));
          }
        });

      });

      it('should create models out of items if a model prop is set, stripping non-objects/arrays', function(){
        let items = [
          {prop:'no-id', uid:0},
          {id:'my-id', uid:1},
          0,
          1,
          [],
          [1,2,3],
          "haha",
          new Model({prop:'already-a-model', 'uid':2})
        ];

        let col = new Collection(null, {model:Model});
        let returned = col.add(items);

        assert.equal(col.length, 3);
        assert.equal(col.length, returned.length);

        col.forEach(function(item, index){
          assert.equal(item.uid, index);
          assert.equal(Model.isInstance(item), true);
          assert.equal(item._collection, col);
        });

      });

      it('should set a `_collection` property on each item when using a collection of models, accessible by `model.getCollection()', function(){

        let col = new Collection(null, {model:Model});
        col.add([{}, {}]);

        col.forEach(function(item){
          assert.equal(item._collection, col);
          assert.equal(item.getCollection(), col);
        });

      });

      it('should not override collection when same model is added to two collections (should retain first collection)', function(){
        let col1 = new Collection(null, {model:Model});
        let col2 = new Collection(null, {model:Model});

        let modelProps = {id : 'my-id'};
        col1.add(modelProps);
        let model = col1.get('my-id');
        col2.add(model);

        assert.equal(model.getCollection(), col1);
        assert.notEqual(model.getCollection(), col2);

      });

      it('should remove model when its destroyed', function(){
        let col1 = new Collection(null, {model:Model});
        let model = new Model({id:'my-id'});
        col1.add(model);

        assert.equal(col1.length, 1);
        assert.equal(col1.get('my-id'), model);

        model.destroy();

        assert.equal(col1.length, 0);

      });


      it('should sort if `sorter` function created', function(){

        let compileIndexes = function(col){
          return col.map(item => item.index);
        };

        let col = new Collection(null, {
          model : Model,
          sorter : function(a, b){
            return a.index - b.index;
          }
        });

        col.add([{id:'one', index:1}, {id:'two', index:0}]);

        assert.sameOrderedMembers(compileIndexes(col), [0, 1]);

        col.add({id:'three', index:4});

        assert.sameOrderedMembers(compileIndexes(col), [0, 1, 4]);

        col.add([{id:'four', index:-1}, {id:'five', index:5}, {id:'six', index:-5}]);

        assert.sameOrderedMembers(compileIndexes(col), [-5, -1, 0, 1, 4, 5]);


      });

      it('should update if model with id is already found', function(){
        let col = new Collection({id:'one', prop:1, prop2:'two'});
        let model = col.get('one');

        assert.equal(model.prop, 1);
        assert.equal(model.prop2, 'two');

        col.add({id:'one', prop:2});

        assert.equal(model.prop, 2);
        assert.equal(model.prop2, 'two');

        assert.equal(col.length, 1);

        let colModel = new Collection({id:'two', prop:'one', prop2:true}, {model:Model});
        let model2 = colModel.get('two');

        assert.equal(model2.prop, 'one');
        assert.equal(model2.prop2, true);

        colModel.add({id:'two', prop2:false});

        assert.equal(model2.prop, 'one');
        assert.equal(model2.prop2, false);
        assert.equal(colModel.length, 1);


      });

      it('should generate ids when item has no id property or has no generateId() method', function(){
        let col = new Collection(null, {
          generateModelId : function(){
            return 'eyedee-' + performance.now();
          }
        });

        col.add({id:'my-id'});
        assert.equal(col.atIndex(0).id, 'my-id');

        col.add({prop:'proppy'});
        assert.equal(col.atIndex(1).id.indexOf('eyedee-'), 0);

      });

      it('should default to model `generateId` if it exists on the model', function(){
        class IDModel extends Model{
          generateId(){
            return 'modmod-' + performance.now();
          };
        };
        let col = new Collection(null, {
          model : IDModel,
          generateModelId : function(){
            return 'eyedee-' + performance.now();
          }
        });

        col.add({prop:'prop'});
        assert.equal(col.atIndex(0).id.indexOf('modmod-'), 0);

      });

      it('should emit add event with added items', function(){
        let col = new Collection();

        col.on('add', function(items){
          assert.equal(items.length, 4);
        });

        col.add([{prop:'one'}, {prop:'two'}, 'one', 2]);

        let col2 = new Collection(null, {model:Model});

        col2.on('add', function(items){
          assert.equal(items.length, 2);
        });

        col2.add([{prop:'one'}, {prop:'two'}, 'one', 2]);

      });

      it('should expect an array of added items returned if an array of items was passed', function(){
        let col = new Collection();
        let added = col.add([1, 'two', false, {prop:'prop'}]);

        assert.isArray(added);
        assert.equal(added.length, 4);
      });

      it('should expect a single added item returned if a single item (not array) was passed', function(){
        let col = new Collection();
        let added = col.add({prop:'prop'});

        assert.isNotArray(added);
        assert.equal(added.prop, 'prop');

      });

      it('should expect `null` returned if a single non-object was passed and a model prop is set', function(){
        let col = new Collection(null, {model:Model});
        let added = col.add("model");

        assert.equal(added, null);
        assert.equal(col.length, 0);
      });

      it('should strip items from returned array if non-objects and a model prop is set', function(){
        let col = new Collection(null, {model:Model});
        let added = col.add([1, 'two', {prop:'prop'}]);

        assert.isArray(added);
        assert.equal(added.length, 1);
        assert.equal(added[0].prop, 'prop');
      })

    });


    describe('get()', function(){

      it('should be able to return found item if an `idProperty` is passed', function(){

        let col = new Collection({id:'one'});
        assert.equal(col.get('one').id, 'one');

        let col2 = new Collection({anson:'one'}, {idProperty:'anson'});
        assert.equal(col2.get('one').anson, 'one');

      });

      it('should be able to return found item if an object with an `idProperty` property is passed', function(){

        let col = new Collection({id:'one'});
        assert.equal(col.get({id:'one'}).id, 'one');

        let col2 = new Collection({anson:'one'}, {idProperty:'anson'});
        assert.equal(col2.get({anson:'one'}).anson, 'one');

      });

      it('should return `undefined` if no item is found', function(){
        let col = new Collection({id:'one'});
        assert.equal(col.get('two'), undefined);

        let col2 = new Collection({anson:'one'}, {idProperty:'anson'});
        assert.equal(col2.get('two'), undefined);
      });

    });

    describe('remove()', function(){

      it('should return false if item not found and not emit a `remove` event', function(){
        let col = new Collection({id:'one'});

        let eventCalled = false;
        col.on('remove', function(item){
          eventCalled = true;
        });
        col.remove('two');

        assert.equal(col.length, 1);
        assert.equal(eventCalled, false);

      });

      it('should remove the item from the collection and return true if found by passing id or object with id', function(){
        let col = new Collection([{id:'one'}, {id:'two'}]);

        let eventCalled = false;
        col.on('remove', function(item){
          eventCalled = true;
          assert.equal(item.id, 'one');
        });

        col.remove('one');
        assert.equal(col.length, 1);
        assert.equal(col.atIndex(0).id, 'two');
        assert.equal(eventCalled, true);

      });

    });


  });


});