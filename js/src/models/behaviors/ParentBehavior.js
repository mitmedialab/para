/*ParentBehavior.js
 * base class for geometry object
 * extends SceneNode
 */
define(function() {
  var ParentBehavior = function() {

    this.intersectionFound = function(data) {
      console.log('parent behavior called');
      data.node.addChildNode(this);
    };
  };

  return ParentBehavior;
});