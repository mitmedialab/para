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
  'models/StateManagerModel',
   'models/behaviors/BehaviorManagerModel'

], function($, _, Backbone, paper, CanvasView, ToolView, PropertyView, ContextView, StateManagerModel,BehaviorManagerModel)  {
  
  var AppRouter = Backbone.Router.extend({
    routes: {// Default
      '*actions': 'defaultAction'
    }
  });
  
  var initialize = function(){

    var app_router = new AppRouter();
    //var paper = require('paper');
    //var canvas= $('canvas').get(0);
    //paper.setup(canvas);

   app_router.on('route:defaultAction', function (actions) {
        
        //event bus for passing events between views
        var event_bus = _({}).extend(Backbone.Events);

       var stateManager = new StateManagerModel(event_bus);
        var behaviorManagerModel = new BehaviorManagerModel(event_bus);
        //setup the canvas view
      var canvasView = new CanvasView({el:'#canvas-container',model:stateManager},event_bus);
      var toolView = new ToolView({el:'#toolbar',model:stateManager});
      var propertyView = new PropertyView({el:'#prop-menu',model:stateManager});
       var contextView = new ContextView({el:'#context-menu',model:behaviorManagerModel},event_bus);

       

        //bind update event to canvas view
        //stateManager.listenTo('change:update',canvasView.render);

        //penTool.on('change:shapeAdded',propertyView.render);


       // stateManager.shapeAdded();
       //var testNode = new TestNode("foo");

       

       
        
    });



    Backbone.history.start();
  };

  return { 
    initialize: initialize
  };
});