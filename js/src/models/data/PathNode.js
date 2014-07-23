/*PathNode.js
 * path object
 * extends GeometryNode
 * node with actual path in it
 */


define([
  'underscore',
  'models/data/GeometryNode',
  'models/data/Instance',
  'models/PaperManager',
  'utils/TrigFunc'

], function(_, GeometryNode, Instance, PaperManager, TrigFunc) {
  //drawable paper.js path object that is stored in the pathnode
  var paper = PaperManager.getPaperInstance();
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
      instance.closed = path.closed;
      path.instanceParentIndex = this.instances.length - 1;
      this.instance_literals.push(path);
      path.instanceIndex = this.instance_literals.length - 1;
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
      //console.log('clear called');
      /* for(var i=0;i<this.instances.length;i++){
        this.instances[i].visible=true;
      }*/
      for (var j = 1; j < this.instance_literals.length; j++) {
        // console.log(this.instance_literals[j]);
        this.instance_literals[j].remove();

      }
      this.instance_literals.splice(1, this.instance_literals.length);
      //console.log('num of literals:'+this.instance_literals.length); 

      // console.log('num of drawn children='+paper.project.activeLayer.children.length);

    },

    updateSelected: function(data) {
      // console.log('update selected path:'+this.instances.length);
      for (var j = 0; j < this.instances.length; j++) {
        if (this.instances[j].selected) {
          //console.log('found selected instance at:'+j);
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

    //called when path data is modified 
    updatePath: function(path) {
     // console.log("updating path to");
      var newPath = path.clone();
      newPath.strokeColor = 'black';
      newPath.instanceParentIndex = path.instanceParentIndex;
       //newPath.position.x=this.instance_literals[0].x;
       //newPath.position.y=this.instance_literals[0].x;

      var removedItem = this.instance_literals.shift();
      var removedBounds = removedItem.bounds;
      var newBounds = newPath.bounds;
      var wD = removedBounds.width-newBounds.width;
      var hD =  removedBounds.height-newBounds.height;
      //console.log("diff="+wD+","+hD);
      newPath.position.x = removedItem.position.x-wD;
      newPath.position.y = removedItem.position.y-hD;
      
      newPath.rotate(0-this.instances[removedItem.instanceParentIndex].rotation);
      removedItem.remove();
      removedItem = null;
      this.instance_literals.unshift(newPath);

    },


    /* renders instances of the original path
     * render data contains an array of objects containing
     * position, scale and rotation data for each instance
     * copies the render signature from the data and concats it with the
     *index of the instance used to render the path
     */
    render: function(data, currentNode) {
      var path_literal = this.getLiteral();

      if (data) {
        for (var k = 0; k < this.instances.length; k++) {

          for (var d = 0; d < data.length; d++) {

            var instance_literal = path_literal.clone();
            instance_literal.nodeParent = this;
            instance_literal.instanceParentIndex = k;
            instance_literal.data.renderSignature = data[d].renderSignature.slice(0);
            instance_literal.data.renderSignature.push(k);
            instance_literal.position.x = this.instances[k].position.x + data[d].position.x;
            instance_literal.position.y = this.instances[k].position.y + data[d].position.y;
            instance_literal.scale(this.instances[k].scale * data[d].scale);
            instance_literal.rotate(this.instances[k].rotation + data[d].rotation);

            if (this.nodeParent == currentNode) {
              instance_literal.selected = this.instances[k].selected;
              if (this.instances[k].anchor) {
                instance_literal.strokeColor = '#83E779';
              }
            } else {
              instance_literal.selected = data[d].selected;
              if (data[d].anchor) {
                instance_literal.strokeColor = '#83E779';
              }
            }
            //instance_literal.selected = data[d].selected;


            instance_literal.visible = this.instances[k].visible;
            this.instance_literals.push(instance_literal);
            instance_literal.instanceIndex = this.instance_literals.length - 1;

          }
        }
      } else {
        for (var z = 0; z < this.instances.length; z++) {

          var instance_literal = path_literal.clone();
          instance_literal.nodeParent = this;
          instance_literal.instanceParentIndex = z;

          instance_literal.position.x = this.instances[z].position.x;
          instance_literal.position.y = this.instances[z].position.y;
          instance_literal.rotate(this.instances[z].rotation);
          instance_literal.scale(this.instances[z].scale);
          instance_literal.visible = this.instances[z].visible;
          instance_literal.data.renderSignature = [];
          instance_literal.data.renderSignature.push(z);
          //this.instance_literals.selected = this.instances[z].selected;
          this.instance_literals.push(instance_literal);
          instance_literal.instanceIndex = this.instance_literals.length - 1;
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

    /*selects according render signature
     * the render signature is a list of values that is generated upon rendering and
     * provides a means to track the inerhtiance structure of an instance
     * index= index at which to slice instance's render signature
     *  value= string which represents render signature that we are trying to match
     * path= original path literal that was selected- used to ensure we are selecting the right object
     */
    selectByValue: function(index, value, path, currentNode) {
      //console.log('select by path value');
      var sIndexes = [];

      if (this.containsPath(path)) {

        for (var i = 1; i < this.instance_literals.length; i++) {
          //console.log(this.instance_literals[i].data.renderSignature);
          var compareSig = this.instance_literals[i].data.renderSignature.slice(0, index + 1);
          compareSig = compareSig.join();
          //console.log('compareSig='+compareSig);
          //console.log('valueSig='+value);
          if (compareSig === value) {
            //this.instance_literals[i].selected = true;
            var last = this.instance_literals[i].data.renderSignature.length - 1;
            // console.log('selected render sig:' + this.instance_literals[i].data.renderSignature);
            var iIndex = this.instance_literals[i].data.renderSignature[last];
            this.instances[iIndex].selected = true;
            var copySig = this.instance_literals[i].data.renderSignature.slice(0);

            copySig.pop();
            // console.log('copy sig:' + copySig);
            if (copySig.length > 0) {
              sIndexes.push(copySig);
            }

            //console.log('selected path value='+this.instance_literals[i].data.renderSignature);
          }
          //else{
          // console.log('unselected path value='+this.instance_literals[i].data.renderSignature);

          //}

        }
      }
      return sIndexes;
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
      for (var j = 0; j < this.instances.length; j++) {
        this.instances[j].selected = false;
      }

    },


    //update triggers change event in mouseup
    mouseUpInstance: function() {

      this.trigger('change:mouseUp', this);

    },

    /* placeholder functions for leftOf, rightOf geometric checks */
    instanceSide: function(instance) {
      for (var i = 0; i < this.instances.length; i++) {
        var side, pA, pB, pM;
        if (this.instances[i].closed) {

          pA = {
            x: this.instances[i].position.x,
            y: 0
          };
          pB = {
            x: this.instances[i].position.x,
            y: 100
          };


        } else {
          var path_literal = this.instance_literals[i + 1];
          // console.log("path_literal=");
          //  console.log(path_literal);
          // console.log(path_literal.segments);
          pA = {
            x: path_literal.segments[0].point.x,
            y: path_literal.segments[0].point.y
          };
          pB = {
            x: path_literal.segments[path_literal.segments.length - 1].point.x,
            y: path_literal.segments[path_literal.segments.length - 1].point.y
          };

        }

        pM = instance.position;
        side = TrigFunc.side(pA, pB, pM);
        // console.log("side="+side);
        return side;

      }
    },

    //checks for intersection and returns the first path found
    checkIntersection: function() {
      // console.log("num of instances to check"+this.instance_literals.length);
      for (var i = 1; i < this.instance_literals.length; i++) {
        var instance_literal = this.instance_literals[i];
        //   console.log("registering at"+i);
        var paths = paper.project.activeLayer.children;
        //console.log("paths to check:"+paths.length);
        for (var j = 0; j < paths.length; j++) {

          if (paths[j].visible && !this.containsPath(paths[j])) {
            if (paths[j].nodeParent.nodeParent === this.nodeParent && this.nodeParent.type === 'behavior') {
             // console.log('do nothing');
            } else {
              // console.log("checking at:"+j);
              //console.log("checking instance at"+i);
              var ints = paths[j].getIntersections(instance_literal);
              //console.log("intersections:");
              // console.log(intersections);
              if (ints.length > 0) {
               // console.log('intersection found');
                return paths[j];
              }
            }
          }

        }
        /* if(intersection!=null){
          return intersection'
          
        }*/

      }
      return null;
    }



  });

  return PathNode;

});