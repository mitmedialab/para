/*ParentBehavior.js
 */
define([
    'models/behaviors/BaseBehavior'
  ],

  function(BaseBehavior) {

    var ParentBehavior = BaseBehavior.extend({

      setup: function(data) {
        console.log('parent behavior setup called');
        console.log('num of children for node=' + data.getNumChildren());

        data.addChildNode(this);
        console.log('num of children for node=' + data.getNumChildren());
        //data.node.update();
      },

      update: function() {
        console.log('parent behavior update called');
      },


    });

    return ParentBehavior;
  });