/*CanvasView.js
* controls updates to the canvas- where all the drawing should happen... */

define([
  'jquery',
  'underscore',
  'backbone',
  'models/PaperManager',

], function($, _, Backbone, PaperManager){


  var CanvasView = Backbone.View.extend({
    //
   
    defaults:{

    },

    initialize: function(){

  },

   events: {
        'mousedown': 'canvasMouseDown'
    },


   render: function(){
      
    var paper = PaperManager.getPaperInstance("canvas");
    paper.view.draw();  
    
 
    },

    canvasMouseDown: function(event){
     // console.log(event);
      this.model.canvasMouseDown(event);
    }

  });

  return CanvasView;
  
});