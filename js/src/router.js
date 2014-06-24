/* Filename: router.js*/
define([
  'jquery',
  'underscore',
  'backbone',
  'paper',
  'views/drawing/CanvasView',
  'views/drawing/ToolView',
  'views/drawing/PropertyView',
  'models/StateManagerModel'

], function($, _, Backbone, paper, CanvasView, ToolView, PropertyView, StateManagerModel) {
  
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
      
      
        var stateManager = new StateManagerModel();
        //setup the canvas view
        var canvasView = new CanvasView({el:'#canvas',model:stateManager});
        var toolView = new ToolView({el:'#toolbar',model:stateManager});
        var propertyView = new PropertyView({el:'#prop-menu',model:stateManager});
        //bind update event to canvas view
        stateManager.on('change:update',canvasView.render);
        stateManager.on('shapeAdded',propertyView.render);


       // stateManager.shapeAdded();


       

       
        
    });



    Backbone.history.start();
  };

  return { 
    initialize: initialize
  };
});