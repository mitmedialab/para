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
    curves: true,
    handles: true,
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
      selected_shapes: null,
      selections: null,
      current_sel_index: 0,
      mode: 'select'
    }),

    initialize: function() {
      BaseToolModel.prototype.initialize.apply(this, arguments);
      this.set('selected_shapes', []);
      this.set('selections', []);
      //this.on('change:literals',this.triggerChange);

    },


    deselectAll: function() {
      // TODO: do this across all selections

      var selected_shapes = this.get('selected_shapes');
      for (var i = selected_shapes.length - 1; i >= 0; i--) {
        selected_shapes[i].set('selected', false);
        selected_shapes[i].setSelectionForInheritors(false);
      }
      this.set('selected_shapes', []);
    },

    addSelectedShape: function(data) {
      if (data instanceof Array) {
        for (var i = 0; i < data.length; i++) {
          this.addSingleShape(data[i]);
        }
      } else {
        this.addSingleShape(data);
      }
    },

    addSingleShape: function(instance) {
      var selected_shapes = this.get('selected_shapes');
      if (!_.contains(selected_shapes, instance)) {
        instance.set('selected', true);
        instance.set('sel_palette_index', this.get('current_sel_index'));
        selected_shapes.push(instance);
        this.set('selected_shapes', selected_shapes);
      }
    },

    removeSelectedShape: function(data) {
      if (data instanceof Array) {
        for (var i = 0; i < data.length; i++) {
          this.removeSingleShape(data[i]);
        }
      } else {
        this.removeSingleShape(data);
      }
    },

    removeSingleShape: function(shape) {
      shape.set('selected', false);
      shape.setSelectionForInheritors(false);
      var selected_shapes = this.get('selected_shapes');
      var index = $.inArray(shape, selected_shapes);
      selected_shapes.splice(shape, 1);
    },

    // EXPERIMENTAL
    saveSelection: function() {
      var selections = this.get('selections');
      selections.push(this.get('selected_shapes'));
      this.set('selected_shapes', []);
      this.set('selections', selections);
      var current_sel_index = this.get('current_sel_index');
      current_sel_index += 1;
      this.set('current_sel_index', current_sel_index);
    },

    resetSelections: function() {
      this.deselectAll();
      var selections = this.get('selections');
      for (var i = 0; i < selections.length; i++) {
        this.set('selected_shapes', selections[i]);
        this.deselectAll();
      }
      this.set('selections', []);
      this.set('current_sel_index', 0);
    },

    getCurrentSelection: function() {
      var selections = this.get('selected_shapes');
      return selections;
    },
    // END EXPERIMENTAL


    getLastSelected: function() {
      var selected_shapes = this.get('selected_shapes');
      if (selected_shapes.length > 0) {
        return selected_shapes[selected_shapes.length - 1];
      }
      return null;
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
      if (!event.modifiers.shift) {
        console.log('hoho');
        if (!noDeselect) {
          this.deselectAll();
        }
      }
      var hitResult = paper.project.hitTest(event.point, hitOptions);

      if (hitResult) {

        var path = hitResult.item;

        literal = path;

      }
      var constrain = event.modifiers.command;
      this.trigger('geometrySelected', literal, constrain);



    },

    dSelectDown: function(event, noDeselect) {
      //automaticall deselect all on mousedown if shift modifier is not enabled
      console.log('dselect down');

      if (!event.modifiers.shift) {
        if (!noDeselect) {
          this.deselectAll();
        }
      }


      var hitResult = paper.project.hitTest(event.point, dHitOptions);

      if (hitResult) {

        if (hitResult.type == 'segment') {
          hitResult.segment.fullySelected = true;
          segments.push(hitResult.segment);
        } else if (hitResult.type == 'handle-in' || hitResult.type == 'handle-out') {
          handle = hitResult.type;
          segments.push(hitResult.segment);
        } else if (hitResult.type == 'curve') {
          console.log('hit result', hitResult.location);
          segments.push(hitResult.location._segment1);
          segments.push(hitResult.location._segment2);
        }


      }

      this.trigger('geometryDSelected', segments, event.modifiers.command);


    },

    triggerChange: function() {
      this.trigger('geometrySelected', literal);
    },


    //mouse drag event
    mouseDrag: function(event) {
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
      this.trigger('geometryModified', data, event.modifiers);


    },

    dSelectDrag: function(event) {
      var data = {};
      data.translation_delta = {
        operator: 'add',
        x: event.delta.x,
        y: event.delta.y
      };
      this.trigger('geometrySegmentModified', data, handle, event.modifiers);


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
        this.trigger('geometryModified', data, event.modifiers);

      }

    },

    scaleDrag: function(event) {
      var posPoint = this.getRelativePoint();
      if (posPoint) {
        var d1 = startDist;
        var d2x = startWidth / 2 - startDist.x;
        var d2y = startWidth / 2 - startDist.x;
        var d3 = event.point.subtract(posPoint);

        var rscaleX = d3.x / d1.x;
        var rscaleY = d3.y / d1.y;

        var tScaleX = ((startWidth / 2) * rscaleX) / ((d3.x + d2x) / rscaleX);
        var tScaleY = ((startHeight / 2) * rscaleY) / ((d3.y + d2y) / rscaleY);
        tScaleX = (tScaleX === 0) ? 1 : tScaleX;
        tScaleY = (tScaleY === 0) ? 1 : tScaleY;

        var data = {};
        data.set = true;
        data.scaling_delta = {
          x: tScaleX,
          y: tScaleY,
          operator: 'add'
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
      var selected_shapes = this.get('selected_shapes');
      for (var i = 0; i < selected_shapes.length; i++) {

        if (copyInitialized) {
          copyInitialized = false;
          console.log("setting position");
          //this.trigger('setPositionForIntialized',event.point);
        }
        // selected_shapes[i].setSelectionForInheritors(true,false);



      }
      literal = null;
      segments = [];
      handle = null;
      copyReset = true;

    },



  });

  return SelectToolModel;

});
