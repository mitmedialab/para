/*SelectToolModel.js
 *base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel',
  'models/data/PathNode',
  'models/PaperManager'

], function(_, Backbone, BaseToolModel, PathNode, PaperManager) {
  var segment, instanceIndex, handle;
  var paper = PaperManager.getPaperInstance();


  var hitOptions = {
    segments: true,
    stroke: true,
    handles: true,
    fill: true,
    tolerance: 5
  };

  var SelectToolModel = BaseToolModel.extend({
    defaults: _.extend({}, BaseToolModel.prototype.defaults, {}),

    initialize: function() {
      paper = PaperManager.getPaperInstance();
      this.selectedNodes = [];
      this.currentPaths = [];
      this.segmentMod = false;
    },

    /*mousedown event
     */
    mouseDown: function(event) {

      if (!event.modifiers.shift) {
        if (this.currentNode) {
          this.currentNode.deselectAll();

        }
        this.currentPaths = [];
        this.currentNode = null;
        segment = null;
        handle = null;
        this.selectedNodes = [];
      }

      segment = null;

      var hitResult = paper.project.hitTest(event.point, hitOptions);
     
      //deselect everything
      var children = paper.project.activeLayer.children;
      for (var i = 0; i < children.length; i++) {
        children[i].selected = false;
      }

      if (hitResult) {

        var path = hitResult.item;
        instanceIndex = path.instanceIndex;
        console.log(hitResult);
        if (hitResult.type == 'segment') {

          segment = hitResult.segment.index;


        }
        else if(hitResult.type =='handle-in'|| hitResult.type =='handle-out'){
          handle= hitResult.type;
          segment = hitResult.segment.index;
        }

        //this sets currentNode depending on current selection level in tree
        this.trigger('nodeSelected', path);

        //checks to make sure path is within current node
        if (this.selectedNodes.length > 0) {
          if (this.currentNode.containsPath(path)) {
            if (this.currentPaths.indexOf(path) == -1) {
              this.currentPaths.push(path);
            }
            this.trigger('setSelection', path);

            if (event.modifiers.option) {
              this.trigger('optionClick', this.selectedNodes[this.selectedNodes.length - 1]);
            }

          }
        }
        this.trigger('rootRender');

      }


    },

    dblClick: function(event) {
      if (this.currentPaths.length > 0) {
        this.trigger('moveDownNode', this.currentPaths[this.currentPaths.length - 1]);
      } else {
        this.trigger('moveUpNode');
      }
    },


    //mouse up event
    mouseUp: function(event) {
      if (event.modifiers.shift) {
        for (var i = 0; i < this.selectedNodes.length; i++) {
          var intersection = this.selectedNodes[i].checkIntersection();
          if (intersection) {
            this.event_bus.trigger('newBehavior', [intersection.nodeParent, this.selectedNodes[i]], 'followpath');
          }
        }
      }
    },

    //mouse drag event
    mouseDrag: function(event) {
      if (this.currentPaths.length > 0) {
        if (segment !== null) {
          if (this.currentNode) {
            var selPath = this.selectedNodes[this.selectedNodes.length - 1].instance_literals[instanceIndex];
            if (selPath) {
              var selSegment = selPath.segments[segment];
              //selSegment.point = selSegment.point.add(event.delta);
              selPath.nodeParent.updatePath(segment,event.delta,handle);
              this.trigger('rootUpdate');
              this.trigger('rootRender');
            }
          }


        } else {
          if (this.currentNode) {

            for (var i = 0; i < this.selectedNodes.length; i++) {
              this.selectedNodes[i].updateSelected([{
               delta: {
                  x: event.delta.x,
                  y: event.delta.y
                },
                relative: event.point
              }]);
            }
            this.trigger('rootUpdate');
            this.trigger('rootRender');

          }


        }
      }
    },

    //mouse move event
    mouseMove: function(event) {

    }



  });

  return SelectToolModel;

});