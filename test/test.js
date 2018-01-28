// test.js
//
// mocha, it, describe are all on window

var assert = require('assert');

import Base from 'usual/base';
import Cache from 'usual/cache';


describe('Base Class', function(){


  var myId = "one!";
  var myProp = "myProp!";

  let myBase = new Base({
    id : myId,
    myProp : myProp
  });

  describe('Basics', function(){

    it('should have an id of: ' + myId, function(){
      assert.equal(myBase.id, myId);
    });

    it("should have a property titled 'myProp' with value: " + myProp, function(){
      assert.equal(myBase.id, myId);
    });

    it("should return only valid props in its toJSON method", function(){
      var valid = {
        id : myId,
        myProp : myProp
      };
      assert.deepEqual(myBase.toJSON(), valid);
    });

    it("should be able to specify custom id property", function(){
      var idValue = "123";
      let myBaseModel = new Base({
        myId : idValue,
        usual : {
          idProperty : "myId"
        }
      });
      assert.equal(myBaseModel.id, idValue);
    });

    it("should be able to update its properties and call update event", function(done){
      var update = {
        id : "newId", // should not overwrite
        myProp : "modMyProp",
        newProp : "myNewProp"
      };

      myBase.events.on('update', function(){
        done();
      });
      myBase.update(update);

      // id should stay as original id
      assert.equal(myBase.id, myId);
      assert.equal(myBase.myProp, "modMyProp");
      assert.equal(myBase.newProp, "myNewProp");

    });

    it("should call destroy event and remove listeners when destroyed", function(done){

      var myModel = new Base();
      var destroyCalled = false;
      myModel.events.on('destroy', function(){
        destroyCalled = true;
      });
      myModel.events.on('custom', function(){

      });

      myModel.destroy();

      setTimeout(function(){
        assert.equal(destroyCalled, true);
        assert.deepEqual(myModel.events.listenersAny().length, 0);
        done();
      }, 0);

    });

  });


  describe('Events', function(){

    it("should fire a custom event listener with a passed arg", function(done){
      var argToPass = "argValue";
      myBase.events.on("myEvent", function(arg){
        assert.equal(arg, argToPass);
        done();
      });
      myBase.events.emit("myEvent", argToPass);
    });

    it("should remove a specific custom event", function(done){

      var explicitCalled = false;
      var anonCalled = false;

      var fn = function(){
        // my explicit fn callback
        explicitCalled = true;
      };

      myBase.events.on("mySpecificEvent", fn);
      myBase.events.on("mySpecificEvent", function(){
        // my anonymous callback
        anonCalled = true;
      });

      myBase.events.off("mySpecificEvent", fn);

      myBase.events.emit("mySpecificEvent");

      setTimeout(function(){
        assert.equal(explicitCalled, false);
        assert.equal(anonCalled, true);
        done();
      }, 0);

    });

    it("should fire multiple events of <eventName> and in the order they were added", function(){
      var fireSeq = [];

      myBase.events.on("myMultipleEvent", function(){
        fireSeq.push(1);
      });
      myBase.events.on("myMultipleEvent", function(){
        fireSeq.push(2);
      });
      myBase.events.on("myMultipleEvent", function(){
        fireSeq.push(3);
      });

      myBase.events.emit('myMultipleEvent');

      assert.deepEqual(fireSeq, [1,2,3]);

    });

    it("should remove all events of <eventName>", function(done){

      var shouldNotCall = false;
      var shouldCall = false;

      myBase.events.on('eventToRemove', function(){
        1+1;
        shouldNotCall = true;
      });
      myBase.events.on('eventToRemove', function(){
        2+2;
        shouldNotCall = true;
      });
      myBase.events.on('eventToKeep', function(){
        shouldCall = true;
      });

      myBase.events.removeAllListeners('eventToRemove');
      myBase.events.emit('eventToRemove');
      myBase.events.emit('eventToKeep');

      setTimeout(function(){
        assert.equal(shouldNotCall, false);
        assert.equal(shouldCall, true);
        done();
      }, 0);

    });

  });

});


class MyChild extends Base{
  constructor(...props){
    super(...props, {
      childDoNotOverride : 'notOveridden',
      childOverideable1 : 'notOveridden',
      childOverideable2 : 'notOveridden'
    });
  };
};

class MyGrandChild extends MyChild{
  constructor(...props){
    super(...props, {
      grandchildDoNotOverride : 'notOveridden',
      childOverideable1      : 'overriddenByChildBase',
      grandchildOverideable1 : 'notOveridden',
      grandchildOverideable2 : 'notOveridden'
    });
  };
};

describe('Child Class', function(){

  let myChild = new MyChild({
    instanceProp : 'instancePropVal',
    childOverideable1 : 'overriddenByChildInstance'
  });

  it('should allow instance properties and overriding of base properties', function(){
    assert.equal(myChild.childDoNotOverride, 'notOveridden');
    assert.equal(myChild.instanceProp, 'instancePropVal');
    assert.equal(myChild.childOverideable1, 'overriddenByChildInstance');
  });

});

describe('Grandchild Class', function(){

  let myGrandchild = new MyGrandChild({
    instanceProp : 'instancePropVal',
    childOverideable2 : 'overiddenByGrandchildInstance',
    grandchildOverideable2 : 'overiddenByGrandchildInstance',
  });

  it('should allow instance properties and overriding of child and base properties', function(){
    assert.equal(myGrandchild.instanceProp, 'instancePropVal');
    assert.equal(myGrandchild.childOverideable2, 'overiddenByGrandchildInstance');
    assert.equal(myGrandchild.grandchildDoNotOverride, 'notOveridden');
    assert.equal(myGrandchild.childOverideable1, 'overriddenByChildBase');
    assert.equal(myGrandchild.grandchildOverideable2, 'overiddenByGrandchildInstance');
  });

});