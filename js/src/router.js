/* Filename: router.js*/
define([
  'jquery',
  'underscore',
  'backbone',
  'paper',
  'views/CanvasView',
  'views/ToolView',
  'views/PropertyView',
  'models/data/PropertiesManager',
  'models/tools/ToolManager',
  'models/data/Visitor',

], function($, _, Backbone, paper, CanvasView, ToolView, PropertyView,PropertiesManager, ToolManager, Visitor) {

  var AppRouter = Backbone.Router.extend({
    routes: { // Default
      '*actions': 'defaultAction'
    }
  });

  var initialize = function() {
    var app_router = new AppRouter();

    app_router.on('route:defaultAction', function(actions) {
      var canvas = $('canvas').get(0);
      paper.setup(canvas);
     
      var geometry_layer = new paper.Layer();
      geometry_layer.name = 'geometry_layer';
      var ui_layer = new paper.Layer();
      ui_layer.name = 'ui_layer';
      geometry_layer.activate();
      console.log('paper project', paper.project);
      console.log('layers:',paper.project.layers);

      var propertiesManager = new PropertiesManager();
      //event bus for passing events between views
      var event_bus = _({}).extend(Backbone.Events);
      var toolManager = new ToolManager();

      //setup visitor and function manager
      var visitor = new Visitor();


      /* event listener registers */
      toolManager.listenTo(visitor, 'selectionFiltered', toolManager.selectionFiltered);


      visitor.listenTo(toolManager, 'compileRequest', visitor.compile);
      visitor.listenTo(toolManager, 'addShape', visitor.addShape);
      visitor.listenTo(toolManager, 'removeShape', visitor.removeShape);
      visitor.listenTo(toolManager, 'addInstance', visitor.addInstance);
      visitor.listenTo(toolManager, 'addConstraint', visitor.addConstraint);
      visitor.listenTo(toolManager, 'visualizeConstraint', visitor.visualizeConstraint);
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
        model: toolManager
      });

      propertyView.render();

    });



    Backbone.history.start();
  };

  return {
    initialize: initialize
  };
});
