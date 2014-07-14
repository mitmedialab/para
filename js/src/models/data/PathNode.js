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
      GeometryNode.apply(this, arguments);
      //console.log('number of nodes='+SceneNode.numNodeInstances);
    },

    //mixin: Utils.nodeMixin,

    initialize: function() {

      //intialize array to store instances
 


    },

    getLiteral: function(){
      return this.instance_literals[0];
      
    },

    /*called when drawing of the path is complete. 
     * Removes the path and creates one instance
     * in original path location*/
 

    createInstanceFromPath: function(path){
      var instance = this.createInstance();
    
      instance.position.x = path.position.x;
      instance.position.y = path.position.y;
       this.instance_literals.push(path);
    //  console.log('createPathInstance');
      //console.log(instance.position);
      path.nodeParent = this;
      return instance;
    },

    /* renders instances of the original path
     * render data contains an array of objects containing
     * poition, scale and rotation data for each instance
     */


     clear: function(){
      console.log('clear called');
      
       for (var j = 1; j < this.instance_literals.length; j++) {
       // console.log(this.instance_literals[j]);
        this.instance_literals[j].remove();

      }
      this.instance_literals.splice(1,this.instance_literals.length);
      //console.log("num of literals:"+this.instance_literals.length); 
        var paper = PaperManager.getPaperInstance();
       // console.log('num of drawn children='+paper.project.activeLayer.children.length);

     },
    

    render: function(data) {
      var path_literal=this.getLiteral();
       for (var f= 0; f< this.instances.length; f++) {
      // console.log("instance position:"+this.instances[f].position.x+","+this.instances[f].position.y);
       }
        for (var d = 0; d < data.length; d++) {
          console.log('pathrender:' +d); 
          for (var k = 0; k < this.instances.length; k++) {
          //console.log('pathrender_ literal:' + k);
          //console.log(this.instances[k].position);
        // console.log('creating instance literal');
          var instance_literal = path_literal.clone();
          instance_literal.nodeParent = this;
          instance_literal.position.x = this.instances[k].position.x+data[d].position.x;
          instance_literal.position.y = this.instances[k].position.y+data[d].position.y;
          //console.log("rendering instance literal at:"+(this.instances[k].position.x+data[d].position.x)+","+(this.instances[k].position.y+data[d].position.y));
          instance_literal.visible= true;



          this.instance_literals.push(instance_literal);


        }
      }
      path_literal.visible=false;

      //this.path_literal.remove();
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