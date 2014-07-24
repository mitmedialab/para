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
      this.scaffolds = [];
      this.instance_literals = [];
      this.behaviors = [];


      SceneNode.apply(this, arguments);
    },


    initialize: function() {

      this.createInstance();
    },

    exportJSON: function(){
      this.set({
       type: this.type
      });
       var data = this.toJSON();
       var jInstances = [];
       var children = [];
        var lInstances = [];
       var behaviors = [];
       for(var i=0;i<this.instances.length;i++){
       
        jInstances.push(this.instances[i].exportJSON());
       }
       for(var j=0;j<this.instance_literals.length;j++){
        lInstances.push(this.instance_literals[j].exportJSON());
       }
       for(var k=0;k<this.children.length;k++){
       
        children.push(this.children[k].exportJSON());
       }
       for(var m=0;m<this.behaviors.length;i++){
          //behaviors.push(this.behaviors[i].exportJSON());
       }
       data.instances  = jInstances;
        data.instance_literals  = lInstances;
         data.children  = children;
         data.behaviors = behaviors;
      // console.log(JSON.stringify(data));
       return data;
    },


    /*called when drawing of the path is complete. 
     * Removes the path and creates one instance
     * in original path location
     */
    createInstance: function(data) {
      //should it create a copy node here with a value of 1? no, that produces an infinite chain...
      var instance;
      if (data) {
        instance = data.clone();
      } else {
        instance = new Instance();
      }
      instance.nodeParent=this;
      this.instances.push(instance);
      instance.index = this.instances.length-1;
      return instance;

    },

    createInstanceAt: function(data,index){
        var instance;
      if (data) {
        instance = data.clone();
      } else {
        instance = new Instance();
      }
      instance.nodeParent=this;

      this.instances.splice(index,0,instance);
       for(var i=0;i<this.instances.length;i++){
        this.instances[i].index =i;
       }
      return instance;
    },

    removeInstanceAt: function(index){
      this.instances.splice(index,1);
    },


    //updates instances according to data and the passes the updated instances to child function

    update: function(data) {
      // console.log('update for:'+this.type);
      var parentType = '';
      if (this.nodeParent) {
        parentType = this.nodeParent.type;
        // console.log('parent type='+this.nodeParent.type);
      }
      for (var j = 0; j < this.instances.length; j++) {
        for (var i = 0; i < data.length; i++) {
          var instance = this.instances[j];
          //console.log('instance ' +this.type+'_'+parentType+'_'+instance.copy+' position on reg update:');
          // console.log(instance.position);
          instance.update(data[i]);
          //console.log('after update');
          //  console.log(instance.position);
        }
      }
  
     
      


    },

    updateChildren: function(data){
      console.log("update children");
       this.update(data);
        for (var k = 0; k <this.children.length; k++) {
          this.children[k].update([{}]);
        }
    },

    updateSelected: function(data) {
      for (var j = 0; j < this.instances.length; j++) {
        if (this.instances[j].selected) {
          //console.log('found selected instance at:' + j);
          for (var i = 0; i < data.length; i++) {
            var instance = this.instances[j];
            //console.log('instance ' +this.type+'_'+parentType+'_'+instance.copy+' position on reg update:');
            //console.log(instance.position);
            instance.render(data[i]);
            //console.log('after update');
            //console.log(instance.position);
          }
        }
      }



    },

  
    reset: function() {
      for (var j = 0; j < this.instances.length; j++) {
        this.instances[j].reset();
      }
    },

    /*sets focus to this instance and unfocuses all siblings*/
    focus: function() {

      var siblings = this.getSiblings();
      for (var i = 0; i < siblings.length; i++) {
        siblings[0].unfocus();
      }
      for (var j = 0; j < this.children.length; j++) {
        this.children[j].focus();
      }
    },

    /* unfocuses this by setting  stroke color to grey */
    unfocus: function() {
      this.instance_literals[0].strokeColor = 'red';
      for (var j = 0; j < this.children.length; j++) {
        this.children[j].unfocus();
      }
    },

    //shows or hides all instances
    setVisible: function(v){
      for(var j=0;j<this.instances.length;j++){
        this.instances[j].visible=v;
      }

      for (var i = 0; i < this.children.length; i++) {
        this.children[i].setVisible(v);
      }
    },


    clear: function() {
      this.instance_literals = [];
      
      
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].clear();
      }

    },

    /*renders geometry
     * if data is provided, creates a temporary instance array with updated values according to data
     *  otherwise just renders its children with its permanent instances
     * copies the render signature from the data and concats it with the
     *index of the instance used to render the path
     */
    render: function(data, currentNode) {
      // console.log('num of instances:'+this.type+': '+this.instances.length);
      //first create array of new instances that contain propogated updated data
      //console.log('geom render');
      //console.log(data);
      if (data) {
          // console.log('geom render with data');
        for (var j = 0; j < this.instances.length; j++) {
          for (var i = 0; i < data.length; i++) {
            var u_instance = this.instances[j].clone();
            //console.log('data at '+ i);
            //console.log(data[i]);
            if(data[i].renderSignature){
              u_instance.renderSignature = data[i].renderSignature.slice(0);
            }
              u_instance.renderSignature.push(j);
              u_instance.instanceParentIndex = j;
             u_instance.render(data[i]);
           
            if (this.nodeParent == currentNode) {
              u_instance.selected = this.instances[j].selected;
              u_instance.anchor = this.instances[j].anchor;
            } else {
              u_instance.selected = data[i].selected;
               u_instance.anchor = data[i].anchor;
            }
            this.instance_literals.push(u_instance);

          }
        }


        for (var k = 0; k < this.children.length; k++) {

          this.children[k].render(this.instance_literals, currentNode);
        }
      } else {


        for (var f = 0; f < this.children.length; f++) {

          this.children[f].render(this.instances, currentNode);
        }
      }

    },

    setSelection: function(currentNode, instanceParent) {
      if (this == currentNode) {
        return;
      } else {
        this.selectByInstanceParent(instanceParent);
        if (this.nodeParent !== null) {
          this.nodeParent.setSelection(currentNode);
        }
      }
    },

    


    //selects according render signature
    selectByValue: function(index, value, path, currentNode) {
      //console.log('select by geom value');
      var sIndexes = [];
      for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].containsPath(path)) {
          var results = this.children[i].selectByValue(index, value, path, currentNode);
         // console.log('select by value results=' + results);
        //  console.log(results);
          if (this != currentNode) {
            for (var j = 0; j < results.length; j++) {
              if (results[j].length > 0) {
                var last = results[j].length - 1;
               // console.log('selecting instance at' + last);
                this.instances[results[j][last]].selected = true;

                results[j].pop();
                if (results[j].length > 0) {
                  sIndexes.push(results[j]);
                }
              }
            }
          }

        }
      }
      return sIndexes;
    },

    //selects or deselects all path instances
    selectAll: function() {
      //console.log('calling geometry select all'+ isSelect);
      for (var i = 0; i < this.instances.length; i++) {
        this.instances[i].selected = true;
      }
      for (var j = 0; j < this.children.length; j++) {
        this.children[j].selectAll();
      }


    },

    //selects or deselects all path instances
    deselectAll: function() {
      //console.log('calling geometry select all'+ isSelect);
      for (var i = 0; i < this.instances.length; i++) {
        this.instances[i].selected = false;
      }
      for (var j = 0; j < this.children.length; j++) {
        this.children[j].deselectAll();
      }
    },

    //returns first selected instance
    getFirstSelectedInstance: function(){
      for(var i=0;i<this.instances.length;i++){
          if(this.instances[i].selected){
            return {instance:this.instances[i],index:i};
          }
      }
      return null;

    },

    //checks to see if path literal is contained by any children
    containsPath: function(path) {
      for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].containsPath(path)) {
          return true;
        }
      }
      return false;
    },

    containsBehaviorType: function(type) {
      var indexes = [];
      for (var i = 0; i < this.behaviors.length; i++) {
        //console.log('behavior_type='+this.behaviors[i].type);
        if (this.behaviors[i].type === type) {

          indexes.push(i);
        }
      }
      if (indexes.length > 0) {
        return indexes;
      }
      console.log('returning false for behavior');
      return false;

    },

    getBehaviorByName: function(name){
       for (var i = 0; i < this.behaviors.length; i++) {
        if (this.behaviors[i].name === name) {
          return this.behaviors[i];
        }
      }
      return null;
    },

    containsBehaviorName: function(name) {
      var indexes = [];
      for (var i = 0; i < this.behaviors.length; i++) {
        if (this.behaviors[i].name === name) {
          indexes.push(i);
        }
      }
      if (indexes.length > 0) {
        return indexes;
      }
      return false;


    },

    /* placeholder functions for leftOf, rightOf geometric checks */
    instanceSide: function(instance){
      console.log('calling geom instance side');
      return -1;
    },

    checkIntersection: function(){
     // console.log('geom check intersection');
      for (var i=0;i<this.children.length;i++){
        var intersection = this.children[i].checkIntersection();
        if(intersection!==null){
          return intersection;

        }
      }
    }



  });

  return GeometryNode;

});