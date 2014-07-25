/*PropertyView.js
* controls updates to the property menu
*/

define([
  'jquery',
  'underscore',
  'backbone',
  'handlebars',
 

], function($, _, Backbone,Handlebars){


  var PropertyView = Backbone.View.extend({
    //
    initialize: function(){
      //listen to update view statements from model to re-render view
      this.listenTo(this.model,'updateView',this.render);
        
 
  },

  events: {
    'change #obj-name': 'nameChange',
    'color-change': 'colorChange',
    'stroke-change': 'strokeChange'
    },

    render: function(){
      // console.log('property view rendering');back
       // console.log('source='+$('#property-list-template').html());
       /* var source = $('#property-list-template').html();
        var template = Handlebars.compile(source);
        var properties = this.model.getSelected();
       // console.log(properties);
        var html = template(properties);
        this.$el.html(html);
        */


      
    },

    colorChange: function(event){
      this.model.updateColor(event.target.value,event.target.id);
    
    },
    
   strokeChange: function(event){
      this.model.updateStroke(event.target.value);
    },

    nameChange: function(){
      //console.log("updating name to:"+ $('#obj-name').val());
      this.model.updateSelected({name:$('#obj-name').val()});
    }

  });

  return PropertyView;
  
});