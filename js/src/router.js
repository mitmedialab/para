/* Filename: router.js*/
define([
  'jquery',
  'underscore',
  'backbone',
  'paper',
  'views/drawing/CanvasView',
  'views/drawing/ToolView',
  'views/drawing/PropertyView',
  'views/drawing/ContextView',
  'views/drawing/ProtoView',
  'models/StateManagerModel',
  'models/tools/ToolManager',
  'models/data/Visitor',

], function($, _, Backbone, paper, CanvasView, ToolView, PropertyView, ContextView, ProtoView, StateManagerModel, ToolManager, Visitor) {

  var AppRouter = Backbone.Router.extend({
    routes: { // Default
      '*actions': 'defaultAction'
    }
  });

  var initialize = function() {
    var app_router = new AppRouter();

    app_router.on('route:defaultAction', function(actions) {
      var stateManager = new StateManagerModel({});
      //event bus for passing events between views
      var event_bus = _({}).extend(Backbone.Events);

      var toolManager = new ToolManager();


      //setup visitor and function manager
      var visitor = new Visitor();


      /* event listener registers */
      this.listenTo(visitor, "geometrySelected", this.geometrySelected);
      this.listenTo(visitor, "geometryDeselected", this.geometryDeselected);
      toolManager.listenTo(visitor, 'selectionFiltered', toolManager.selectionFiltered);
      toolManager.listenTo(visitor, "addToSelection", toolManager.addToSelection);
      toolManager.listenTo(visitor, "removeFromSelection", toolManager.removeFromSelection);

      visitor.listenTo(toolManager, 'compileRequest', visitor.compile);
      visitor.listenTo(toolManager, 'addShape', visitor.addShape);
      visitor.listenTo(toolManager, 'addInstance', visitor.addInstance);
      visitor.listenTo(toolManager, 'addConstraint', visitor.addConstraint);
      visitor.listenTo(toolManager, 'selectionChanged', visitor.selectionChanged);
      visitor.listenTo(toolManager, 'addList', visitor.addList);
      visitor.listenTo(toolManager, 'addFunction', visitor.addFunction);
      visitor.listenTo(toolManager, 'addParams', visitor.addParams);
      visitor.listenTo(toolManager, 'toggleOpen', visitor.toggleOpen);
      visitor.listenTo(toolManager, 'toggleClosed', visitor.toggleClosed);



      var toolView = new ToolView({
        el: '#tool-elements',
        model: toolManager
      });


      //setup the canvas view
      var canvasView = new CanvasView({
        el: '#canvas-container',
        model: toolManager
      }, event_bus);


      var propertyView = new PropertyView({
        el: '#prop-menu',
        model: stateManager
      });
      var contextView = new ContextView({
        el: '#context-menu',
        model: toolManager.get('tool_collection').get('constraintTool'),
      });

      propertyView.render();

    });



    Backbone.history.start();
  };

  return {
    initialize: initialize
  };
});