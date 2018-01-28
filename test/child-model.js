// child-model.js

var assert = require('assert');
import Model from 'usual/model';


class MyChild extends Model{
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