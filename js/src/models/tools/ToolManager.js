/*ToolCollection.js
 * a collection that contains all of the tool models
 */

define([
  'jquery',
  'underscore',
  'backbone',
  'paper',

  'models/tools/BaseToolModel',
  'models/tools/SelectToolModel',
  'models/tools/PolyToolModel',
  'models/tools/ConstraintToolModel',
  'utils/Utils',
  'utils/PaperUIHelper',

], function($, _, Backbone, paper, BaseToolModel, SelectToolModel, PolyToolModel, ConstraintToolModel, Utils, PaperUIHelper) {

  var toolNameMap;
  var toolCollection;

  var ToolManager = Backbone.Model.extend({

    defaults: {
      state: 'polyTool',
      'tool_mode': 'standard',
      'tool_modifier': 'none',
      'constraint_pending': false,
    },
    events: {
      'change:tool-mode': this.modeChanged,
      'change:tool-modifier': this.modeChanged
    },


    initialize: function() {
      var selectTool = new SelectToolModel({
        id: 'selectTool'
      });
      var polyTool = new PolyToolModel({
        id: 'polyTool'
      });
      var model = this;
      var constraintTool = new ConstraintToolModel({
        id: 'constraintTool'
      });

      constraintTool.sm = this;
      var self = this;

      toolCollection = new Backbone.Collection({});
      this.set('tool_collection', toolCollection);
      this.listenTo(toolCollection, 'geometryAdded', this.geometryAdded);
      this.listenTo(toolCollection,'modificationEnded',this.modificationEnded);
      this.listenTo(toolCollection, 'compileRequest', function() {
        self.trigger('compileRequest');
      });
      this.listenTo(toolCollection, 'geometrySelected', this.geometrySelected);
      this.listenTo(toolCollection, 'geometryDSelected', this.geometeryDSelected);
      this.listenTo(toolCollection, 'geometryModified', this.geometryModified);
      this.listenTo(toolCollection, 'segmentModified', this.segmentModified);
      this.listenTo(toolCollection, 'deselectAll', function() {
        self.trigger('deselectAll');
      });
      this.listenTo(toolCollection, 'delegateMethod', this.delegateMethod);
      this.listenTo(toolCollection, 'constraintPending', this.constraintPending);
      this.listenTo(toolCollection, 'constraintReset', this.constraintReset);
      this.listenTo(toolCollection, 'addCopy', this.addCopy);
      this.listenTo(toolCollection, 'selectionRequest', this.selectionRequest);
      this.get('tool_collection').add([selectTool, polyTool, constraintTool]);
      //setup user tool managers
      toolNameMap = {
        'select': selectTool,
        'poly': polyTool,
        'constraint': constraintTool
      };

      // setup helpers and factories
      PaperUIHelper.setup(this);

      //setup default zeros for zoom and pan
      this.zeroedZoom = paper.view.zoom;
      this.zeroedPan = paper.view.center.clone();
    },

    setState: function(state, mode) {
      // TODO: possibly rename to 'close'
      this.get('tool_collection').get(this.get('state')).reset();
      this.set('state', state);
      if (mode) {
        var currentTool = this.get('tool_collection').get(this.get('state'));
        currentTool.set('mode', mode);
      }
      if (state == 'constraintTool') {
        this.trigger('constraintModeChanged',true);
      } else {
        this.trigger('constraintModeChanged',false);
        this.trigger('compileRequest');
      }
    },

    modeChanged: function() {
      var models = this.get('models');
      _.each(models, function(model) {
        model.changeMode(this.tool_mode, this.tool_modifer);
      });
      this.trigger('changeModeForSelection');

    },

    resetTools: function() {
      this.get('tool_collection').get(this.get('state')).reset();

    },

    getToolByName: function(toolName) {
      return toolNameMap[toolName];
    },

    /*
     * Requests a particular tool to call a named method. The results are passed back to the source of the delegation.
     */
    delegateMethod: function(toolName, methodName) {
      var args = Array.prototype.slice.call(arguments, 2); // extract the method arguments
      var tool = this.getToolByName(toolName);
      var method = tool[methodName];
      var result = tool[methodName].apply(tool, args);
      return result;
    },

    geometryAdded: function(geom) {
      this.trigger('deselectAll');
      this.trigger('addObject', 'geometry', geom);
    },

    addCopy: function(instance) {
      this.trigger('addObject','copy');
    },

    applyConstraint: function() {
      var constraint_tool = this.get('tool_collection').get('constraintTool');
      var constraint_data = constraint_tool.applyConstraint();
      this.trigger('addConstraint', constraint_data);
    },

    constraintReset: function() {
      this.set('constraint_pending', false);
    },

    constraintPending: function() {
      this.set('constraint_pending', true);
    },

    geometrySelected: function(instance, segments, modifier) {
      this.trigger('selectShape', instance,segments);
      this.setToolStyle({fillColor:instance.getValueFor('fillColor'),strokeColor:instance.getValueFor('strokeColor')});
    },

    selectionRequest: function(reference) {
      this.trigger('selectionRequest', reference);
    },

    geometryModified: function(data, modifiers) {
      this.trigger('geometryModified', data, modifiers);
    },

    segmentModified: function(data, modifiers) {
      this.trigger('segmentModified', data, modifiers);
    },


    geometryParamsModified: function(data) {
      this.trigger('modifyParams', data);
    },

    /*geometryDeleted
     * triggers a delete action on the master manager
     */
    deleteInstance: function() {
      this.trigger('removeShape');
    },


    createList: function() {
      this.trigger('addObject', 'list');
    },

    createFunction: function() {
      this.trigger('addObject', 'function');

    },

    createParams: function() {
      this.trigger('addObject', 'param');
    },

    undo: function() {
      this.trigger('undo');
    },


    redo: function() {
      this.trigger('redo');
    },

    modificationEnded: function(){

        this.trigger('modificationEnded');
    },

    modifyStyle: function(style_data) {
      this.trigger('modifyStyle', style_data);
      this.setToolStyle(style_data);
    },

    setToolStyle: function(style_data) {
      if (style_data.strokeWidth) {
        style_data.strokeWidth = style_data.strokeWidth.val;
      }
      toolCollection.forEach(function(model, index) {
        model.set(style_data);
      });
    },

    openSelected: function() {
      this.trigger('toggleOpen');

    },

    /*closeSelectedGroups
     * attempts to close selected items, if they are lists
     * and updates selection accordingly
     */
    closeSelected: function() {
      this.trigger('toggleClosed');
      this.trigger('deselectAll');
    },

    //triggered by paper tool on a mouse down event
    toolMouseDown: function(event, pan) {
      if (!event.modifiers.space && Utils.validateEvent(event)) {
        var selectedTool = this.get('tool_collection').get(this.get('state'));
        selectedTool.mouseDown(event);
      }
    },

    toolMouseUp: function(event, pan) {
      var selectedTool = this.get('tool_collection').get(this.get('state'));

      if (!event.modifiers.space && Utils.validateEvent(event)) {
        selectedTool.mouseUp(event);
      }

    },


    toolMouseDrag: function(event) {
      if (!event.modifiers.space && Utils.validateEvent(event)) {
        var selectedTool = this.get('tool_collection').get(this.get('state'));
        selectedTool.mouseDrag(event);
      }

    },


    toolMouseMove: function(event) {
      if (!event.modifers.space && Utils.validateEvent(event)) {
        var selectedTool = this.get('tool_collection').get(this.get('state'));
        selectedTool.mouseMove(event);
      }
    },

    canvasMouseDrag: function(delta, pan) {
      if (pan) {
        var inverseDelta = new paper.Point(-delta.x / paper.view.zoom, -delta.y / paper.view.zoom);
        paper.view.scrollBy(inverseDelta);

        event.preventDefault();
      }
    },

    changeZoom: function(oldZoom, delta, c, p) {
      var newZoom = this.calcZoom(oldZoom, delta);

      var beta = oldZoom / newZoom;
      var pc = p.subtract(c);
      var a = p.subtract(pc.multiply(beta)).subtract(c);
      return {
        z: newZoom,
        o: a
      };
    },

    calcZoom: function(oldZoom, delta) {
      var factor = 1.05;
      if (delta < 0) {
        return oldZoom * factor;
      }
      if (delta > 0) {
        return oldZoom / factor;
      }
    },

    canvasMouseWheel: function(event, pan, modify) {
      var delta = event.originalEvent.wheelDelta; //paper.view.center

      if (pan && delta!==0) {

        var mousePos = new paper.Point(event.offsetX, event.offsetY);
        var viewPosition = paper.view.viewToProject(mousePos);
        var data = this.changeZoom(paper.view.zoom, delta, paper.view.center, viewPosition);
        paper.view.zoom = data.z;
        paper.view.center = paper.view.center.add(data.o);
        event.preventDefault();
        paper.view.draw();
      }
    },

    canvasDblclick: function(event) {
            console.log('dblClick');

        this.trigger('doubleClick')
    },

  });
  return ToolManager;
});