/*RadialDistributeBehavior.js
 * creates a radial distirbution defined by anchors
 */
define([
    'models/behaviors/BaseBehavior',
    'models/PaperManager',
    'utils/TrigFunc'
  ],

  function(BaseBehavior, PaperManager, TrigFunc) {
    var paper = PaperManager.getPaperInstance();
    var RadialDistributeBehavior = BaseBehavior.extend({
      name: 'radial',
      type: 'distribution',

      initialize: function() {
      
      },

      update: function() {
        this.clearScaffolds();
        this.distribute();


      },


      //projects a set of instances along a parent path- needs to be moved to mixin
      distribute: function() {
         console.log("trig function=");
         console.log(TrigFunc);
        //console.log('distributing instances');
        if (this.children.length > 0) {
          for (var z = 0; z < this.children.length; z++) {
            if (this.children[z] !== null) {
              var child = this.children[z];
              var num = child.instances.length;

              var pointA = child.instances[0].position;
              var pointB = child.instances[child.instances.length - 1].position;
               if(TrigFunc.equals(pointA,pointB)){
                child.instances[child.instances.length - 1].position.x+=40;
                child.instances[child.instances.length - 1].position.y+=40;
                pointB = child.instances[child.instances.length - 1].position;
              }
              var dist = TrigFunc.distance(pointA,pointB);
              var rad = dist/2;
              var origin=  TrigFunc.midpoint(pointA,pointB);

               /* var scaffoldEllipse=  new paper.Path.Circle(new paper.Point(origin.x,origin.y),rad);
    
              
                 scaffoldEllipse.strokeColor = '#83E779';
              
                this.scaffolds.push(scaffoldEllipse);
                var pointAC = new paper.Path.Circle(new paper.Point(pointA.x,pointA.y),5);
                 var pointBC = new paper.Path.Circle(new paper.Point(pointB.x,pointB.y),5);
                pointAC.fillColor =  '#83E779';
                pointBC.fillColor =  '#83E779';
                this.scaffold.push(pointAC);
                this.scaffold.push(pointBC);*/

                var theta = Math.PI*2/num;
                var angle = 360/num;
                var first = Math.round(num/2);
              for (var i = 1; i < first; i++) {
                  //console.log("first="+i);
                var x = Math.cos(theta*(i+0.5))*rad+origin.x;
                var y = Math.sin(theta*(i+0.5))*rad+origin.y;

                child.instances[i].update({
                  position: {
                    x: x,
                    y: y,
                    rotation:angle*(i+0.5)
                  }
                });
              }

            for (var i = first; i < num-1; i++) {
                  // console.log("second="+(i+1));
                var x = Math.cos(theta*(i+1.5))*rad+origin.x;
                var y = Math.sin(theta*(i+1.5))*rad+origin.y;

                child.instances[i].update({
                  position: {
                    x: x,
                    y: y,
                    rotation:angle*(i+1.5)
                  }
                });
              }
            
            }
          }
        }

      }

    });

    return RadialDistributeBehavior;
  });