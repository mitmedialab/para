/*SelectToolModel.js
 *base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel',
  'utils/PPoint'




], function(_, Backbone, BaseToolModel,PPoint) {
  var segment, handle;
  var moved = null;
  var segmentMod = false;
  var copyReset= true;
  var hitOptions = {
    segments: true,
    stroke: true,
    handles: true,
    fill: true,
    tolerance: 2
  };

  var SelectToolModel = BaseToolModel.extend({
    defaults: _.extend({}, BaseToolModel.prototype.defaults, {
      selected_shapes: null
    }),

    initialize: function() {
      BaseToolModel.prototype.initialize.apply(this, arguments);
      this.set('selected_shapes', []);
      this.on('change:literals',this.triggerChange);

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
      instance.set('selected', true);
      selected_shapes.push(instance);
      this.set('selected_shapes', selected_shapes);
    },

    /*mousedown event
     */
    mouseDown: function(event) {
      var paper = this.get('paper');

      //automaticall deselect all on mousedown if shift modifier is not enabled
      if (!event.modifiers.shift) {
        this.deselectAll();
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

        this.trigger('geometrySelected');
      }


    },

    triggerChange: function(){
      this.trigger('geometrySelected');

    },

  
    //mouse drag event
    mouseDrag: function(event) {
      if(event.modifiers.option && copyReset){
        copyReset = false;

        this.trigger('geometryCopied');
      }

      var data = {};
      data.translation_delta =  new PPoint(event.delta.x,event.delta.y);
      this.trigger('geometryIncremented',data);

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