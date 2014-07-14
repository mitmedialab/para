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
      var instance;
      if(data){
        instance = data.clone();
      }
      else{
        instance = new Instance();
      }
      this.instances.push(instance);
      return instance;

    },


    //updates instances according to data and the passes the updated instances to child function

    update: function(data) {
     // console.log('update for:'+this.type);
      var parentType = '';
     if(this.nodeParent){
      parentType = this.nodeParent.type;
     // console.log('parent type='+this.nodeParent.type);
    }

     for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < this.instances.length; j++) {
          var instance = this.instances[j];
             console.log('instance ' +this.type+'_'+parentType+'_'+instance.copy+' position on reg update:');
              console.log(instance.position);
              instance.update(data[i]);
              console.log('after update');
              console.log(instance.position);
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
      // console.log('num of instances:'+this.type+': '+this.instances.length);
      //first create array of new instances that contain propogated updated data
      var updatedInstances = [];
      if(data){
       for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < this.instances.length; j++) {
          var u_instance = this.instances[j].clone();
          u_instance.render(data[i]);
          updatedInstances.push(u_instance);
        
        }
      }

    
          for (var k = 0; k < this.children.length; k++) {

            this.children[k].render(updatedInstances);
          }
         }
         else{
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