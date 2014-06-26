/*FollowPathBehavior.js
 */
define([
	'underscore',
	'backbone'],

	function() {

  var FollowPathBehavior = {
    update:function() {
      console.log('follow path behavior update called');
    },

    intersectionFound: function(data) {
      var num = 10;
      console.log('follow path behavior interesection found called');
      this.createInstances(num-1,false);
      this.followPath(data.node.instances[0].data);

    }
  };

  return FollowPathBehavior;
});