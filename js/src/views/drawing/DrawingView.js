/* DrawingView.js
 *master view*/

define([
  'jquery',
  'underscore',
  'backbone',
  'views/drawing/ToolView',
  'views/drawing/PropertyView',
  'views/drawing/CanvasView',
  'views/drawing/ObjectsView',
  'models/tools/ShapeToolModel'

], function($, _, Backbone, ToolView, PropertyView, CanvasView, ObjectsView, ShapeToolModel){

  var DrawingView = Backbone.View.extend({
    //
    initialize: function(){
       shapeToolModel = new ShapeToolModel({type:"Shape"})
      console.log(shapeToolModel.type);
       this.children = {
        toolView: new ToolView({collection: this.collection}),
        propertyView: new PropertyView({collection:this.collection}),
        canvasView: new CanvasView({collection:this.collection,  el:"#canvas"})
      };
  },

    render: function(paper){
      

      //testing script for paper element
      var path = new paper.Path();
     // Give the stroke a color
      path.strokeColor = 'black';
      var start = new paper.Point(100, 100);
      // Move to start and draw a line from there
      path.moveTo(start);
      // Note that the plus operator on Point objects does not work
      // in JavaScript. Instead, we need to call the add() function:
      path.lineTo(start.add([ 200, -50 ]));
      // Draw the view now:
      paper.view.draw();  
 
    }

  });

  return DrawingView;
  
});