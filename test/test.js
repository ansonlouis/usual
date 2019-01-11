// test.js
//
// mocha, it, describe are all on window

let failed = 0;

afterEach(function(){
  if(this.currentTest.state === 'failed'){
    failed++;
    document.title = "(fail) Usual Tests";
  }
});

after(function(){
  if(!failed){
    document.title = "(pass) Usual Tests";
  }
});

require('./model');
require('./child-model');

require('./collection');
