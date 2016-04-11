/*SelectToolModel.js
 *base model class for all direct manipulation tool models*/

define([
  'underscore',
  'paper',
  'backbone',
  'models/tools/BaseToolModel',
  'models/data/properties/PPoint'



], function(_, paper, Backbone, BaseToolModel, PPoint) {
  var segments = [];
  var literal;
  var handle;
  var segmentMod = false;
  var copyReset = true;
  var modified = false;
  //keeps track of when a copy was released to set correct position data for the new instance
  var copyInitialized = false;
  var startPoint, startDist, startWidth, startHeight = null;
  var startScalingDelta = null;
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
    tolerance: 0,
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
          startDist = event.point.subtract(literal.parent.localToGlobal(literal.position));

          startWidth = literal.bounds.width;
          startHeight = literal.bounds.height;
          startScalingDelta = literal.data.instance.getValueFor('scalingDelta');

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
     
      var hitResult = paper.project.hitTest(event.point, hitOptions);
       if (!event.modifiers.shift) {
        if (!noDeselect) {
          this.trigger('deselectAll');
        }
      }
      // make sure that a true instance is selected
      if (hitResult && hitResult.item.data.instance) {

        var path = hitResult.item;

        literal = path;
        instance = literal.data.instance;
        if(instance.nodeParent && instance.nodeParent.get('name')==='group' && !instance.nodeParent.get('open')){
          instance = instance.nodeParent;
          literal = instance.get('geom');
        }
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
        modified = true;
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
        this.trigger('addCopy');
      }

      var data = {};
      data.translationDelta = {
        operator: 'add',
        x: event.delta.x,
        y: event.delta.y
      };
      this.trigger('geometryModified', data, event.modifiers);
    },

    dSelectDrag: function(event) {
      var data = {};
      data.translationDelta = {
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
        if(angle>0 && dAngle<0){
          dAngle = Math.abs(dAngle);
        }
        else if(angle<0 && dAngle>0){
          dAngle = 0-dAngle;
        }
        var data = {};
        console.log('rotationDelta=',angle,dAngle,dAngle - angle);
        data.rotationDelta = {
          v: dAngle - angle,
          operator: 'add'
        };
        this.trigger('geometryModified', data, event.modifiers);

      }
    },

    scaleDrag: function(event) {
      var posPoint = this.getRelativePoint();
      if (posPoint) {

        var rotationDelta = literal.data.instance.getValueFor('rotationDelta');
        var xAxis = { x: Math.cos(rotationDelta * (Math.PI / 180.0)), y: Math.sin(rotationDelta * (Math.PI / 180.0)) };
        var yAxis = { x: Math.sin(rotationDelta * (Math.PI / 180.0)), y: -Math.cos(rotationDelta * (Math.PI / 180.0)) };

        var clickPos = startDist; //position of clicked point, relative to center
        var dragPos = event.point.subtract(posPoint); //position of the point dragged to (relative to center)
        var centerDist = clickPos.length; //distance from center of shape to clicked point
        const SCALING_FACTOR = 1;

        var dragPosProjX = dragPos.project(xAxis);
        var dragPosProjY = dragPos.project(yAxis);

        var signedX = dragPosProjX.dot(clickPos) > 0.0 ? +1.0 : -1.0;
        var signedY = dragPosProjY.dot(clickPos) > 0.0 ? +1.0 : -1.0;

        var scaleX = dragPosProjX.length / Math.abs(clickPos.dot(xAxis)) * SCALING_FACTOR * signedX;
        var scaleY = dragPosProjY.length / Math.abs(clickPos.dot(yAxis)) * SCALING_FACTOR * signedY;



        if (event.modifiers.shift) {
          scaleY = scaleX;
        }

        var data = {};
        data.scalingDelta = {
          x: scaleX * startScalingDelta.x,
          y: scaleY * startScalingDelta.y,
          operator: 'set'
        };
        this.trigger('geometryModified', data, event.modifiers);
      }
    },

    getRelativePoint: function() {

      if (literal) {

        return literal.parent.localToGlobal(literal.position);
      }
      return null;
    },

    //mouse up event
    mouseUp: function(event) {
      if(modified){
        this.trigger('modificationEnded');
      }
      
      if (copyInitialized) {
        copyInitialized = false;
      }

      literal = null;
      segments = [];
      handle = null;
      copyReset = true;

      modified = false;
      
      startScalingDelta = null;
    },



  });

  return SelectToolModel;

});