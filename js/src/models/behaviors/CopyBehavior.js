/*CopyBehavior.js
iteratively changes scale from start to end
 */
define([
    'models/behaviors/BaseBehavior'
  ],

  function(BaseBehavior) {

    var CopyBehavior = BaseBehavior.extend({
      copyNum:2,

      update: function() {
        // console.log('copy behavior update called');
        console.log("copying");
        var numToCreate = this.copyNum - this.instances.length;
        if (numToCreate !== 0) {
          if (numToCreate > 0) {
            this.createInstances(numToCreate, false);
          } else {
            this.deleteInstances(numToCreate, false);
          }
        }

      },

      setCopyNum: function(data) {
        this.copyNum = data;
        console.log("number of copies = " + this.copyNum);

      }


    });

    return CopyBehavior;
  });