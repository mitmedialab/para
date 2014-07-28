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

      constructor: function(pathChild) {
        this.pathChild = pathChild;

      },


      update: function(data) {
        console.log("follow path update: "+ this.type);
        this.clearScaffolds();
        for (var i = 1; i < this.pathChild.instance_literals.length; i++) {
          this.followPath(this.pathChild.instance_literals[i]);
        }

      },



      //projects a set of instances along a parent path- needs to be moved to mixin
      followPath: function(path) {
        if (this.children.length > 1) {
          for (var z = 0; z < this.children.length; z++) {
            if (this.children[z] != this.pathChild) {
              var child = this.children[z];
              child.name = 'path_child';
              var left = child.getChildrenLeft();
              var top = child.getChildrenTop();
              var thisLeft = this.getLeft();
              var thisTop = this.getTop();
              path.nodeParent.name = "parent_path";
              path.sendToBack();
              var num = child.instances.length;
              var testPath = path.clone();

              var locA = testPath.getNearestPoint(child.instances[0].position);
              var locB = testPath.getNearestPoint(child.instances[num - 1].position);
              var cA = testPath.getNearestLocation(child.instances[0].position);
              var cB = testPath.getNearestLocation(child.instances[child.instances.length - 1].position);
              /*var pc = new paper.Path.Circle(locA,5);
              pc.fillColor ='red';
              this.scaffolds.push(pc);
               var pd = new paper.Path.Circle(cA.segment.point,5);
              pd.fillColor ='green';
              this.scaffolds.push(pd);*/

              var offset = cA.distance;

              var finalPath = testPath;
             /* if (!locA.equals(testPath.firstSegment.point)) {
                finalPath = testPath.split(cA);
                testPath.remove();
              } else {
                finalPath = testPath;
              }

              if (!locB.equals(finalPath.lastSegment.point)) {
                var tail = finalPath.split(cB);
                if (tail) {
                  tail.remove();
                }

              }*/


              var maxDist = finalPath.length / (num - 1);

              finalPath.flatten(maxDist);

              var location = finalPath.segments[0].point;

              for (var i = 0; i < num; i++) {

                var location_n = finalPath.segments[i].point;
                var instance = child.instances[i];
                //instance.resetRotation();

         /* var dot = new paper.Path.Circle(location_n,5);
                dot.fillColor = 'blue ';
                this.scaffolds.push(dot);*/

          
                var delta = location_n.subtract(location);
                //console.log("child left,top"+left+","+top); 
                var difference = {x:location_n.x-left-thisLeft,y:location_n.y-top-thisTop};
                instance.update({
                  position: difference,
                  //rotation: delta.angle
                });
                console.log("difference=");
                console.log(difference);


                location = location_n;
              }
              var startDelta = finalPath.segments[1].point.subtract(finalPath.segments[0].point);
              child.instances[0].update({
                //rotation: startDelta.angle
              });

              var endDelta = finalPath.segments[num - 1].point.subtract(location);
              child.instances[num - 1].update({
                rotation: endDelta.angle
              });

      
              finalPath.remove();
              finalPath = null;


            }
          }
        }
      }

    });

    return FollowPathBehavior;
  });