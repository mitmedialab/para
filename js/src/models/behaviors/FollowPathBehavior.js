/*FollowPathBehavior.js
 */
define([
	 'models/behaviors/BaseBehavior'
  ],

	function(BaseBehavior) {

  var FollowPathBehavior = BaseBehavior.extend({
    update:function() {
      console.log('follow path behavior update called');
    },

    intersectionFound: function(data) {
      var num = 10;
      console.log('follow path behavior interesection found called');
      this.createInstances(num-1,false);
      this.followPath(data.node.instances[0].data);

    },

        //projects a set of instances along a parent path- needs to be moved to mixin
    followPath: function(path) {
     
      //this.path.strokeColor = 'red';
     var num = this.instances.length;
     var maxDist = path.length / num;
     
      var position = path.clone();
    
      position.flatten(maxDist);

      //console.log(position);
      var location;
      for (var i = 0; i < num; i++) {
       //console.log(location);
        var location_n = position.segments[i].point;
        var instance = this.instances[i];
        instance.resetRotation();
        if (location) {

          var delta = location_n.subtract(location);
          delta.angle += 90;

          instance.rotate(delta.angle);
          
        }
        instance.setPosition(location_n);
        



        location = location_n;
      }
      /*if (this.getParentNode != parent) {
        parent.addChildNode(this);
      }*/
      position.remove();


    }

  });

  return FollowPathBehavior;
});