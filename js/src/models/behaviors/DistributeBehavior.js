/*DistributeBehavior.js
 */
define([
    'models/behaviors/BaseBehavior',
    'models/PaperManager'
  ],

  function(BaseBehavior, PaperManager) {
    var paper = PaperManager.getPaperInstance();
    var DistributeBehavior = BaseBehavior.extend({
      paper: null,
      name: 'linear',
      type: 'distribution',
      
      initialize: function() {
        this.paper = PaperManager.getPaperInstance();
      },

      update: function() {
        this.clearScaffolds();
        this.distribute();


      },


      //projects a set of instances along a parent path- needs to be moved to mixin
      distribute: function() {
       // console.log("distributing instances");
        if (this.children.length > 0) {
          for (var z = 0; z < this.children.length; z++) {
            if (this.children[z] !== null) {
              var child = this.children[z];
              var num = child.instances.length;

              var pointA = child.instances[0].position;
              var pointB = child.instances[child.instances.length - 1].position;

                var scaffoldLine =  new paper.Path();
    
              
                 scaffoldLine.strokeColor = '#83E779';
                scaffoldLine.add(new paper.Point(pointA.x,pointA.y));
                scaffoldLine.add(new paper.Point(pointB.x,pointB.y));
                this.scaffold.push(scaffoldLine);
                var pointAC = new paper.Path.Circle(new paper.Point(pointA.x,pointA.y),5);
                 var pointBC = new paper.Path.Circle(new paper.Point(pointB.x,pointB.y),5);
                pointAC.fillColor =  '#83E779';
                pointBC.fillColor =  '#83E779';
                this.scaffold.push(pointAC);
                this.scaffold.push(pointBC);

         

             // console.log("point a and b");
             // console.log(pointA);
             // console.log(pointB);
              var xDiff = (pointB.x - pointA.x) / (num-1);
              var yDiff = (pointB.y - pointA.y) / (num-1);


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