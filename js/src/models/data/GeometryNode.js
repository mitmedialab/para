/*GeometryNode.js
 * base class for geometry object
 * extends SceneNode
 */

define([
  'underscore',
  'models/data/SceneNode',
  'models/Utils'

], function(_, SceneNode, Utils) {

  var GeometryNode = SceneNode.extend({

    
    visible: true,

    defaults: _.extend({}, SceneNode.prototype.defaults, {
      x: 0,
      y: 0,
      type: 'geom',
      width: 0,
      height: 0,
      strokeColor: 'black',
      fillColor: 'white',
      weight: 1,
      rotation: 0,
      scale: 1,
      position: 0,
    }),

    constructor: function() {

      SceneNode.apply(this, arguments);
      //console.log("number of nodes="+SceneNode.numNodeInstances);
    },


    initialize: function() {
    
    },

    //overrides SceneNode update function
    update: function() {
      console.log('updating Geom method called');
      SceneNode.prototype.update.apply(this, arguments);
    },

    remove: function() {
      this.path.remove();
      this.visible = false;

    },

    setPosition: function(position){
      this.position = position;
      this.data.position = position;
      console.log(position);
    },

    //rotate
    rotate: function(theta){
      this.rotation = this.rotation+theta;
      this.data.rotate(theta);
    },

    //resets rotation to 0
    resetRotation: function(){
      this.data.rotate(0-this.rotation);
      this.rotation=0;
    },

    //scale 
    scale: function(scaleAmt){
      this.scale = this.scale*scaleAmt;
      this.data.scale(scaleAmt);
    },

    //resets scale to 1
    resetScale: function(){
      this.data.scale(1/this.scale);
      this.scale=1;
    }



   

  });

  return GeometryNode;

});