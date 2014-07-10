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
     
    },

    //overrides SceneNode update function
  
    update: function(data) {
      
    },

    render: function(data){

    },

     //selects or deselects all path instances
    selectAll: function(isSelect){
      for(var i =0;i<this.children.length;i++){
          this.children[i].selectAll(isSelect);
      }

    },


   

  });

  return GeometryNode;

});
});