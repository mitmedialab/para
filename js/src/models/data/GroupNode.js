/*GroupNode.js
 * class for geometric groupings of path objects
 * extends GeometryNode
 */

define([
  'jquery',
  'underscore',
  'models/data/GeometryNode'

], function($,_, GeometryNode) {
  //paperjs group object
 
  var GroupNode = GeometryNode.extend({
    name: 'group',
    type: 'geometry',
    constructor: function() {

     GeometryNode.apply(this, arguments);
    },

  
    initialize: function() {
     
    }

  });

  return GroupNode;


});