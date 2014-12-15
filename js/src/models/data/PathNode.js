/*PathNode.js
 * path object
 * extends GeometryNode
 * node with actual path in it
 */


define([
  'underscore',
  'models/data/Instance',
  'utils/TrigFunc',
  'utils/PPoint',
  'paper'

], function(_, Instance,TrigFunc, PPoint, paper) {
  //drawable paper.js path object that is stored in the pathnode
  var PathNode = Instance.extend({
   
    defaults: _.extend({}, Instance.prototype.defaults, {
     
       name: 'path',
      type: 'geometry',
    }),


    initialize: function(data) {
      Instance.prototype.initialize.apply(this, arguments);

    },

    
    clone: function(){
      var clone = Instance.prototype.clone.apply(this,arguments);
      clone.set('master_path',this.get('master_path').clone());
      return clone;
    },



    /*reset
     *removes all rendered instances, eventually change to reset
     * them and only delete those which are not used by the user
     */
    reset: function() {
      /*var instances = this.get('geom_instances');
      for (var i = 0; i < instances.length; i++) {
        instances[i].remove();
      }
      this.set('geom_instances',[]);*/
      Instance.prototype.reset.apply(this,arguments);

    },



  });

  return PathNode;

});