/*RadialDistributeBehavior.js
 * creates a radial distirbution defined by anchors
 */
define([
    'models/behaviors/BaseBehavior',
    'models/PaperManager'
  ],

  function(BaseBehavior, PaperManager) {
    var paper = PaperManager.getPaperInstance();
    var RadialDistributeBehavior = BaseBehavior.extend({
      paper: null,

      initialize: function() {
        this.paper = PaperManager.getPaperInstance();
      },

      update: function() {
        this.clearScaffolds();
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
              
              var dist = this.getDistance(pointA,pointB);
              var rad = dist/2;
              var origin=  this.getMidpoint(pointA,pointB);

                var scaffoldEllipse=  new paper.Path.Circle(new paper.Point(origin.x,origin.y),rad);
    
              
                 scaffoldEllipse.strokeColor = '#83E779';
              
                this.scaffold.push(scaffoldEllipse);
                var pointAC = new paper.Path.Circle(new paper.Point(pointA.x,pointA.y),5);
                 var pointBC = new paper.Path.Circle(new paper.Point(pointB.x,pointB.y),5);
                pointAC.fillColor =  '#83E779';
                pointBC.fillColor =  '#83E779';
                this.scaffold.push(pointAC);
                this.scaffold.push(pointBC);

                var theta = Math.PI*2/num;
                var first = Math.round(num/2);
              for (var i = 1; i < first; i++) {
                  console.log("first="+i);
                var x = Math.cos(theta*(i+0.5))*rad+origin.x;
                var y = Math.sin(theta*(i+0.5))*rad+origin.y;

                child.instances[i].update({
                  position: {
                    x: x,
                    y: y
                  }
                });
              }

            for (var i = first; i < num-1; i++) {
                   console.log("second="+(i+1));
                var x = Math.cos(theta*(i+1.5))*rad+origin.x;
                var y = Math.sin(theta*(i+1.5))*rad+origin.y;

                child.instances[i].update({
                  position: {
                    x: x,
                    y: y
                  }
                });
              }
            
            }
          }
        }

      },

      getMidpoint: function(p1, p2){
        var x = (p1.x+p2.x)/2;
        var y = (p1.y+p2.y)/2;

        return {x:x,y:y};
    },

    getDistance: function(p1,p2){
      var distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
      return distance;
    }


    });

    return RadialDistributeBehavior;
  });