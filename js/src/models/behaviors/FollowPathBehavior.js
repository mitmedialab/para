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
        //console.log('follow path initialized');
        this.pathChild = pathChild;

      },


      update: function() {
        this.clearScaffolds();
        for (var i = 1; i < this.pathChild.instance_literals.length; i++) {
          this.followPath(this.pathChild.instance_literals[i]);
        }


      },



      //projects a set of instances along a parent path- needs to be moved to mixin
      followPath: function(path) {
        console.log('following path');
        if (this.children.length > 1) {
          for (var z = 0; z < this.children.length; z++) {
            if (this.children[z] != this.pathChild) {
              var child = this.children[z];
              child.name = 'path_child';
              path.nodeParent.name = "parent_path";
              path.sendToBack();
              var num = child.instances.length;
              var testPath = path.clone();
              //console.log(testPath.segments);
            
              var locA = testPath.getNearestPoint(child.instances[0].position);

              var cA = testPath.getNearestLocation(child.instances[0].position);
              var cB = testPath.getNearestLocation(child.instances[child.instances.length - 1].position);
              /*var pc = new paper.Path.Circle(locA,5);
              pc.fillColor ='red';
              this.scaffolds.push(pc);
               var pd = new paper.Path.Circle(cA.segment.point,5);
              pd.fillColor ='green';
              this.scaffolds.push(pd);*/
              
              var offset = cA.distance;

              //console.log(testPath.segments);
             
                var finalPath = testPath.split(cA);
                if (finalPath === null) {
                  finalPath = testPath;
                }
                else{
                  testPath.remove();
                  tail=null;
                }

                var tail = finalPath.split(cB);
                if(tail){
                  tail.remove();
                  tail=null;
                }
                var maxDist = finalPath.length / (num - 1);
                //console.log('maxDist='+maxDist);

                finalPath.flatten(maxDist);

                //console.log(position);
                var location = finalPath.segments[0].point;
                //console.log('testPath=');
                //console.log(testPath.segments);
                for (var i = 1; i < num - 1; i++) {
                  //console.log(location);

                  var location_n = finalPath.segments[i].point;
                  var instance = child.instances[i];
                  //instance.resetRotation();


                  var delta = location_n.subtract(location);
                  //delta.angle += 90;

                  instance.update({
                    position: {
                      x: location_n.x,
                      y: location_n.y
                    },
                    rotation: delta.angle
                  });

                  location = location_n;
                }
                var startDelta = finalPath.segments[1].point.subtract(finalPath.segments[0].point);
                child.instances[0].update({
                  rotation: startDelta.angle
                });

                var endDelta = finalPath.segments[num - 1].point.subtract(location);
                child.instances[num - 1].update({
                  rotation: endDelta.angle
                });
              
              /*if (this.getParentNode != parent) {
        parent.addChildNode(this);
      }*/
              finalPath.remove();
             finalPath= null;

              //console.log("test path is removed");

            }
          }
        }
      }

    });

    return FollowPathBehavior;
  });