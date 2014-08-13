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
    'stroke-change': 'strokeChange',
    'change #text-filename': 'nameChange',
    'click #save': 'save',
    'click #export': 'export',
    'change #load' : 'load'
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

    save: function(event){
     var filename = $('#text-filename').val();
      if(filename!=[]){
        this.listenToOnce(this.model,'renderComplete',this.enableSave);
        this.model.resetTools();
      }
      else{
        alert('please enter a name for your file');
      }
    },

     enableSave: function(event){
        this.model.save($('#text-filename').val());
    },

    export: function(event){
     var filename = $('#text-filename').val();
      if(filename!=[]){
        this.listenToOnce(this.model,'renderComplete',this.enableExport);
        this.model.resetTools();
      }
      else{
        alert('please enter a name for your file');
      }
    },
    
    enableExport: function(event){
      this.model.export($('#text-filename').val());
    },


    load: function(event){
     var file = event.target.files[0];
     var reader = new FileReader();
     reader.parent = this;
    reader.onload = (function(theFile) {
        return function(e) {
          // Render thumbnail.
         this.parent.model.load(JSON.parse(e.target.result));
        };
      })(file);
    reader.readAsText(file);

    },
    nameChange: function(event){
      //console.log("updating name to:"+ $('#obj-name').val());
      console.log($('#text-filename').val());
      //this.model.updateSelected({name:$('#obj-name').val()});
    }

  });

  return PropertyView;
  
});