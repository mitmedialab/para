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
      console.log('follow path behavior interesection found called');
    }
  };

  return FollowPathBehavior;
});