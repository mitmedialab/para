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

   


    constructor: function() {
       /* instances contain objects that provide geometric info
    * this is propogated down to the leaves of the tree to 
    * draw the actual shapes 
    {  position: x,y coordinates of instance
        scale: scale of instance
        rotation: rotation of instance
        selected: boolean indicating selection state          
    }
    */
      this.instances = [];
      this.anchors = [];
      this.selected = false;
      SceneNode.apply(this, arguments);
    },

  
    initialize: function() {
     this.instances.push({position:{x:0,y:0},rotation:0,scale:1});
    },


            update: function(data) {
                //console.log("updating Scene method called");
                //console.log('updating:' + this.get('name'));
                if (this.children.length > 0) {
                    for (var i = 0; i < this.children.length; i++) {
                        if (this.children[i] !== null) {
                            this.children[i].update(data);
                        }
                    }
                }

              

            },

    //overrides SceneNode render function
    render: function(data){

         for(var i=0;i<this.children.length;i++){
          console.log('behavior render');

                this.children[i].render(this.instances);
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