/*DistributeBehavior.js
 */
define([
    'models/behaviors/BaseBehavior',
    'models/PaperManager'
  ],

  function(BaseBehavior, PaperManager) {

    var DistributeBehavior = BaseBehavior.extend({
      paper:null,

      initialize: function(){
          this.paper = PaperManager.getPaperInstance();
      },

      update: function() {
        this.distribute();
       

      },


      //projects a set of instances along a parent path- needs to be moved to mixin
      distribute: function() {
        //this.path.strokeColor = 'red';
        var num = this.instances.length;
        console.log(this.anchors);
        var pointA = this.anchors[0].data.position;
        var pointB = this.anchors[this.anchors.length-1].data.position;
        console.log("point a and b");
        console.log(pointA);
        console.log(pointB);
        var xDiff = (pointB.x-pointA.x)/num;
        var yDiff = (pointB.y-pointA.y)/num;


        for (var i = 0; i < num; i++) {
          //console.log(location);
          var x = pointA.x+xDiff*i;
          var y = pointA.y+yDiff*i;
          var point = new this.paper.Point(x,y);
          this.instances[i].setPosition(point);
        }
        /*if (this.getParentNode != parent) {
        parent.addChildNode(this);
      }*/


      }

    });

    return DistributeBehavior;
  });