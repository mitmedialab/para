/*SelectToolModel.js
 *base model class for all direct manipulation tool models*/

define([
  'underscore',
  'paper',
  'backbone',
  'models/tools/BaseToolModel',
  'utils/PPoint'



], function(_, paper, Backbone, BaseToolModel, PPoint) {
  var segment, literal, handle;
  var segmentMod = false;
  var copyReset = true;
  var dHitOptions = {
    segments: true,
    handles: true,
    tolerance: 2
  };

  var hitOptions = {
    stroke: true,
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
        selected_shapes[i].setSelectionForInheritors(false,true);
        selected_shapes[i].set('selected_indexes', []);

      }
      this.set('selected_shapes', []);
    },

    addSelectedShape: function(instance) {
      var selected_shapes = this.get('selected_shapes');
      if (!_.contains(selected_shapes, instance)) {
        instance.set('selected', true);
         if(instance.get('isProto')){
            instance.setSelectionForInheritors(true,false);
          }
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
        case 'select':
          this.selectDown(event);
          break;
        case 'dselect':
          this.dSelectDown(event);
          break;
        case 'rotate':
          this.rotateDown(event);
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
        if (!noDeselect) {
          this.deselectAll();
        }
      }
      var hitResult = paper.project.hitTest(event.point, hitOptions);

      if (hitResult) {

        var path = hitResult.item;

        literal = path;

      }
        this.trigger('geometrySelected',literal);



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
          segment = hitResult.segment;
          segment.fullySelected = true;
        } else if (hitResult.type == 'handle-in' || hitResult.type == 'handle-out') {
          handle = hitResult.type;
          segment = hitResult.segment.index;
        }
            console.log('hit segment',segment);


      }

      this.trigger('geometryDSelected',segment,handle);


    },

    triggerChange: function() {
      this.trigger('geometrySelected',literal);
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
      }
    },

    selectDrag: function(event) {
  
      if (event.modifiers.option && copyReset) {
        copyReset = false;

        this.trigger('geometryDeepCopied');
      }

      var data = {};
      data.translation_delta = new PPoint(event.delta.x, event.delta.y);
      this.trigger('geometryIncremented', data, event.modifiers.command);
      

    },

    dSelectDrag: function(event) {
  
      var data = {};
      data.translation_delta = new PPoint(event.delta.x, event.delta.y);
      this.trigger('geometrySegmentIncremented', data);
      

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
      
         
      selected_shapes[i].setSelectionForInheritors(true,false);
          
        //instance.incrementDelta({},false, true);
       
      

      }
      literal = null;
      segment = null;
      handle= null;
      copyReset = true;

    },



  });

  return SelectToolModel;

});