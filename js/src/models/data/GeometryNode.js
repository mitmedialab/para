/*GeometryNode.js
 * base class for geometry object
 * extends SceneNode
 */

define([
  'underscore',
  'models/data/SceneNode'
  
], function(_, SceneNode) {

  var GeometryNode = SceneNode.extend({
    defaults: _.extend({}, SceneNode.prototype.defaults, {
      x: 0,
      y: 0,
      type: 'geom',
      width: 0,
      height: 0,
      strokeColor: 'black',
      fillColor: 'white',
      weight: 1,
    }),

    constructor: function() {

      this.visible = true;

      SceneNode.apply(this, arguments);
      //console.log("number of nodes="+SceneNode.numNodeInstances);
    },


    initialize: function() {
    
    },

    //overrides SceneNode update function
    update: function() {
      SceneNode.prototype.update.apply(this, arguments);
    },

    remove: function() {
      this.path.remove();
      this.visible = false;

    },

    //resets rotation to 0
    resetRotation: function(){
      this.data.rotate(0-this.rotation);
      this.rotation=0;
    }




   

  });

  return GeometryNode;

});