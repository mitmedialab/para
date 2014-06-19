/*CanvasView.js
* controls updates to the canvas- where all the drawing should happen... */

define([
  'jquery',
  'underscore',
  'backbone'

], function($, _, Backbone){


  var CanvasView = Backbone.View.extend({
    //
    el:"#canvas",

    initialize: function(){
      //this.listenTo(this.model, 'change', this.render);

  },

   events: {
        'mousedown': 'toolDown'
    },


    render: function(){
 
    },

    toolDown: function(){
      console.log('mousedown');
    }

  });

  return CanvasView;
  
});