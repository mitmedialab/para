/*GeometryNode.js
 * base class for geometry object
 * extends SceneNode
 */

define([
  'jquery',
  'underscore',
  'models/data/SceneNode'

], function($,_, SceneNode) {
  //paperjs group object
 
  var GeometryNode = SceneNode.extend({

  
    visible: true,
    scaleVal: 1,
    position: {x:0,y:0},
    rotation: 0,
    type: 'geometry',

    /* instances contain objects that provide geometric info
    * this is propogated down to the leaves of the tree to 
    * draw the actual shapes 
    {  position: x,y coordinates of instance
        scale: scale of instance
        rotation: rotation of instance
        selected: boolean indicating selection state          
    }
    */

    instances: [],
    anchors: [],
    selected: false,



    constructor: function() {

      SceneNode.apply(this, arguments);
    },

  
    initialize: function() {
     
    },

    //overrides SceneNode update function
  
    update: function(data){
      console.log("geom update");
      for(var i =0;i<this.children.length;i++){
          this.children[i].update(data);
      }
    },

   
     //selects or deselects all path instances
    selectAll: function(isSelect){
      //console.log('calling geometry select all'+ isSelect);
      for(var i =0;i<this.children.length;i++){
          this.children[i].selectAll(isSelect);
      }

    },

      //clears all anchors from array
      removeAnchors: function() {
        this.anchors = [];
      },

      /*called when instance is toggled to or from an anchor- 
       *stores reference to child node which has been designated as an anchor
       */

      anchorUpdated: function(instanceNum) {


      },


   

  });

  return GeometryNode;

});