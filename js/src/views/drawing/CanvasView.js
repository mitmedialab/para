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
 var saveKey = 83;
 var loadKey = 76;
 var panKey = 91;
 var clearKey = 67;
 var pan = false;
 var last = {x:0,y:0};
var CanvasView = Backbone.View.extend({
    //
   
    defaults:{

    },

    initialize: function(obj,event_bus){
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
      this.event_bus = event_bus;
   
  },

//canvas events
   events: {
        'mousedown': 'canvasMouseDown',
        'mouseup' : 'canvasMouseUp',
        'mousemove': 'canvasMouseMove',
        'keydown': 'canvasKeydown',
        'keyup': 'canvasKeyup',
         'mouseenter': 'enter',
        'mouseleave': 'leave',
        'mousewheel': 'canvasMousewheel',
        'dblclick': 'canvasDblclick'
    },


   render: function(){
      //console.log("paper is being drawn");
      paper.view.draw();  
    
 
    },


    /* tool mouse event functions */

    toolMouseDown: function(event){
      //this.target. model.toolMouseDown(event);
      //console.log(event);
      this.parent.model.toolMouseDown(event,pan);
    },

    toolMouseUp: function(event){
      this.parent.model.toolMouseUp(event,pan);
      //console.log("tool mouse up:"+ event);
    },

    toolMouseDrag: function(event){
      //console.log("pan = "+pan);
      this.parent.model.toolMouseDrag(event,pan);

      //console.log("tool mouse drag:"+ event);
    },

  
    toolMouseMove: function(event){
      this.parent.model.toolMouseMove(event);
      //console.log("tool mouse drag:"+ event);
    },
  
  
  /* canvas event functions */

    canvasKeydown: function(event){
      console.log(event.keyCode);
      if(event.keyCode == saveKey){
        this.model.save();
      }
      if(event.keyCode === clearKey){
        this.model.deleteObject();
      }
      if(event.keyCode=== panKey){
        //console.log("setting pan to true")
        pan = true;
      }

    },

    canvasKeyup: function(event){
      //console.log(event.keyCode);
    
      if(event.keyCode=== panKey){
        pan = false;
      }

    },

    //enter and leave functions manage keyboard events by focusing the canvas elemennt
    enter: function() {
        this.$el.addClass('hover');
        var span = this.$el.find('span');
        span.attr('tabindex', '1').attr('contenteditable', 'true');
        span.focus();
    },

    leave: function() {
        this.$el.removeClass('hover');
        var span = this.$el.find('span');
        span.removeAttr('contenteditable').removeAttr('tabindex');
        span.blur();
    },

    canvasMouseDown: function(event){
    //console.log(event);
     mouseDown = true;
    // this.event_bus.trigger('shiftClick',event);
      //this.model.canvasMouseDown(event);
    },

    canvasMouseUp: function(event){
    //console.log(event);
     mouseDown = false;
    // this.event_bus.trigger('shiftClick',event);
      //this.model.canvasMouseDown(event);
    },


    canvasMouseMove: function(event){
      this.event_bus.trigger('canvasMouseMove',event);

      if(mouseDown){
        var delta = {x:event.offsetX-last.x,y:event.offsetY-last.y};
        this.model.canvasMouseDrag(delta,pan);
      }
      else{
        //console.log("mouse move event: "+event);
       // this.model.canvasMouseMove(event);
      }
      last.x = event.offsetX;
      last.y = event.offsetY;

    },

    canvasMousewheel: function(event){
      //console.log(event.originalEvent.deltaY);
      this.model.canvasMouseWheel(event,pan);

    },

    canvasDblclick: function(event){
      this.model.canvasDblclick(event);
    },

  

  });

  return CanvasView;
  
});