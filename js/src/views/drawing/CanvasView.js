/*CanvasView.js
* controls updates to the canvas- where all the drawing should happen... */

define([
  'jquery',
  'underscore',
  'backbone',
  'models/PaperManager',

], function($, _, Backbone, PaperManager){
  
 var paper = PaperManager.getPaperInstance('canvas');
 var tool = new  paper.Tool();
 var mouseDown = false;
  var CanvasView = Backbone.View.extend({
    //
   
    defaults:{

    },

    initialize: function(){
      //this.$el.width(this.$el.parent().width());

      //listen to update view statements from model to re-render view
      this.listenTo(this.model,'updateView',this.render);
      //bind paper tool events
      tool.activate();
      tool.parent = this;
      tool.attach('mousedown',this.toolMouseDown);
      tool.attach('mousedrag',this.toolMouseDrag);
      tool.attach('mouseup',this.toolMouseUp);
      tool.attach('mousemove',this.toolMouseMove);
   
  },

//canvas events
   events: {
        'mousedown': 'canvasMouseDown',
        'mouseup' : 'canvasMouseUp',
        'mousemove': 'canvasMouseMove'
    },


   render: function(){
      //console.log("paper is being drawn");
      paper.view.draw();  
    
 
    },


    /* tool mouse event functions */

    toolMouseDown: function(event){
      //this.target. model.toolMouseDown(event);
      this.parent.model.toolMouseDown(event);
    },

    toolMouseUp: function(event){
      this.parent.model.toolMouseUp(event);
      //console.log("tool mouse up:"+ event);
    },

    toolMouseDrag: function(event){
      this.parent.model.toolMouseDrag(event);
      //console.log("tool mouse drag:"+ event);
    },

    toolMouseMove: function(event){
      this.parent.model.toolMouseMove(event);
      //console.log("tool mouse drag:"+ event);
    },
  
  
  /* canvas mouse event functions */

    canvasMouseDown: function(event){
     // console.log(event);
     mouseDown = true;
      //this.model.canvasMouseDown(event);
    },

    canvasMouseDrag: function(event){
     // console.log(event);
     mouseDown = false;
      this.model.canvasMouseDrag(event);
    },

    canvasMouseMove: function(event){
      if(mouseDown){
        //console.log("mouse drag event: "+event);
        //this.model.canvasMouseDrag(event);
      }
      else{
        //console.log("mouse move event: "+event);
       // this.model.canvasMouseMove(event);
      }


    }

  });

  return CanvasView;
  
});