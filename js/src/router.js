/* Filename: router.js*/
define([
  'jquery',
  'underscore',
  'backbone',
  'views/drawing/DrawingView',
  'paper'
], function($, _, Backbone, DrawingView) {
  
  var AppRouter = Backbone.Router.extend({
    routes: {// Default
      '*actions': 'defaultAction'
    }
  });
  
  var initialize = function(){

    var app_router = new AppRouter();
    var paper = require('paper');
    var canvas= $('canvas').get(0);
    paper.setup(canvas);
    
    app_router.on('route:defaultAction', function (actions) {
     
       // We have no matching route, lets display the home page 
        var drawingView = new DrawingView();
        drawingView.render(paper);
    });

    Backbone.history.start();
  };
  return { 
    initialize: initialize
  };
});