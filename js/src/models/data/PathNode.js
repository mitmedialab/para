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
  'utils/TrigFunc',
  'models/behaviors/FillBehavior',
  'models/behaviors/CopyBehavior'

], function(_, GeometryNode, Instance, PaperManager, TrigFunc, FillBehavior, CopyBehavior) {
  //drawable paper.js path object that is stored in the pathnode
  var paper = PaperManager.getPaperInstance();
  var PathNode = GeometryNode.extend({

    type: 'path',
    name: 'none',


    constructor: function() {

      GeometryNode.apply(this, arguments);
     

    },


    initialize: function(data) {
      if (data) {
        var path = new paper.Path();
      
        var lInstances = data.instance_literals;
       for (var j = 0; j < lInstances.length; j++) {
        var newLiteral = new paper.Path();
        newLiteral.importJSON(lInstances[j]);
       this.instance_literals.push(newLiteral);
       console.log("adding path",j,newLiteral);
      }
        GeometryNode.prototype.initialize.apply(this, arguments);
      }


      var fillBehavior = new FillBehavior();
      this.addBehavior(fillBehavior, ['update']);
      /*var copyBehavior = new CopyBehavior();
      this.addBehavior(copyBehavior, ['update'], 'last');
      this.setCopyNum(1);*/

    },


    exportJSON: function(data) {

      var jdata;
      if (!data) {
        this.set({
          type: this.type,
          name: this.name
        });
        jdata = this.toJSON();
      } else {
        jdata = data;
      }

      return GeometryNode.prototype.exportJSON.apply(this, [jdata]);
    },

    /*called when drawing of the path is complete. 
     * Removes the path and creates one instance
     * in original path location*/
    createInstanceFromPath: function(path) {
      var instance = this.createInstance();
      var delta = {
        x: path.bounds.center.x,
        y: path.bounds.center.y
      };
      var rotation = {
        angle: 0
      };
      var width = path.bounds.width;
      var height = path.bounds.height;
      instance.update({
        delta: delta,
        rotation: rotation,
        width: width,
        height: height,
        strokeWidth: path.strokeWidth,
        strokeColor: path.strokeColor,
        fillColor: path.fillColor,
        closed: path.closed
      });
      path.position.x = 0;
      path.position.y = 0;

      path.data.tmatrix = instance.matrix.clone();
      //path.translate(path.bounds.width / 2, path.bounds.height / 2);

      path.instanceParentIndex = this.instances.length - 1;
      path.instanceIndex = this.instance_literals.length - 1;

      path.nodeParent = this;
      this.getUpperLeft();
      this.instance_literals.push(path);
      return instance;

    },

    bringToFront: function() {
      for (var i = 0; i < this.instance_literals.length; i++) {
        this.instance_literals[i].bringToFront();
      }
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
    resetObjects: function() {

      for (var j = 0; j < this.instance_literals.length; j++) {
        if (!this.instance_literals[j].reset) {
          var matrix = this.instance_literals[j].data.tmatrix; //this.instances[this.instance_literals[j].instanceParentIndex].matrix;
          var imatrix = matrix.inverted();

          this.instance_literals[j].transform(imatrix);
          this.instance_literals[j].reset = true;
        }
      }
      //this.instance_literals = [];
      this.clearScaffolds();

    },

    clearObjects: function() {
      for (var j = 0; j < this.instance_literals.length; j++) {
        this.instance_literals[j].remove();
      }
      //this.instance_literals = [];
      this.clearScaffolds();
    },



    cloneLiteral: function(literal) {
      var newLiteral;
      if (!literal) {
        literal = this.instance_literals[0];
      } 
       newLiteral = literal.clone();
        var matrix = literal.data.tmatrix.clone();
        var imatrix = matrix.inverted();
        newLiteral.transform(imatrix);
      newLiteral.reset = true;
      return newLiteral;

    },
    //called when path points are modified 
    updatePath: function(index, literalIndex, delta, handle) {
      console.log("update path");
      var interfaceinstance = this.instance_literals[literalIndex].clone();
      var selSegment = interfaceinstance.segments[index];
    var matrix = this.instance_literals[literalIndex].data.tmatrix;
      var imatrix = matrix.inverted();
      var pointDiff;
      var posDiffX;
      var posDiffY;
      if (handle === null) {

        
        selSegment.point = selSegment.point.add(delta);
         interfaceinstance.transform(imatrix);
            this.resetObjects();

         pointDiff = interfaceinstance.segments[index].point.subtract(this.instance_literals[literalIndex].segments[index].point);
      } else {
        if (handle === 'handle-in') {

          selSegment.handleIn = selSegment.handleIn.add(delta);
          selSegment.handleOut = selSegment.handleOut.subtract(delta);
          interfaceinstance.transform(imatrix);
            this.resetObjects();

          pointDiff = interfaceinstance.segments[index].handleIn.subtract(this.instance_literals[literalIndex].segments[index].handleIn);


        } else {
          selSegment.handleOut = selSegment.handleOut.add(delta);
          selSegment.handleIn = selSegment.handleIn.subtract(delta);
          this.resetObjects();

          interfaceinstance.transform(imatrix);
         pointDiff = interfaceinstance.segments[index].handleOut.subtract(this.instance_literals[literalIndex].segments[index].handleOut);


        }
      }
    


     
      //update all paths
      var posDiff;
      for (var j = 0; j < this.instance_literals.length; j++) {
          var sseg = this.instance_literals[j].segments[index];
          if (handle === null) {
            sseg.point = sseg.point.add(pointDiff);
          } else {
            if (handle === 'handle-in') {

              sseg.handleIn = sseg.handleIn.add(pointDiff);
              sseg.handleOut = sseg.handleOut.subtract(pointDiff);

            } else {
              sseg.handleOut = sseg.handleOut.add(pointDiff);
              sseg.handleIn = sseg.handleIn.subtract(pointDiff);

            }
          }
        
        posDiff = this.instance_literals[j].position.clone();
        this.instance_literals[j].position.x =0;
        this.instance_literals[j].position.y=0;
        console.log("posDiff=",posDiff);
      }
      console.log("========================");

      for (var i = 0; i < this.instances.length; i++) {
        var rotation = this.instances[i].matrix.rotation;
        var pd2= posDiff.rotate(rotation,new paper.Point(0,0));
        this.instances[i].update({
          width: interfaceinstance.bounds.width,
          height: interfaceinstance.bounds.height
        });
        this.instances[i].increment({
          delta: {x:pd2.x,y:pd2.y}
        });
      }

       interfaceinstance.remove();

      //swap out old master for new
    },


    /* renders instances of the original path
     * render data contains an array of objects containing
     * position, scale and rotation data for each instance
     * copies the render signature from the data and concats it with the
     *index of the instance used to render the path
     */
    render: function(data, currentNode, clutch) {
      var revised_literals = [];
      var lastLiteral = null;
      //console.log("\n======rendering path=========");
      for (var d = 0; d < data.length; d++) {
        for (var k = 0; k < this.instances.length; k++) {


          this.instances[k].instanceParentIndex = d;
          var instance_literal;
          if (this.instance_literals.length > 0) {
            instance_literal = this.instance_literals.shift();
          } else {
            instance_literal = this.cloneLiteral(lastLiteral);

          }
          instance_literal.nodeParent = this;
          instance_literal.instanceParentIndex = k;
          instance_literal.data.renderSignature = data[d].renderSignature.slice(0);
          instance_literal.data.renderSignature.push(k);
          var nInstance = this.instances[k];
          nInstance.render(data[d]);

          instance_literal = instance_literal.transform(nInstance.matrix);
          instance_literal.reset = false;
          instance_literal.data.tmatrix = nInstance.matrix.clone();
          //instance_literal.data.tmatrix.set(nInstance.matrix.a,nInstance.matrix.c,nInstance.matrix.b,nInstance.matrix.d,nInstance.matrix.tx,nInstance.matrix.ty);

          if (instance_literal.closed) {
            instance_literal.fillColor = this.instances[k].fillColor;
          }
          instance_literal.strokeWidth = this.instances[k].strokeWidth + data[d].strokeWidth;
          if (instance_literal.strokeWidth === 0) {
            instance_literal.strokeWidth = 1;
          }

          if (!data[d].fillColor) {
            instance_literal.fillColor = nInstance.fillColor;
          } else {
            instance_literal.fillColor = data[d].fillColor;
          }
          if (!data[d].strokeColor) {
            instance_literal.strokeColor = nInstance.strokeColor;
          } else {
            instance_literal.strokeColor = data[d].strokeColor;
          }

          instance_literal.visible = this.instances[k].visible;

          if (this.nodeParent == currentNode) {
            instance_literal.selected = this.instances[k].selected;
            if (instance_literal.selected) {
              instance_literal.fullySelected = true;
            }
            if (this.instances[k].anchor) {
              if (k === 0) {
                instance_literal.strokeColor = '#16a2a6';
                instance_literal.fillColor = '#16a2a6';

              } else {
                instance_literal.strokeColor = '#f2682a';
                instance_literal.fillColor = '#f2682a';

              }
              if (instance_literal.strokeWidth < 3) {
                instance_literal.strokeWidth = 3;
              }
            }
          } else {
            if (this.scaffold) {
              instance_literal.visible = false;
            }
            var descendant = currentNode.descendantOf(this);
            if (!descendant) {
              if (instance_literal.fillColor) {
                instance_literal.fillColor.brightness = instance_literal.fillColor.brightness += 0.5;
                instance_literal.fillColor.saturation = instance_literal.fillColor.saturation -= 0.5;

              }
              if (instance_literal.strokeColor) {
                instance_literal.strokeColor.brightness = instance_literal.strokeColor.brightness += 0.5;
                instance_literal.strokeColor.saturation = instance_literal.strokeColor.saturation -= 0.5;

              }
            }


            instance_literal.selected = data[d].selected;
            if (data[d].anchor) {
              if (d === 0) {
                instance_literal.strokeColor = '#16a2a6';
                instance_literal.fillColor = '#16a2a6';
              } else {
                instance_literal.strokeColor = '#f2682a';
                instance_literal.fillColor = '#f2682a';

              }
              if (instance_literal.strokeWidth < 3) {
                instance_literal.strokeWidth = 3;
              }
            }
          }



          revised_literals.push(instance_literal);
          lastLiteral = instance_literal;
          /*//console.log("length:",revised_literals.length);
            //console.log("user selected =",nInstance.userSelected);
            if(this.instance_literals.length-1=== nInstance.userSelected){
              instance_literal.fillColor = 'red';
            }*/

          instance_literal.instanceIndex = revised_literals.length - 1;
        }
      }


      for (var i = 0; i < this.instance_literals.length; i++) {
        this.instance_literals[i].remove();
      }

      this.instance_literals = revised_literals;

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
      var literalParent = null;
      var exception = -1;

      ////console.log('index',index,'value',value,'currentNode',currentNode==this);

      if (this.containsPath(path)) {

        for (var i = 0; i < this.instance_literals.length; i++) {
          var literalParent = this.instance_literals[i].instanceParentIndex;

          if (this.instance_literals[i] === path) {

            this.instances[literalParent].userSelected = i;
            exception = literalParent;
            ////console.log("found matching path at ", i, "parentIndex=", literalParent);
          } else if (literalParent != exception) {
            ////console.log("removed matching path path ", i, "parentIndex=", literalParent);
            this.instances[literalParent].userSelected = null;
          }

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

    /* placeholder functions for leftOf, rightOf geometric checks */
    instanceSide: function(instance) {

      for (var i = 0; i < this.instances.length; i++) {
        var side, pA, pB, pM;
        if (this.instances[i].closed) {

          pA = {
            x: this.instances[i].delta.x,
            y: 0
          };
          pB = {
            x: this.instances[i].delta.x,
            y: 100
          };


        } else {
          var path_literal = this.getLiteral();

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
      for (var i = 0; i < this.instance_literals.length; i++) {
        var instance_literal = this.instance_literals[i];
        var paths = paper.project.activeLayer.children;
        for (var j = 0; j < paths.length; j++) {

          if (paths[j].visible && !this.containsPath(paths[j])) {
            if (paths[j].nodeParent) {
              if (paths[j].nodeParent.nodeParent === this.nodeParent && this.nodeParent.type === 'behavior') {} else {
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