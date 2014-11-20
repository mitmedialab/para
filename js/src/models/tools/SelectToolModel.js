/*SelectToolModel.js
 *base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel',
  'utils/PPoint'



], function(_, Backbone, BaseToolModel, PPoint) {
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
      mode: 'select'
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
        selected_shapes.push(instance);
        this.set('selected_shapes', selected_shapes);
      }
    },

    /*mousedown event
     */
    mouseDown: function(event) {
      switch (this.get('mode')) {
        case 'select':
          this.selectDown(event);
          break;
        case 'rotate':
          this.rotateDown(event);
          break;
      }
    },

    rotateDown: function(event){
       if(event.modifiers.option){
        this.selectDown(event,true);
     
         this.trigger('modifyInheritance','rotation_node');
      }
      else{
        this.selectDown(event);
      }
    },


    selectDown: function(event, noDeselect) {
      var paper = this.get('paper');
      segment = null;
      console.log("noDeselect=",noDeselect);
      //automaticall deselect all on mousedown if shift modifier is not enabled
      if (!event.modifiers.shift) {
        if(!noDeselect){
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
          console.log('hit segment');
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
      console.log("segment=", segment);
      switch (this.get('mode')) {
        case 'select':
          this.selectDrag(event);
          break;
        case 'rotate':
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
        console.log("trigger segment");
        this.trigger('geometryIncremented', data, segment);
      } else {
        this.trigger('geometryIncremented', data);
      }

    },

    rotateDrag: function(event) {
      var posPoint = this.getRelativePoint();
      if (posPoint) {
        var angle = event.lastPoint.subtract(posPoint).angle;
        var dAngle = event.point.subtract(posPoint).angle;
        var data = {};
        data.rotation_delta = dAngle - angle;
        console.log('rotate_delta', data.rotation_delta);
        this.trigger('geometryIncremented', data);

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

      copyReset = true;

    },



  });

  return SelectToolModel;

});