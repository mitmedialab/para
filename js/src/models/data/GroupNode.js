/*GroupNode.js
 * class for geometric groupings of path objects
 * extends GeometryNode
 */

define([
  'jquery',
  'underscore',
  'models/data/SceneNode'

], function($,_, SceneNode) {
  //paperjs group object
 
  var GroupNode = GeometryNode.extend({
     type: 'group',
    constructor: function() {

     Geometry.apply(this, arguments);
    },

  
    initialize: function() {
     
    }

  });

  return GeometryNode;

});
});