/*FollowPathBehavior.js
 */
define([
    'models/behaviors/BaseBehavior',
    'models/PaperManager',
    'utils/TrigFunc'
  ],

  function(BaseBehavior, PaperManager, TrigFunc) {
    var paper = PaperManager.getPaperInstance();
    var FollowPathBehavior = BaseBehavior.extend({
      name: 'followpath',
      type: 'distribution',
      constructor: function(pathChild) {
        this.pathChild = pathChild;
        this.finalPath = null;
        this.startAngle = 0;
        this.location = 0;
      },

      update: function(data) {
        //console.log("follow path update"+ this.name);
      // console.log("number of target instances for follow path=" + this.instances.length);
        var zeroedPath = this.pathChild.getLiteral().clone();
        zeroedPath.position.x = 0;
        zeroedPath.position.y = 0;
        if(zeroedPath.closed){
            zeroedPath.split(0,0);
          }
        var num = this.instances.length;
        if (this.instances[0].delta.x == this.instances[num - 1].delta.x && this.instances[0].delta.y == this.instances[num - 1].delta.y) {
          this.finalPath = zeroedPath;

        } else {
          var locA = zeroedPath.getNearestPoint(this.instances[0].delta);
          var cA = zeroedPath.getNearestLocation(this.instances[0].delta);
          var locB = zeroedPath.getNearestPoint(this.instances[num - 1].delta);
          var cB = zeroedPath.getNearestLocation(this.instances[this.instances.length - 1].delta);


          var offset = cA.distance;


          if (!locA.equals(zeroedPath.firstSegment.point)) {
            var split1 = zeroedPath.split(cA);
            if (split1) {
              this.finalPath = split1;
              zeroedPath.remove();
            } else {
              this.finalPath = zeroedPath;
            }
          } else {
            this.finalPath = zeroedPath;
          }


          if (!locB.equals(this.finalPath.lastSegment.point)) {
                        console.log("cb="+cB);
                      console.log("final path="+this.finalPath);
                var tail = this.finalPath.split(cB);
               if (tail) {
                  tail.remove();
                }

              } 
        }  
        var maxDist;
        if (!this.finalPath.closed) {
          maxDist = this.finalPath.length / (num - 1);
        } else {
          maxDist = this.finalPath.length / (num);
        }

        this.finalPath.flatten(maxDist);

        //console.log("number of segments on path=" + this.finalPath.segments.length);

        var selected = this.getFirstSelectedInstance();
        /*  if (selected) {
                if (selected.index === 1) {
                  this.checkDistanceIncrement(this.instances[0], selected, maxDist, this);
                } else if (selected.index == this.instances.length - 2) {
                  this.checkDistanceDecrement(this.instances[0], selected, maxDist, this);

                }
              }*/
        for (var i = 0; i < this.finalPath.segments.length; i++) {
          //var l = new paper.Path(this.finalPath.segments[i].point, 10);
         // e.fillColor = 'red';
        }
        this.location = this.finalPath.segments[0].point;
        this.startAngle = this.finalPath.segments[1].point.subtract(location).angle;
      },


      calculate: function(data, index) {

        this.followPath(index);
        if (index === 0 || index === this.instances.length - 1) {
          this.instances[index].anchor = true;
        } else {
          this.instances[index].anchor = false;
        }
      },

      clean: function(data) {
        this.finalPath.remove();
        this.finalPath = null;


      },

      //projects a set of instances along a parent path- needs to be moved to mixin
      followPath: function(index) {
        ////console.log("handles for "+index);
        var location_n = this.finalPath.segments[index].point;
        ////console.log(this.finalPath.segments.handleOut);
        // //console.log(this.finalPath.segments.handleIn);
        //console.log(index);
        var instance = this.instances[index];
        instance.visible = true;
        var delta = location_n.subtract(location);
        console.log("angle="+delta.angle);

        var difference = {
          x: location_n.x,
          y: location_n.y
        };
        instance.update({
          delta: difference,
          rotation: {
            angle: delta.angle+90 
          },
        });

        this.location = location_n;


      }


    });

    return FollowPathBehavior;
  });