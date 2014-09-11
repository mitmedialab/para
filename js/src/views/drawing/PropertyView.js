/*PropertyView.js
* controls updates to the property menu
*/

define([
  'jquery',
  'underscore',
  'backbone',
  'handlebars',
  'tinycolor',
   'pickacolor',
  'minicolors',
  'slider'  
 

], function($, _, Backbone,Handlebars, Tinycolor, Pickacolor) {


  var PropertyView = Backbone.View.extend({
    //
    initialize: function(){
      //listen to update view statements from model to re-render view
      this.listenTo(this.model,'updateView',this.render);
        this.listenTo(this.model,'removeItem',this.removeItem);
        this.listenTo(this.model,'disableSave',this.disableSave);
 
         this.listenTo(this.model,'pathSelected',this.pathSelected);
        this.listenTo(this.model,'selectionReset',this.selectionReset);
         this.currentPaths = [];
        

$('#strokeSlider').slider();
$('#strokeSlider').on('slide', function(slideEvt) {
  $('#strokeSlider').trigger('stroke-change');
});
 
$('.demo').each( function() {  
 $(this).pickAColor({
  showSpectrum:false,
  showAdvanced:false,
  showSavedColors: false,
 });
});

/*$('.demo').each( function() {   
 $(this).minicolors({
  control: $(this).attr('data-control') || 'hue',
  defaultValue: $(this).attr('data-defaultValue') || '',
  inline: $(this).attr('data-inline') === 'true',
  letterCase: $(this).attr('data-letterCase') || 'lowercase',
  opacity: $(this).attr('data-opacity'),
  position: $(this).attr('data-position') || 'bottom left',
  change: function(hex, opacity) {
    if( !hex ) {return;}
    if( opacity ){ hex += ', ' + opacity;}
    $(this).trigger('color-change');
  },
  theme: 'bootstrap'
});
});*/
  },

  events: {
    'change': 'colorChange',
    'stroke-change': 'strokeChange',
    'change #text-filename': 'nameChange',
    'click #save': 'save',
    'click #saveFile': 'saveFile',
    'click #export': 'export',
    'change #upload' : 'loadFile',
    'change #fileselect': 'load'
    },

    render: function(){
      // //console.log('property view rendering');back
       // //console.log('source='+$('#property-list-template').html());
       /* var source = $('#property-list-template').html();
        var template = Handlebars.compile(source);
        var properties = this.model.getSelected();
       // //console.log(properties);
        var html = template(properties);
        this.$el.html(html);
        */
    },

    colorChange: function(event){
      console.log("color change");
      this.model.updateColor($(event.target).val(),event.target.id);
    
    },
    
   strokeChange: function(event){
      this.model.updateStroke(event.target.value);
    },

    save: function(){
     
      var filename = $('#text-filename').val();
      if(filename!=[]){
        this.listenToOnce(this.model,'renderComplete',function(){
           var id  = this.model.save(filename);
           this.addSelectIndex(id,filename);
        });
        this.model.resetTools();
      }
      else{
        alert('please enter a name for your file');
      }
      
    },

    addSelectIndex: function(id, filename){

          $('#fileselect').prepend('<option value='+id+'>'+filename+'</option>');
          $('#fileselect option:first').prop('selected', true); 
          $('#text-filename').val(filename);

    },

    load: function(){
      var id =  $('#fileselect option:selected').val();
      var filename = $('#fileselect option:selected').text();
      this.model.loadLocal(id);
      $('#text-filename').val(filename);
    },

    saveFile: function(){
     var id =  $('#fileselect option:selected').val();
      var filename = $('#text-filename').val();
      if(filename!=[]){
        this.listenToOnce(this.model,'renderComplete',function(){
          var newId = this.model.saveFile(id,filename);
          if(newId!=id){
            this.addSelectIndex(newId,filename);
          }
       });
        this.model.resetTools();
      }
      else{
        alert('please enter a name for your file');
      }
    },


    removeItem: function(id){
      //console.log('removing:'+id);
       $('#fileselect option[value='+id+']').remove();  
    },

     enableSave: function(){
        this.model.save($('#text-filename').val());
    },

    export: function(){
     var filename = $('#text-filename').val();
      if(filename!=[]){
        this.listenToOnce(this.model,'renderComplete',this.enableExport);
        this.model.resetTools();
      }
      else{
        alert('please enter a name for your file');
      }
    },
    
    enableExport: function(){
      this.model.export($('#text-filename').val());
    },


    loadFile: function(event){
     var file = event.target.files[0];
     
      this.listenToOnce(this.model,'loadComplete',function(id,fileName){
          this.addSelectIndex(id,fileName);

      });
       this.model.loadFile(file);

    },
   
    disableSave: function(disable){
      $('#save').attr('disabled', disable);
        $('#saveFile').attr('disabled', false);
    },

    pathSelected: function(path){
      this.currentPaths.push(path);
      var fill = this.currentPaths[0].fillColor;
       var stroke = this.currentPaths[0].strokeColor;
             var width = this.currentPaths[0].strokeWidth;

      if(fill){
       $('#fill').val(fill.toCSS(true).substr(1));
     }
      if(stroke){
          $('#stroke').val(stroke.toCSS(true).substr(1));
        }
        if(width){
          //console.log("setting slider");
           $('#strokeSlider').slider('setValue',width, false);
        }
     
      for(var i=0;i<this.currentPaths.length;i++){

      }
    },

    selectionReset: function(){
      this.currentPaths = [];
    }

  });

  return PropertyView;
  
});