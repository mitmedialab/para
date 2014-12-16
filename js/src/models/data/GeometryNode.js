/*GeometryNode.js
 * base class for geometry object in scene node.
 * extends SceneNode
 */

define([
  'jquery',
  'underscore',
  'models/data/SceneNode',
  'models/data/Condition',
  'models/behaviors/CopyBehavior',
  'utils/TrigFunc',
  'paper'



], function($, _, SceneNode, Condition, CopyBehavior, TrigFunc, paper) {


  var GeometryNode = SceneNode.extend({
    name: 'geometry',
    type: 'geometry',

     defaults: _.extend({}, SceneNode.prototype.defaults, {
    }),

  
    /* initialization
     *
     */
    initialize: function(data) {
      SceneNode.prototype.initialize.apply(this, arguments);

    },

 



  });

  return GeometryNode;

});