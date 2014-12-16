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


  });

  return PathNode;

});