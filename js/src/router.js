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
  'models/behaviors/BehaviorManagerModel',

], function($, _, Backbone, paper, CanvasView, ToolView, PropertyView, ContextView, ProtoView, StateManagerModel, BehaviorManagerModel) {

  var AppRouter = Backbone.Router.extend({
    routes: { // Default
      '*actions': 'defaultAction'
    }
  });

  var initialize = function() {

    var app_router = new AppRouter();


    app_router.on('route:defaultAction', function(actions) {

      //event bus for passing events between views
      var event_bus = _({}).extend(Backbone.Events);
      var behaviorManagerModel = new BehaviorManagerModel(event_bus);
      var stateManager = new StateManagerModel(event_bus);


      //setup the canvas view
      var canvasView = new CanvasView({
        el: '#canvas-container',
        model: stateManager
      }, event_bus);
     
      var toolView = new ToolView({
        el: '#tool-elements',
        model: stateManager
      });
      var propertyView = new PropertyView({
        el: '#prop-menu',
        model: stateManager
      });
      var contextView = new ContextView({
        el: '#context-menu',
        model: behaviorManagerModel
      }, event_bus);
      propertyView.render();



    });



    Backbone.history.start();
  };

  return {
    initialize: initialize
  };
});