/*DistributeBehavior.js
 */
define([
    'models/behaviors/BaseBehavior',
    'models/PaperManager'
  ],

  function(BaseBehavior, PaperManager) {

    var DistributeBehavior = BaseBehavior.extend({
      paper: null,

      initialize: function() {
        this.paper = PaperManager.getPaperInstance();
      },

      update: function() {
        this.distribute();


      },


      //projects a set of instances along a parent path- needs to be moved to mixin
      distribute: function() {
        console.log("distributing instances");
        if (this.children.length > 0) {
          for (var z = 0; z < this.children.length; z++) {
            if (this.children[z] !== null) {
              var child = this.children[z];
              var num = child.instances.length;

              var pointA = child.instances[0].position;
              var pointB = child.instances[child.instances.length - 1].position;
              console.log("point a and b");
              console.log(pointA);
              console.log(pointB);
              var xDiff = (pointB.x - pointA.x) / num;
              var yDiff = (pointB.y - pointA.y) / num;


              for (var i = 1; i < num-1; i++) {
                //console.log(location);
                var x = pointA.x + xDiff * i;
                var y = pointA.y + yDiff * i;

                child.instances[i].update({
                  position: {
                    x: x,
                    y: y
                  }
                });
              }
              /*if (this.getParentNode != parent) {
        parent.addChildNode(this);
      }*/
            }
          }
        }

      }


    });

    return DistributeBehavior;
  });