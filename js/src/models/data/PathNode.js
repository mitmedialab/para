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
    name: 'none',


    constructor: function() {

      GeometryNode.apply(this, arguments);
    },


    initialize: function() {

    },

    getLiteral: function() {
      return this.instance_literals[0];

    },



    /*called when drawing of the path is complete. 
     * Removes the path and creates one instance
     * in original path location*/
    createInstanceFromPath: function(path) {
      var instance = this.createInstance();
      var position = {x:path.bounds.topLeft.x, y:path.bounds.topLeft.y};
      var width = path.bounds.width;
      var height = path.bounds.height;  
      instance.update({position:position,
        width: width,
        height: height,
        strokeWidth:path.strokeWidth,
        strokeColor:path.strokeColor,
        fillColor:path.fillColor, 
        closed:path.closed});
      path.position.x =0;
      path.position.y =0;
     

      path.translate(path.bounds.width/2,path.bounds.height/2);
      this.instance_literals.push(path);
      path.instanceParentIndex = this.instances.length - 1;
      path.instanceIndex = this.instance_literals.length - 1;
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
      this.clearScaffolds();
      for (var j = 1; j < this.instance_literals.length; j++) {
        this.instance_literals[j].remove();

      }
      this.instance_literals.splice(1, this.instance_literals.length);

    },

    //called when path data is modified 
    updatePath: function(path) {
      var newPath = path.clone();
      try {
        newPath.instanceParentIndex = path.instanceParentIndex;
    
        var removedItem = this.instance_literals.shift();
        var removedBounds = removedItem.bounds;
        
        var ruP = removedBounds.topLeft;
        var newBounds = newPath.bounds;
        var nuP = newBounds.topLeft;
        
        var instance_pos = this.instances[path.instanceParentIndex].position;
        var diff = TrigFunc.subtract({x:nuP.x,y:nuP.y},instance_pos);
       
       newPath.position.x = 0;
       newPath.position.y =0;
       newPath.translate(newPath.bounds.width/2,newPath.bounds.height/2);
   
        //newPath.rotate(0 - this.instances[removedItem.instanceParentIndex].rotation);
        //newPath.matrix.reset();

        this.instances[removedItem.instanceParentIndex].increment({position:diff});
        for(var i=0;i<this.instances.length;i++){
          this.instances[i].update({width:newPath.bounds.width,height:newPath.bounds.height});
        }

        removedItem.remove();
        removedItem = null;
        this.instance_literals.unshift(newPath);
      } catch (err) {
        newPath.remove();
        console.log('error in update path' + err);
      }

    },


    /* renders instances of the original path
     * render data contains an array of objects containing
     * position, scale and rotation data for each instance
     * copies the render signature from the data and concats it with the
     *index of the instance used to render the path
     */
    render: function(data, currentNode) {
      var path_literal = this.getLiteral();
     // console.log("render: "+this.type);
      if (data) {
        for (var k = 0; k < this.instances.length; k++) {

          for (var d = 0; d < data.length; d++) {
            var instance_literal = path_literal.clone();
            instance_literal.nodeParent = this;
            instance_literal.instanceParentIndex = k;
            instance_literal.data.renderSignature = data[d].renderSignature.slice(0);
            instance_literal.data.renderSignature.push(k);
            var nInstance = this.instances[k];
            nInstance.render(data[d]);
            instance_literal.transform(nInstance.matrix);
            instance_literal.strokeColor = this.instances[k].strokeColor;
            if (instance_literal.closed) {
              instance_literal.fillColor = this.instances[k].fillColor;
            }
            instance_literal.strokeWidth = this.instances[k].strokeWidth + data[d].strokeWidth;
            if (instance_literal.strokeWidth === 0) {
              instance_literal.strokeWidth = 1;
            }

            if (this.nodeParent == currentNode) {
              instance_literal.selected = this.instances[k].selected;
          
              if (this.instances[k].anchor) {
                if (k === 0) {
                  instance_literal.strokeColor = '#83E779';
                } else {
                  instance_literal.strokeColor = '#FF0000';

                }
                if (instance_literal.strokeWidth < 3) {
                  instance_literal.strokeWidth = 3;
                }
              }
            } else {
              instance_literal.selected = data[d].selected;
              if (data[d].anchor) {
                instance_literal.strokeColor = '#83E779';
                if (instance_literal.strokeWidth < 3) {
                  instance_literal.strokeWidth = 3;
                }
              }
            }


            instance_literal.visible = this.instances[k].visible;

           /* if (this.nodeParent != currentNode && this.follow) {
              instance_literal.visible=false;
            }*/
            this.instance_literals.push(instance_literal);
            instance_literal.instanceIndex = this.instance_literals.length - 1;
            //console.log('path matrix');
            //console.log(instance_literal.matrix);
            /*var dot = new paper.Path.Circle(this.instances[k].position.x+data[d].position.x,this.instances[k].position.y+data[d].position.y,5);
                dot.fillColor = 'green';
                this.scaffolds.push(dot);*/
          }
        }
      } else {
        for (var z = 0; z < this.instances.length; z++) {

          var instance_literal = path_literal.clone();
          instance_literal.nodeParent = this;
          instance_literal.instanceParentIndex = z;

        var nInstance = this.instances[z];
          nInstance.render({});
          instance_literal.transform(nInstance.matrix);
          instance_literal.rotate(this.instances[z].rotation);
          instance_literal.scale(this.instances[z].scale);
          instance_literal.visible = this.instances[z].visible;
          instance_literal.data.renderSignature = [];
          instance_literal.data.renderSignature.push(z);
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
      var sIndexes = [];

      if (this.containsPath(path)) {

        for (var i = 1; i < this.instance_literals.length; i++) {
          var compareSig = this.instance_literals[i].data.renderSignature.slice(0, index + 1);
          compareSig = compareSig.join();
         
          if (compareSig === value) {
            var last = this.instance_literals[i].data.renderSignature.length - 1;
            var iIndex = this.instance_literals[i].data.renderSignature[last];
            this.instances[iIndex].selected = true;
            var copySig = this.instance_literals[i].data.renderSignature.slice(0);

            copySig.pop();
            if (copySig.length > 0) {
              sIndexes.push(copySig);
            }
     
          }

        }
      }
      return sIndexes;
    },

    deleteNode: function() {
      for (var i = this.children.length - 1; i > -1; i--) {
        this.children[i].deleteNode();
        this.removeChildAt(i);
      }
      for (var i = 0; i < this.instance_literals.length; i++) {
        this.instance_literals[i].remove();
        this.instance_literals[i] = null;
      }
      this.nodeParent.removeChildNode(this);
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
        return side;

      }
    },

    //checks for intersection and returns the first path found
    checkIntersection: function() {
      for (var i = 1; i < this.instance_literals.length; i++) {
        var instance_literal = this.instance_literals[i];
        var paths = paper.project.activeLayer.children;
        for (var j = 0; j < paths.length; j++) {

          if (paths[j].visible && !this.containsPath(paths[j])) {
            if (paths[j].nodeParent) {
              if (paths[j].nodeParent.nodeParent === this.nodeParent && this.nodeParent.type === 'behavior') {
              } else {
                var ints = paths[j].getIntersections(instance_literal);
                if (ints.length > 0) {
                  return paths[j];
                }
              }
            }

          }
        }
      }
      return null;
    }



  });

  return PathNode;

});