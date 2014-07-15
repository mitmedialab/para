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
      this.instance_literals = [];
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

    
        for (var j = 0; j < this.instances.length; j++) {
           for (var i = 0; i < data.length; i++) {
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

      /*sets focus to this instance and unfocuses all siblings*/
    focus: function(){
      
      var siblings = this.getSiblings();
      for(var i=0;i<siblings.length;i++){
        siblings[0].unfocus();
      }
      for(var j=0;j<this.children.length; j++){
          this.children[j].focus();
      }
    },

    /* unfocuses this by setting  stroke color to grey */
    unfocus: function(){
         this.instance_literals[0].strokeColor = 'red';
          for(var j=0;j<this.children.length; j++){
          this.children[j].unfocus();
      }
    },

    clear: function(){
      this.instance_literals = [];
       for (var i = 0; i < this.children.length; i++) {
        this.children[i].clear();
      }

    },

    //renders geometry
    render: function(data) {
      // console.log('num of instances:'+this.type+': '+this.instances.length);
      //first create array of new instances that contain propogated updated data
      
      if(data){
          for (var j = 0; j < this.instances.length; j++) {
       for (var i = 0; i < data.length; i++) {
           
          var u_instance = this.instances[j].clone();
           u_instance.renderSignature = data[i].renderSignature.slice(0);
           u_instance.renderSignature.push(i);
          u_instance.render(data[i]);

          this.instance_literals.push(u_instance);
        
        }
      }

    
          for (var k = 0; k < this.children.length; k++) {

            this.children[k].render(this.instance_literals);
          }
         }
         else{
           for (var f = 0; f < this.children.length; f++) {

            this.children[f].render(this.instances);
          }
         }
      
    },

    setSelection: function(currentNode,instanceParent){
      if(this==currentNode){
        return;
      }
      else{
        this.selectByInstanceParent(instanceParent);
        if(this.nodeParent!==null){
          this.nodeParent.setSelection(currentNode);
        }
      }
    },

    //selects a specifc index
   /*selectAt: function(index, val) {
      if (index < this.instances.length) {
        this.instances[index].
      }
    },
  */


  //selects according render signature
    selectByValue: function(index,value,path) {
     //if(this.containsPath(path)){
     for(var i=0;i<this.children.length;i++){
      if(this.children[i].containsPath(path)){
        this.children[i].selectByValue(index,value,path);

      }
     }
   //}
    },
    //selects or deselects all path instances
    selectAll: function() {
      //console.log('calling geometry select all'+ isSelect);
       /*for(var i=0;i<this.instances.length;i++){
        this.instances[i].selected = true;
      }*/
      for(var j=0; j<this.children.length;j++){
        this.children[j].selectAll();
      } 
      

    },

//selects or deselects all path instances
    deselectAll: function() {
      //console.log('calling geometry select all'+ isSelect);
       for(var i=0;i<this.instances.length;i++){
        this.instances[i].selected = false;
      }
      for(var j=0; j<this.children.length;j++){
        this.children[j].deselectAll();
      } 
    },

   //checks to see if path literal is contained by any children
    containsPath: function(path){
      for (var i = 0; i < this.children.length; i++) {
        if(this.children[i].containsPath(path)){
          return true;
        }
      }
      return false;
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