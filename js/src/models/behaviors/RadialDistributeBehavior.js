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
        //console.log('distributing instances');
        if (this.children.length > 0) {
          for (var z = 0; z < this.children.length; z++) {
            if (this.children[z] !== null) {
              var child = this.children[z];
              var num = child.instances.length;
              var middle = Math.round(num/2);
              var pointA = child.instances[0].position;
              var pointB = child.instances[middle].position;
                child.instances[middle].anchor = true;
                child.instances[num-1].anchor=false;
               if(TrigFunc.equals(pointA,pointB)){
                child.instances[middle].position.x-=1;
                //child.instances[child.instances.length - 1].position.y+=5;
                pointB = child.instances[middle].position;
              }
              var dist = TrigFunc.distance(pointA,pointB);
              var rad = dist/2;
              var origin=  TrigFunc.midpoint(pointA,pointB);

               /*var scaffoldEllipse=  new paper.Path.Circle(new paper.Point(origin.x,origin.y),rad);
    
              
              scaffoldEllipse.strokeColor= '#83E779';
               var pointE=  new paper.Path.Circle(new paper.Point(origin.x,origin.y),10);
    
              
              pointE.strokeColor= 'red';*/
              
               /* this.scaffolds.push(scaffoldEllipse);
                var pointAC = new paper.Path.Circle(new paper.Point(pointA.x,pointA.y),5);
                 var pointBC = new paper.Path.Circle(new paper.Point(pointB.x,pointB.y),5);
                pointAC.fillColor =  '#83E779';
                pointBC.fillColor =  '#83E779';
                this.scaffold.push(pointAC);
                this.scaffold.push(pointBC);*/

                var angle = 360/num;
                var startAngle = TrigFunc.cartToPolar(origin,pointA).theta;
              
               child.instances[0].update({
                  
                  rotation:{
                    angle:startAngle,
                  }
                });
                
              for (var i = 1; i < num; i++) {
               
                console.log('angle='+angle*(i));
                var position = TrigFunc.polarToCart(rad,(angle*i)+startAngle);
                var x = position.x+origin.x;
                var y = position.y+origin.y;
                  if(i!=middle){
                child.instances[i].update({
                  position: {
                    x: x,
                    y: y
                  },
                  rotation:{
                    angle:angle*(i)+startAngle,
                  }
                });
              }
              else{
                child.instances[i].update({
                  rotation:{
                    angle:angle*(i)+startAngle,
                  }
                });
              }


               }
                
              
        
            /*for (var i = first; i < num-1; i++) {
               //  console.log("second="+angle*i);
                var x = Math.cos(theta*(i+1.5))*rad+origin.x;
                var y = Math.sin(theta*(i+1.5))*rad+origin.y;

                child.instances[i].update({
                  position: {
                    x: x,
                    y: y
                    
                  },
                  rotation:{angle:angle*i+180,
                  x: origin.x,
                    y: origin.y}
                });
                
              }*/

            }
          }
        }

      }

    });

    return RadialDistributeBehavior;
  });