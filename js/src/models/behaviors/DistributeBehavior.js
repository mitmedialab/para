/*RandomDistributionBehavior.js
 */
define([
    'models/behaviors/BaseBehavior'
  ],

  function(BaseBehavior) {

    var FollowPathBehavior = BaseBehavior.extend({


      setup: function(data) {
        var num = 10;
        console.log('follow path behavior setup called');
        this.createInstances(num - 1, false);

      },

      update: function() {
        this.distribute();
       

      },


      //projects a set of instances along a parent path- needs to be moved to mixin
      distribute: function() {

        //this.path.strokeColor = 'red';
        var num = this.instances.length;
       
        for (var i = 0; i < num; i++) {
          //console.log(location);
          var x = random(0,500);
          var y = random(0,500);
          var point = new Paper.point
          instance.setPosition(location_n);



          location = location_n;
        }
        /*if (this.getParentNode != parent) {
        parent.addChildNode(this);
      }*/
        position.remove();


      }

    });

    return FollowPathBehavior;
  });