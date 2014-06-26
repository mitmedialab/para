/*TestNode.js
* base class for geometry object
* extends SceneNode
*/

 /*var TestNode = function() {
 
    console.log("test node");
    this.test = function() {
      console.log("calling test mixin function");
    };
 
  };*/

  define( function() {
    var TestNode = function() {
        this.numLives = 5;
        this.numDaysPerLife = 30;
 
  this.updateInstances = function() {
    console.log('update event called with mixin');

  };
};
  return TestNode;
});
