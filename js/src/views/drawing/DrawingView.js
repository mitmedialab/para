
define([
  'jquery',
  'underscore',
  'backbone',
  'mustache',
  'paper' /*,
 'views/sidebar/SidebarView',*/
  /*'text!templates/home/homeTemplate.html'*/
], function($, _, Backbone){

  var DrawingView = Backbone.View.extend({
    
    //
    initialize: function(){
   
  },

    render: function(paper){
      console.log("rendering drawing view"+paper);
      var path = new paper.Path();
     // Give the stroke a color
      path.strokeColor = "black";
      var start = new paper.Point(100, 100);
      // Move to start and draw a line from there
      path.moveTo(start);
      // Note that the plus operator on Point objects does not work
      // in JavaScript. Instead, we need to call the add() function:
      path.lineTo(start.add([ 200, -50 ]));
      // Draw the view now:
      paper.view.draw();  
    /* $('.menu li').removeClass('active');
      $('.menu li a[href="#"]').parent().addClass('active');
      this.$el.html(homeTemplate);*/


      //var sidebarView = new SidebarView();
      //sidebarView.render();
 
    }

  });

  return DrawingView;
  
});