/*GeometryNode.js
 * base class for geometry object
 * extends SceneNode
 */

define([
  'jquery',
  'underscore',
  'models/data/SceneNode',
  'models/data/Instance'

], function($, _, SceneNode, Instance) {
  //paperjs group object

  var GeometryNode = SceneNode.extend({



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

      SceneNode.apply(this, arguments);
    },


    initialize: function() {
     
      this.createInstance();
    },


    /*called when drawing of the path is complete. 
     * Removes the path and creates one instance
     * in original path location
     */
    createInstance: function(data) {
      //should it create a copy node here with a value of 1? no, that produces an infinite chain...
      var instance = new Instance();
      for (var k in data) {
        if (instance[k]) {
          instance[k] = data[k];
        }
      } //
      this.instances.push(new Instance());
      return instance;

    },


    //updates instances according to data and the passes the updated instances to child function

    update: function(data) {
      console.log("update for:"+this.type);
      for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < this.instances.length; j++) {
          var instance = this.instances[j];
          instance.update(data[i]);
          // console.log("update position:");
        }
      }


      if (this.children.length > 0) {
        for (var z = 0; z < this.children.length; z++) {
          if (this.children[z] !== null) {
            this.children[z].update(this.instances);
          }
        }
      }
    },

    reset: function() {
      for (var j = 0; j < this.instances.length; j++) {
        this.instances[j].reset();
      }
    },

    clear: function(){
       for (var i = 0; i < this.children.length; i++) {
        this.children[i].clear();
      }

    },

    //renders geometry
    render: function(data) {
       console.log('num of instances:'+this.type+': '+this.instances.length);
      if (data && data.length > 0) {
        for (var d = 0; d < data.length; d++) {
           console.log('base render:'+this.type+':'+d);
          for (var i = 0; i < this.children.length; i++) {

            this.children[i].render(this.instances);
          }
        }
      } else {
        console.log('base render:'+this.type+': no data');
        for (var j = 0; j < this.children.length; j++) {
         
          this.children[j].render(this.instances);
        }
      }
    },

    //selects a specifc index
    selectAt: function(index, val) {
      if (index < this.instances.length) {
        this.instances[index].selected = val;
      }
    },
    //selects or deselects all path instances
    selectAll: function(isSelect) {
      //console.log('calling geometry select all'+ isSelect);
      this.selected = true;
      for (var i = 0; i < this.children.length; i++) {
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