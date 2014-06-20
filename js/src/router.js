/* Filename: router.js*/
define([
  'jquery',
  'underscore',
  'backbone',
  'paper',
  'views/drawing/CanvasView',
  'views/drawing/ToolView',
  'models/StateManagerModel'

], function($, _, Backbone, paper, CanvasView, ToolView, StateManagerModel) {
  
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
        //bind update event to canvas view
        stateManager.on('change:update',canvasView.render);


       

       
        
    });



    Backbone.history.start();
  };

  return { 
    initialize: initialize
  };
});