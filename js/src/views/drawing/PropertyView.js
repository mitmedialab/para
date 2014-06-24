/*PropertyView.js
* controls updates to the property menu
*/

define([
  'jquery',
  'underscore',
  'backbone',
  'handlebars'

], function($, _, Backbone,Handlebars){


  var PropertyView = Backbone.View.extend({
    //
    initialize: function(){
      //listen to update view statements from model to re-render view
      this.listenTo(this.model,'updateView',this.render);
  },

  events: {
    'change #obj-name': 'nameChange'
    },

    render: function(){
       /* console.log('property view rendering');
        console.log('source='+$('#property-list-template').html());
        var source = $('#property-list-template').html();
        var template = Handlebars.compile(source);
        var properties = this.model.getSelected();
       // console.log(properties);
        var html = template(properties);
        this.$el.html(html);
        */
    },


    nameChange: function(){
      //console.log("updating name to:"+ $('#obj-name').val());
      //this.model.updateSelected({name:$('#obj-name').val()});
    }

  });

  return PropertyView;
  
});