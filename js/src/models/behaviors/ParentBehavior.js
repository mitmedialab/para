/*ParentBehavior.js
 */
define([
  'underscore',
  'backbone'],

  function() {

  var ParentBehavior = {

    update:function() {
      console.log('parent behavior update called');
    },

    intersectionFound: function(data) {
      console.log('parent path behavior interesection found called');
    }
  };

  return ParentBehavior;
});