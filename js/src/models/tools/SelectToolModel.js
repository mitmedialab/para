/*SelectToolModel.js
 *base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel',
  'models/data/PathNode',
  'models/PaperManager'

], function(_, Backbone, BaseToolModel, PathNode, PaperManager) {
  var segment, paper;

  var hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 5
  };

  var SelectToolModel = BaseToolModel.extend({
    defaults: _.extend({}, BaseToolModel.prototype.defaults, {}),

    initialize: function() {
      paper = PaperManager.getPaperInstance();
      this.path = null;
    },

    /*mousedown event- checks to see if current path has been initialized-
     *if it has not, create a new one and trigger a shapeAdded event
     */
    mouseDown: function(event) {
      var paper = PaperManager.getPaperInstance();
      segment = this.path = null;
      var hitResult = paper.project.hitTest(event.point, hitOptions);

      if (event.modifiers.shift) {
        if (hitResult.type == 'segment') {
          hitResult.segment.remove();
        }
        return;
      }

      if (hitResult) {
        this.path = hitResult.item;
        this.trigger('shapeSelected', this.path);
        if (hitResult.type == 'segment') {
          segment = hitResult.segment;
        } else if (hitResult.type == 'stroke') {
          var location = hitResult.location;
          //segment = path.insert(location.index + 1, event.point);
          //path.smooth();
        }
        //hitResult.item.bringToFront();
      }

    },

    //mouse up event
    mouseUp: function(event) {
      console.log("tool mouse up");
      if (this.path) {

        this.path.fire('mouseup', event);

      }
    },

    //mouse drag event
    mouseDrag: function(event) {
      // console.log("tool mouse drag");
      if (segment) {
        console.log("dragging segment");
        segment.point = segment.point.add(event.delta);

        //path.smooth();
      } else if (this.path) {
        console.log("dragging path");
        this.path.position = this.path.position.add(event.delta);
      }
    },

    //mouse move event
    mouseMove: function(event) {
      // console.log("tool mouse move");
      var hitResult = paper.project.hitTest(event.point, hitOptions);
      paper.project.activeLayer.selected = false;
      if (hitResult && hitResult.item) {
        hitResult.item.selected = true;

      }

    }



  });

  return SelectToolModel;

});