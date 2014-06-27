/*ParentBehavior.js
 */
define([
  'models/behaviors/BaseBehavior'
],

  function(BaseBehavior) {

  var ParentBehavior = BaseBehavior.extend({

    update:function() {
      console.log('parent behavior update called');
    },

    intersectionFound: function(data) {
      console.log('parent path behavior interesection found called');
      console.log("num of children for node="+data.node.getNumChildren());

      data.node.addChildNode(this);
      console.log("num of children for node="+data.node.getNumChildren());
      //data.node.update();
    }
  });

  return ParentBehavior;
});