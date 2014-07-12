/*PathNode.js
 * path object
 * extends GeometryNode
 * node with actual path in it
 */


define([
  'underscore',
  'models/data/GeometryNode',
  'models/data/Instance',
  'models/PaperManager'

], function(_, GeometryNode, Instance, PaperManager) {
  //drawable paper.js path object that is stored in the pathnode

  var PathNode = GeometryNode.extend({

    type: 'path',


    constructor: function() {
      //array to store actual paper.js objects
      this.instance_literals = [];
       var paper = PaperManager.getPaperInstance();
       this.path_literal =  new paper.Path();
      GeometryNode.apply(this, arguments);
      //console.log('number of nodes='+SceneNode.numNodeInstances);
    },

    //mixin: Utils.nodeMixin,

    initialize: function() {

      //intialize array to store instances
    
      this.path_literal.selected = true;
      this.path_literal.strokeColor = 'black';
      this.path_literal.data.nodeParent = this;


    },

    /*called when drawing of the path is complete. 
     * Removes the path and creates one instance
     * in original path location*/
 

    createInstance: function(data){
      var instance = new Instance();
      instance.position.x = data.position.x;
      instance.position.y = data.position.y;
    //  console.log("createPathInstance");
      //console.log(instance.position);
      this.instances.push(instance);
      return instance;
    },

    /* renders instances of the original path
     * render data contains an array of objects containing
     * poition, scale and rotation data for each instance
     */

    

    render: function(data,length) {
      
      for (var j = 0; j < this.instance_literals.length; j++) {
        console.log("instance literal at "+j+":");
        console.log(this.instance_literals[j]);
        //this.instance_literals[j].remove();
      }
     
      for (var d = 0; d < data.length; d++) {
          console.log('pathrender:' +d); 
          for (var k = 0; k < this.instances.length; k++) {
          console.log('pathrender_ literal:' + k);
          //console.log(this.instances[k].position);
        // console.log("creating instance literal");
          var instance_literal = this.path_literal.clone();
          instance_literal.nodeParent = this;
          instance_literal.position.x = this.instances[k].position.x;
          instance_literal.position.y = this.instances[k].position.y;



          this.instance_literals.push(instance_literal);


        }
      }
      //this.path_literal.remove();
      var paper = PaperManager.getPaperInstance();
      //console.log('num of drawn children='+paper.project.activeLayer.children.length);
      console.log('\n==========================\n');
    },

    //selects or deselects all path instances
    selectAll: function(isSelect) {
      console.log('calling path select all' + isSelect);
      this.selected = true;
      for (var i = 0; i < this.instances.length; i++) {
        if (isSelect) {
          this.instances[i].selected = true;
        } else {
          this.instances[i].selected = false;
        }
      }

    },


    //update triggers change event in mouseup
    mouseUpInstance: function() {

      this.trigger('change:mouseUp', this);

    },


  });

  return PathNode;

});