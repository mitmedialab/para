/*FollowPathBehavior.js
 */
define([
    'models/behaviors/BaseBehavior',
    'models/PaperManager',
    'utils/TrigFunc',
    'models/behaviors/Scaffold'
  ],

  function(BaseBehavior, PaperManager, TrigFunc, Scaffold) {

    var FollowPathBehavior = BaseBehavior.extend({

      constructor: function(pathChild) {
        //console.log('follow path initialized');
        this.pathChild = pathChild;

      },


      update: function() {
        for(var i=1;i<this.pathChild.instance_literals.length;i++){
            this.followPath(this.pathChild.instance_literals[i]);
        }
      },



      //projects a set of instances along a parent path- needs to be moved to mixin
      followPath: function(path) {
        if (this.children.length > 1) {
          for (var z = 0; z < this.children.length; z++) {
            if (this.children[z] != this.pathChild) {
              var child = this.children[z];
              child.name="path_child";
              var num = child.instances.length;
             var testPath= path.clone();

              var indexA = path.getNearestLocation(child.instances[0].position).index;
              var indexB =  path.getNearestPoint(child.instances[child.instances.length - 1].position).index;
           /* if(testPath.segments.length>3) {
              testPath.removeSegments(0,indexA);
              testPath.removeSegments(indexB,testPath.segments.length);
            }*/
              var maxDist =  testPath.length/num;
              //console.log('maxDist='+maxDist);
            
             testPath.flatten(maxDist);

              //console.log(position);
              var location;
              //console.log('testPath=');
              //console.log(testPath.segments);
              for (var i = 0; i < num; i++) {
                //console.log(location);
               var location_n = {x:testPath.segments[i].point.x,y:testPath.segments[i].point.y};
                var instance = child.instances[i];
                //instance.resetRotation();
                /*if (location) {

                  var delta = location_n.subtract(location);
                  delta.angle += 90;

                  instance.rotate(delta.angle);

                }*/
               instance.update({position:location_n});
                location = location_n;
             }
              /*if (this.getParentNode != parent) {
        parent.addChildNode(this);
      }*/     testPath.remove();
              testPath = null;
             
              //console.log("test path is removed");

            }
          }
        }
      }

    });

    return FollowPathBehavior;
  });