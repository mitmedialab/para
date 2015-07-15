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
  'models/data/MasterManager',

], function($, _, Backbone, paper, CanvasView, ToolView, PropertyView, PropertiesManager, ToolManager, MasterManager) {
  var masterScope;
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
      console.log('layers:', paper.project.layers);

      var propertiesManager = new PropertiesManager();
      //event bus for passing events between views
      var event_bus = _({}).extend(Backbone.Events);
      var toolManager = new ToolManager();
      //setup the canvas view
      var canvasView = new CanvasView({
        el: '#canvas-container',
        model: toolManager
      }, event_bus);

      //setup masterManager and function manager
      var masterManager = new MasterManager();


      /* event listener registers */


      masterManager.listenTo(toolManager, 'compileRequest', masterManager.compile);
      masterManager.listenTo(toolManager, 'removeShape', masterManager.removeObject);
      masterManager.listenTo(toolManager, 'addObject', masterManager.addObject);

      masterManager.listenTo(toolManager, 'addConstraint', masterManager.addConstraint);
      masterManager.listenTo(toolManager, 'visualizeConstraint', masterManager.visualizeConstraint);
      masterManager.listenTo(toolManager, 'selectionChanged', masterManager.selectionChanged);
      masterManager.listenTo(toolManager, 'toggleOpen', masterManager.toggleOpen);
      masterManager.listenTo(toolManager, 'toggleClosed', masterManager.toggleClosed);


      masterManager.listenTo(toolManager, 'deselectAll', masterManager.deselectAllShapes);
      masterManager.listenTo(toolManager, 'selectShape', masterManager.selectShape);
      masterManager.listenTo(toolManager, 'deselectShape', masterManager.selectShape);
      masterManager.listenTo(toolManager, 'geometryModified', masterManager.modifyGeometry);
      masterManager.listenTo(toolManager, 'segmentModified', masterManager.modifySegment);
      masterManager.listenTo(toolManager, 'modifyParams', masterManager.modifyParams);
      masterManager.listenTo(toolManager, 'modifyStyle', masterManager.modifyStyle);

      masterManager.listenTo(toolManager, 'changeModeForSelection', masterManager.changeModeForSelection);
      masterManager.listenTo(toolManager, 'selectionRequest', masterManager.getCurrentSelection);


      var toolView = new ToolView({
        el: '#tool-elements',
        model: toolManager
      });
     

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