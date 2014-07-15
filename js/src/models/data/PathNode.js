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

      GeometryNode.apply(this, arguments);
      //console.log('number of nodes='+SceneNode.numNodeInstances);
    },

    //mixin: Utils.nodeMixin,

    initialize: function() {

      //intialize array to store instances



    },

    getLiteral: function() {
      return this.instance_literals[0];

    },

    /*called when drawing of the path is complete. 
     * Removes the path and creates one instance
     * in original path location*/


    createInstanceFromPath: function(path) {
      var instance = this.createInstance();

      instance.position.x = path.position.x;
      instance.position.y = path.position.y;
      this.instance_literals.push(path);
      //  console.log('createPathInstance');
      //console.log(instance.position);
      path.nodeParent = this;
      return instance;
    },



    /*sets focus to this instance and unfocuses all siblings*/
    focus: function() {

      this.instance_literals[0].strokeColor = 'black';

      var siblings = this.getSiblings();
      for (var i = 0; i < siblings.length; i++) {
        siblings[0].unfocus();
      }
    },

    /* unfocuses this by setting  stroke color to grey */
    unfocus: function() {
      this.instance_literals[0].strokeColor = 'grey';
    },

    /*clears out all but first of literal paths*/
    clear: function() {
      console.log('clear called');

      for (var j = 1; j < this.instance_literals.length; j++) {
        // console.log(this.instance_literals[j]);
        this.instance_literals[j].remove();

      }
      this.instance_literals.splice(1, this.instance_literals.length);
      //console.log("num of literals:"+this.instance_literals.length); 
      var paper = PaperManager.getPaperInstance();
      // console.log('num of drawn children='+paper.project.activeLayer.children.length);

    },

    /* renders instances of the original path
     * render data contains an array of objects containing
     * poition, scale and rotation data for each instance
     */
    render: function(data) {
      var path_literal = this.getLiteral();
      if (data) {
         for (var k = 0; k < this.instances.length; k++) {
            for (var d = 0; d < data.length; d++) {
         

            var instance_literal = path_literal.clone();
            instance_literal.nodeParent = this;
            instance_literal.data.renderSignature = data[d].renderSignature.slice(0);
            instance_literal.data.renderSignature.push(k);
            instance_literal.position.x = this.instances[k].position.x + data[d].position.x;
            instance_literal.position.y = this.instances[k].position.y + data[d].position.y;
            instance_literal.visible = true;
            this.instance_literals.push(instance_literal);
             console.log('path render signature =' + instance_literal.data.renderSignature);
            console.log('length of signature =' + instance_literal.data.renderSignature.length);



          }
        }
      } else {
        for (var z = 0; z < this.instances.length; z++) {

          var instance_literal = path_literal.clone();
          instance_literal.nodeParent = this;
          instance_literal.position.x = this.instances[z].position.x;
          instance_literal.position.y = this.instances[z].position.y;
          instance_literal.visible = true;
          instance_literal.data.renderSignature.push(z);

          this.instance_literals.push(instance_literal);
        }
      }
      path_literal.visible = false;

    },



    //checks to see if path exists in path_literals array
    containsPath: function(path) {
      for (var i = 0; i < this.instance_literals.length; i++) {
        if (this.instance_literals[i].equals(path)) {
          return true;
        }
      }
      return false;
    },

    //selects according render signature
    selectByValue: function(index, value, path, currentNode) {
      console.log("select by path value");
      if (this.containsPath(path)) {
        
        for (var i = 1; i < this.instance_literals.length; i++) {
          //console.log(this.instance_literals[i].data.renderSignature);
          var compareSig = this.instance_literals[i].data.renderSignature.slice(0,index+1);
          compareSig = compareSig.join();
          console.log('compareSig='+compareSig);
          console.log('valueSig='+value);
          if (compareSig === value) {
            this.instance_literals[i].selected = true;
            var last = this.instance_literals[i].data.renderSignature.length-1;
            this.instances[this.instance_literals[i].data.renderSignature[last]].selected = true;
            console.log('selected path value='+this.instance_literals[i].data.renderSignature);
          }
          else{
            console.log('unselected path value='+this.instance_literals[i].data.renderSignature);

          }
          


        }
      }
    },

    //selects or deselects all path instances
    selectAll: function() {
      for (var i = 0; i < this.instance_literals.length; i++) {
        this.instance_literals[i].selected = true;
      }

    },

    deselectAll: function() {
      for (var i = 0; i < this.instance_literals.length; i++) {
        this.instance_literals[i].selected = false;
      }

    },


    //update triggers change event in mouseup
    mouseUpInstance: function() {

      this.trigger('change:mouseUp', this);

    },


  });

  return PathNode;

});