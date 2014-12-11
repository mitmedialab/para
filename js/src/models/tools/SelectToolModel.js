/*SelectToolModel.js
 *base model class for all direct manipulation tool models*/

define([
  'underscore',
  'paper',
  'backbone',
  'models/tools/BaseToolModel',
  'utils/PPoint'



], function(_, paper, Backbone, BaseToolModel, PPoint) {
  var segment, handle;
  var moved = null;
  var segmentMod = false;
  var copyReset = true;
  var hitOptions = {
    segments: true,
    stroke: true,
    handles: true,
    fill: true,
    tolerance: 2
  };

  var SelectToolModel = BaseToolModel.extend({
    defaults: _.extend({}, BaseToolModel.prototype.defaults, {
      selected_shapes: null,
      mode: 'proto_node'
    }),

    initialize: function() {
      BaseToolModel.prototype.initialize.apply(this, arguments);
      this.set('selected_shapes', []);
      //this.on('change:literals',this.triggerChange);

    },


    deselectAll: function() {
      var selected_shapes = this.get('selected_shapes');
      for (var i = 0; i < selected_shapes.length; i++) {
        selected_shapes[i].set('selected', false);

      }
      this.set('selected_shapes', []);
      this.set('literals', []);
    },

    addSelectedShape: function(instance) {
      var selected_shapes = this.get('selected_shapes');
      if (!_.contains(selected_shapes, instance)) {
        instance.set('selected', true);
        //instance.incrementDelta({},false, true);
        selected_shapes.push(instance);
        this.set('selected_shapes', selected_shapes);
      }
    },

    getLastSelected: function(){
        var selected_shapes = this.get('selected_shapes');
        if(selected_shapes.length>0){
          return selected_shapes[selected_shapes.length-1];
        }
        return null;
    },

    /*mousedown event
     */
    mouseDown: function(event) {
      switch (this.get('mode')) {
        case 'proto_node':
          this.selectDown(event);
          break;
        case 'rotation_node':
          this.rotateDown(event);
          break;
      }
    },

    rotateDown: function(event) {
      if (event.modifiers.option) {
        this.selectDown(event, true);

        this.trigger('modifyInheritance', 'rotation_node');
      } else {
        this.selectDown(event);
      }
    },


    selectDown: function(event, noDeselect) {
      segment = null;
      //automaticall deselect all on mousedown if shift modifier is not enabled
      if (!event.modifiers.shift) {
        if (!noDeselect) {
          this.deselectAll();
        }
      }

      segment = null;
      handle = null;
      moved = null;

      var hitResult = paper.project.hitTest(event.point, hitOptions);

      if (hitResult) {

        var path = hitResult.item;

        if (hitResult.type == 'segment') {
          segment = hitResult.segment.index;
          segment.fullySelected = true;
        } else if (hitResult.type == 'handle-in' || hitResult.type == 'handle-out') {
          handle = hitResult.type;
          segment = hitResult.segment.index;
        }

        var literals = this.get('literals');
        literals.push(path);
        this.set('literals', literals);

      }

      this.trigger('geometrySelected');


    },

    triggerChange: function() {
      this.trigger('geometrySelected');

    },


    //mouse drag event
    mouseDrag: function(event) {
      switch (this.get('mode')) {
        case 'proto_node':
          this.selectDrag(event);
          break;
        case 'rotation_node':
          this.rotateDrag(event);
          break;
      }
    },

    selectDrag: function(event) {
      if (event.modifiers.option && copyReset) {
        copyReset = false;

        this.trigger('geometryCopied');
      }

      if (event.modifiers.shift && copyReset) {
        copyReset = false;

        this.trigger('geometryDeepCopied');
      }

      var data = {};
      data.translation_delta = new PPoint(event.delta.x, event.delta.y);
      if (segment != null) {
        this.trigger('geometryIncremented', data, event.modifiers.command, segment);
      } else {
        this.trigger('geometryIncremented', data, event.modifiers.command);
      }

    },

    rotateDrag: function(event) {
      var posPoint = this.getRelativePoint();
      if (posPoint) {
        var angle = event.lastPoint.subtract(posPoint).angle;
        var dAngle = event.point.subtract(posPoint).angle;
        var data = {};
        data.rotation_delta = dAngle - angle;
        this.trigger('geometryIncremented', data, event.modifiers.command);

      }

    },

    getRelativePoint: function() {
      var literals = this.get('literals');
      if (literals.length > 0) {
        var firstLiteral = literals[0];
        return firstLiteral.position;
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
      var selected_shapes = this.get('selected_shapes');
      for (var i = 0; i < selected_shapes.length; i++) {
        //selected_shapes[i].incrementDelta({}, false, true);

      }
      copyReset = true;

    },



  });

  return SelectToolModel;

});