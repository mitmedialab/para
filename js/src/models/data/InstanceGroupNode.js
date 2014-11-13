/*InstanceGroupNode.js
 * class for geometric groupings of path objects
 * extends GeometryNode
 */

define([
  'jquery',
  'underscore',
  'models/data/GroupNode'

], function($,_, GroupNode) {
  //paperjs group object
 
  var InstanceGroupNode = GroupNode.extend({
    name: 'instancegroup',
    type: 'geometry',
    constructor: function() {

     GroupNode.apply(this, arguments);
    },

  
    initialize: function() {
     
    }

  });

  return InstanceGroupNode;


});