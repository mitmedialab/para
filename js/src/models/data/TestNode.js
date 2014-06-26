/*TestNode.js
 * base class for geometry object
 * extends SceneNode
 */

define(function() {
  var TestNode = function() {
    this.numLives = 5;
    this.numDaysPerLife = 30;

    this.updateInstances = function() {
      console.log('update event called with mixin');

    };
  };
  return TestNode;
});