/*FollowPathBehavior.js
 */
define([
    'models/behaviors/BaseBehavior',
    'models/PaperManager',
    'utils/TrigFunc',
    'models/behaviors/Scaffold'
  ],

  function(BaseBehavior, PaperManager, TrigFunc, Scaffold) {
    var paper = PaperManager.getPaperInstance();
    var FollowPathBehavior = BaseBehavior.extend({

      constructor: function(pathChild,rotate) {
        this.pathChild = pathChild;
        this.toggleRotate=rotate; 

      },


      update: function(data) {
        //console.log('follow path update: '+ this.type);
        this.clearScaffolds();
      
          var zeroedPath = this.pathChild.getLiteral().clone();
          zeroedPath.position.x =0+zeroedPath.bounds.width/2;
          zeroedPath.position.y=0+zeroedPath.bounds.height/2;
          this.followPath(zeroedPath);
         
        
        //return [data,currentNode];

      },

      //projects a set of instances along a parent path- needs to be moved to mixin
      followPath: function(path) {
      
            
            //  path.sendToBack();
              var num = this.instances.length;
                 var finalPath;

             if(this.instances[0].position.x==this.instances[num-1].position.x &&this.instances[0].position.y==this.instances[num-1].position.y){
                finalPath = path;
             }
             else{
              var locA =path.getNearestPoint(this.instances[0].position);
              var cA = path.getNearestLocation(this.instances[0].position);
             var locB = path.getNearestPoint(this.instances[num - 1].position);
                var cB = path.getNearestLocation(this.instances[this.instances.length - 1].position);

              /*var pc = new paper.Path.Circle(locA,5);
              pc.fillColor ='red';
              this.scaffolds.push(pc);
               var pd = new paper.Path.Circle(cA.segment.point,5);
              pd.fillColor ='green';
              this.scaffolds.push(pd);*/

              var offset = cA.distance;

           
             if (!locA.equals( path.firstSegment.point)) {
                finalPath =  path.split(cA);
                path.remove();
              } else {
                finalPath =  path;
              }

              
              if (!locB.equals(finalPath.lastSegment.point)) {
                var tail = finalPath.split(cB);
                if (tail) {
                  tail.remove();
                }

              }
            }
              var maxDist;
              if(!finalPath.closed){
                maxDist = finalPath.length / (num - 1);
              }
              else{
                 maxDist = finalPath.length / (num);
              }

              finalPath.flatten(maxDist);


            var selected = this.getFirstSelectedInstance();
             if (selected) {
                if (selected.index === 1) {
                  this.checkDistanceIncrement(this.instances[0], selected.instance, maxDist, this.nodeParent);
                } else if (selected.index == this.instances.length - 2) {
                  this.checkDistanceDecrement(this.instances[0], selected.instance, maxDist, this.nodeParent);

                }
              }
              var location = finalPath.segments[0].point;

              for (var i = 0; i < num; i++) {

                var location_n = finalPath.segments[i].point;
                var instance = this.instances[i];
                //instance.resetRotation();

         /* var dot = new paper.Path.Circle(location_n,5);
                dot.fillColor = 'blue ';
                this.scaffolds.push(dot);*/

                
                var delta = location_n.subtract(location);
                //console.log('child left,top'+left+','+top); 
                var difference = {x:location_n.x,y:location_n.y};
                instance.update({
                  position: difference,

                });
                if(this.toggleRotate){
                  console.log("rotation is active");
                   instance.update({
                  rotation: delta.angle
                });
                }
                //console.log('difference=');
                //console.log(difference);


                location = location_n;
              }
                if(this.toggleRotate){
              var startDelta = finalPath.segments[1].point.subtract(finalPath.segments[0].point);
              this.instances[0].update({
                rotation: startDelta.angle
              });
            }

              finalPath.remove();
              finalPath = null;

            
          }
        
      

    });

    return FollowPathBehavior;
  });