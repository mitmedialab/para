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
      if(!this.masterPath){
        this.masterPath = null;
      }

    },


    initialize: function(data) {
      if(data){
        console.log("creating path node");
        console.log(data);
        var path = new paper.Path();
        path.importJSON(data.masterPath);
        this.masterPath = path;
        GeometryNode.prototype.initialize.apply(this, arguments);
        console.log(this.getLiteral());

      }

    },

    getLiteral: function() {
      return this.masterPath;

    },

    exportJSON: function(data) {
     
      var jdata;
      if (!data) {
        this.set({
          type: this.type,
          name: this.name
        });
        jdata = this.toJSON();
      }
        else{
            jdata= data;
          }

      jdata.masterPath = this.masterPath.exportJSON();
       console.log(jdata);
      return GeometryNode.prototype.exportJSON.apply(this, [jdata]);
    },

    /*called when drawing of the path is complete. 
     * Removes the path and creates one instance
     * in original path location*/
    createInstanceFromPath: function(path) {
      var instance = this.createInstance();
      var delta = {x:path.bounds.topLeft.x, y:path.bounds.topLeft.y};
      var rotation = {angle:0};
      var width = path.bounds.width;
      var height = path.bounds.height; 
      console.log("width="+width+", height="+height); 
      instance.update({delta:delta,
        rotation: rotation,
        width: width,
        height: height,
        strokeWidth:path.strokeWidth,
        strokeColor:path.strokeColor,
        fillColor:path.fillColor, 
        closed:path.closed});
      path.position.x =0;
      path.position.y =0;


      path.translate(path.bounds.width/2,path.bounds.height/2);
     
     
      this.masterPath =path;
      this.masterPath.visible = false;
      
      path.instanceParentIndex = this.instances.length - 1;
      path.instanceIndex = this.instance_literals.length - 1;
      path.nodeParent = this;
        this.getUpperLeft();
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
    clearObjects: function() {
      
      for (var j = 0; j < this.instance_literals.length; j++) {
        this.instance_literals[j].remove();
        //console.log('clearing instance literal at:'+j)

      }
      this.instance_literals = [];
      GeometryNode.prototype.clearObjects.apply(this, arguments);
    },

    //called when path points are modified 
    updatePath: function(index,delta) {
      var newPath = this.masterPath.clone();

      //update the path
       var selSegment = newPath.segments[index];
      selSegment.point = selSegment.point.add(delta);
    
       var topLeftOld = this.masterPath.bounds.topLeft;
       var topLeftNew = newPath.bounds.topLeft;
       //calcualte differences between old and new positions
       var diff = TrigFunc.subtract({x:topLeftNew.x,y:topLeftNew.y},{x:topLeftOld.x,y:topLeftOld.y});

       //set position to upper left corner
       newPath.position.x = 0+newPath.bounds.width/2;
       newPath.position.y =0+newPath.bounds.height/2;

        for(var i=0;i<this.instances.length;i++){
          this.instances[i].update({width:newPath.bounds.width,height:newPath.bounds.height});
          this.instances[i].increment({delta:diff});
        }

       //swap out old master for new
        this.masterPath.remove();
        this.masterPath = newPath;
        newPath.visible = false;
      

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
            this.instances[k].instanceParentIndex = d;

            var instance_literal = path_literal.clone();
            instance_literal.nodeParent = this;
            instance_literal.instanceParentIndex = k;
            instance_literal.data.renderSignature = data[d].renderSignature.slice(0);
            instance_literal.data.renderSignature.push(k);
            var nInstance = this.instances[k];
            nInstance.render(data[d]);
            instance_literal = instance_literal.transform(nInstance.matrix);
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

          
            this.instance_literals.push(instance_literal);
            instance_literal.instanceIndex = this.instance_literals.length - 1;
          }
        }
      } else {
        for (var z = 0; z < this.instances.length; z++) {

          var instance_literal = path_literal.clone();
          instance_literal.nodeParent = this;
          instance_literal.instanceParentIndex = z;

        var nInstance = this.instances[z];
          nInstance.render({});
          instance_literal = instance_literal.transform(nInstance.matrix);
          instance_literal.visible = this.instances[z].visible;
          instance_literal.data.renderSignature = [];
          instance_literal.data.renderSignature.push(z);
          this.instance_literals.push(instance_literal);
          instance_literal.instanceIndex = this.instance_literals.length - 1;
        }
      }

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

        for (var i = 0; i < this.instance_literals.length; i++) {
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