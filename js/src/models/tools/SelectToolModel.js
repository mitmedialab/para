/*SelectToolModel.js
 *base model class for all direct manipulation tool models*/

define([
  'underscore',
  'paper',
  'backbone',
  'models/tools/BaseToolModel',
  'utils/PPoint'



], function(_, paper, Backbone, BaseToolModel, PPoint) {
  var segments = [];
  var literal;
  var handle;
  var segmentMod = false;
  var copyReset = true;
  //keeps track of when a copy was released to set correct position data for the new instance
  var copyInitialized = false;
  var startPoint, startDist, startWidth, startHeight = null;
  var dHitOptions = {
    segments: true,
    curves: false,
    handles: true,
    fill: false,
    tolerance: 5,

  };

  var hitOptions = {
    stroke: true,
    fill: true,
    bounds: true,
    center: true,
    tolerance: 2
  };

  var SelectToolModel = BaseToolModel.extend({
    defaults: _.extend({}, BaseToolModel.prototype.defaults, {
      mode: 'select'
    }),

    initialize: function() {
      BaseToolModel.prototype.initialize.apply(this, arguments);
    },



    /*mousedown event
     */
    mouseDown: function(event) {
      switch (this.get('mode')) {
        case 'select':
          this.selectDown(event);
          break;
        case 'dselect':
          this.dSelectDown(event);
          break;
        case 'rotate':
        case 'scale':
          this.rotateDown(event);
          startDist = event.point.subtract(literal.position);

          startWidth = literal.bounds.width;
          startHeight = literal.bounds.height;

          break;
      }
    },

    rotateDown: function(event) {
      if (event.modifiers.option) {
        this.selectDown(event, true);
      } else {
        this.selectDown(event);
      }
    },


    selectDown: function(event, noDeselect) {
      //automaticall deselect all on mousedown if shift modifier is not enabled
      var instance = null;
      var modifier = null;
      if (!event.modifiers.shift) {
        if (!noDeselect) {
          this.trigger('deselectAll');
        }
      }
      var hitResult = paper.project.hitTest(event.point, hitOptions);

      // make sure that a true instance is selected
      if (hitResult && hitResult.item.data.instance) {

        var path = hitResult.item;

        literal = path;
        instance = literal.data.instance;


        modifier = event.modifiers.command;
        this.trigger('geometrySelected', instance, null, modifier);


      }



    },


    dSelectDown: function(event, noDeselect) {
      //automaticall deselect all on mousedown if shift modifier is not enabled
      if (!event.modifiers.shift) {
        if (!noDeselect) {
          this.trigger('deselectAll');
        }
      }

      var hitResult = paper.project.hitTest(event.point, dHitOptions);
      var instance, points;
      if (hitResult) {
        literal = hitResult.item;
        instance = literal.data.instance;
        if (instance) {
          if (hitResult.type == 'segment') {
            hitResult.segment.fullySelected = true;
            segments.push({
              index: hitResult.segment.index,
              type: hitResult.type
            });
          } else if (hitResult.type == 'handle-in' || hitResult.type == 'handle-out') {
            handle = hitResult.type;
            segments.push({
              index: hitResult.segment.index,
              type: hitResult.type
            });
          } else if (hitResult.type == 'curve') {
            segments.push({
              index: hitResult.location._segment1.index,
              type: hitResult.type
            });
            segments.push({
              index: hitResult.location._segment2.index,
              type: hitResult.type
            });
          } else if (hitResult.type == 'fill') {
            for (var i = 0; i < literal.segments.length; i++) {
              segments.push({
                index: literal.segments[i].index,
                type: 'segment'
              });
            }
          }
       
          this.trigger('geometrySelected', instance, segments, null);
        }

      }


    },



    //mouse drag event
    mouseDrag: function(event) {
      if (literal && literal.data.instance) {
        switch (this.get('mode')) {
          case 'select':
            this.selectDrag(event);
            break;
          case 'dselect':
            this.dSelectDrag(event);
            break;
          case 'rotate':
            this.rotateDrag(event);
            break;
          case 'scale':
            this.scaleDrag(event);
            break;
        }
      }
    },

    selectDrag: function(event) {
      if (event.modifiers.option && copyReset) {
        copyReset = false;
        copyInitialized = true;
        this.trigger('addInstance');
      }

      var data = {};
      data.translation_delta = {
        operator: 'add',
        x: event.delta.x,
        y: event.delta.y
      };
      console.log('select drag data',data);
      this.trigger('geometryModified', data, event.modifiers);
    },

    dSelectDrag: function(event) {
      var data = {};
      data.translation_delta = {
        operator: 'add',
        x: event.delta.x,
        y: event.delta.y
      };

      this.trigger('segmentModified', data, handle, event.modifiers);
    },

    rotateDrag: function(event) {
      var posPoint = this.getRelativePoint();
      if (posPoint) {
        var angle = event.lastPoint.subtract(posPoint).angle;
        var dAngle = event.point.subtract(posPoint).angle;
        var data = {};
        data.rotation_delta = {
          val: dAngle - angle,
          operator: 'add'
        };
        console.log('rotate data',data);
        this.trigger('geometryModified', data, event.modifiers);

      }
    },

    scaleDrag: function(event) {
      var scaleDelta = literal.data.instance.getValueFor('scaling_delta');
      var posPoint = this.getRelativePoint();
      if (posPoint) {

        var clickPos = startDist; //position of clicked point, relative to center
        var dragPos = event.point.subtract(posPoint); //position of the point dragged to (relative to center)
        var draggedVect = dragPos; //vector of dragged pt movement
        var signedX = clickPos.x / Math.abs(clickPos.x); //either -1 or 1 depending on what quadrant of the shape the user clicks
        var signedY = clickPos.y / Math.abs(clickPos.y); //x = -1 in Q2 and Q3, x = -1 in Q1 and Q2
        var centerDist = clickPos.length; //distance from center of shape to clicked point
        const SCALING_FACTOR = 1;
        var scaleX = 1 + (draggedVect.x * signedX * SCALING_FACTOR) / centerDist;
        var scaleY = 1 + (draggedVect.y * signedY * SCALING_FACTOR) / centerDist;

        if (event.modifiers.shift) {
          scaleY = scaleDelta.y * scaleX / scaleDelta.x;
          scaleX = scaleDelta.x * scaleX / scaleDelta.x;
        }

        // vertical and horiz snapping feature, needs work
        // else {
        //   console.log('draggedVect.y ' + draggedVect.y);
        //   console.log('draggedVect.x ' + draggedVect.x);
        //   if (Math.abs(draggedVect.y/draggedVect.x) > 20) {
        //     console.log('y threshold');
        //     scaleX = 1;
        //   }
        //   else if (Math.abs(draggedVect.x/draggedVect.y) > 20) {
        //     console.log('x threshold');
        //     scaleY = 1;
        //   }
        // }

        var data = {};
        data.scaling_delta = {
          x: scaleX,
          y: scaleY,
          operator: 'set'
        };
        this.trigger('geometryModified', data, event.modifiers);
      }
    },

    getRelativePoint: function() {

      if (literal) {

        return literal.position;
      }
      return null;
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

      if (copyInitialized) {
        copyInitialized = false;
      }

      literal = null;
      segments = [];
      handle = null;
      copyReset = true;

    },



  });

  return SelectToolModel;

});