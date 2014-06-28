/*CopyBehavior.js
iteratively changes scale from start to end
 */
define([
    'models/behaviors/BaseBehavior'
  ],

  function(BaseBehavior) {

    var ScaleBehavior = BaseBehavior.extend({
    
      setup: function(data) {
        var num = data;
        console.log('copy behavior setup called');
        this.createInstances(num - 1, false);

      },

      update: function() {
        console.log('copy behavior update called');
       
      }

      
    });

    return ScaleBehavior;
  });