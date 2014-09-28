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
  'models/PaperManager'
], function($, _, Backbone, Handlebars, Tinycolor, Pickacolor,PaperManager) {

  var template, source;
  var paper = PaperManager.getPaperInstance();

  // TODO: Remove this global when we remove pick-a-color
  window.tinycolor = Tinycolor;

  var PropertyView = Backbone.View.extend({
    //
    initialize: function() {
      //listen to update view statements from model to re-render view
      this.listenTo(this.model, 'updateView', this.render);
      this.listenTo(this.model, 'removeItem', this.removeItem);
      this.listenTo(this.model, 'disableSave', this.disableSave);

      this.listenTo(this.model, 'pathSelected', this.pathSelected);
      this.listenTo(this.model, 'nodeSelected', this.setParamSliders);
      this.listenTo(this.model, 'selectionReset', this.selectionReset);
      this.currentPaths = [];
      source = $('#parameterTemplate').html();
      template = Handlebars.compile(source);

      $('#strokeSlider').on('input', function(slideEvt) {
        $('#strokeSlider').trigger('stroke-change');
      });

      $('.demo').each(function() {
        $(this).pickAColor({
          showSpectrum: false,
          showAdvanced: false,
          showSavedColors: false,
        });
      });


    },

    events: {
      'color-change': 'colorChange',
      'stroke-change': 'strokeChange',
       'param-change': 'paramChange',
      'change #text-filename': 'nameChange',
      'click #save': 'save',
      'click #saveFile': 'saveFile',
      'click #export': 'export',
      'change #upload': 'loadFile',
      'change #fileselect': 'load'
    },

    render: function() {
      // ////console.log('property view rendering');back
      // ////console.log('source='+$('#property-list-template').html());
      /* var source = $('#property-list-template').html();
        var template = Handlebars.compile(source);
        var properties = this.model.getSelected();
       // ////console.log(properties);
        var html = template(properties);
        this.$el.html(html);
        */
    },

    colorChange: function(event) {
      //console.log("colorChange");
      this.model.updateColor($(event.target).val(), event.target.id);

    },

    strokeChange: function(event) {
       var value = parseInt($(event.target).val(), 10);
      this.model.updateStroke(value);
    },

    paramChange: function(event) {
            var value = parseInt($(event.target).val(), 10);

      //console.log('value=',value);
       var selected = this.model.getSelected();

      var s = selected[selected.length - 1];
      if(s){
        s.updateParams(value);
      }
      this.model.rootUpdate();
      this.model.rootRender();
      paper.view.draw();

    },


    save: function() {

      var filename = $('#text-filename').val();
      if (filename != []) {
        this.listenToOnce(this.model, 'renderComplete', function() {
          var id = this.model.save(filename);
          this.addSelectIndex(id, filename);
        });
        this.model.resetTools();
      } else {
        alert('please enter a name for your file');
      }

    },

    addSelectIndex: function(id, filename) {

      $('#fileselect').prepend('<option value=' + id + '>' + filename + '</option>');
      $('#fileselect option:first').prop('selected', true);
      $('#text-filename').val(filename);

    },

    load: function() {
      var id = $('#fileselect option:selected').val();
      var filename = $('#fileselect option:selected').text();
      this.model.loadLocal(id);
      $('#text-filename').val(filename);
    },

    saveFile: function() {
      var id = $('#fileselect option:selected').val();
      var filename = $('#text-filename').val();
      if (filename != []) {
        this.listenToOnce(this.model, 'renderComplete', function() {
          var newId = this.model.saveFile(id, filename);
          if (newId != id) {
            this.addSelectIndex(newId, filename);
          }
        });
        this.model.resetTools();
      } else {
        alert('please enter a name for your file');
      }
    },


    removeItem: function(id) {
      ////console.log('removing:'+id);
      $('#fileselect option[value=' + id + ']').remove();
    },

    enableSave: function() {
      this.model.save($('#text-filename').val());
    },

    export: function() {
      var filename = $('#text-filename').val();
      if (filename != []) {
        this.listenToOnce(this.model, 'renderComplete', this.enableExport);
        this.model.resetTools();
      } else {
        alert('please enter a name for your file');
      }
    },

    enableExport: function() {
      this.model.export($('#text-filename').val());
    },


    loadFile: function(event) {
      var file = event.target.files[0];

      this.listenToOnce(this.model, 'loadComplete', function(id, fileName) {
        this.addSelectIndex(id, fileName);

      });
      this.model.loadFile(file);

    },

    disableSave: function(disable) {
      $('#save').attr('disabled', disable);
      $('#saveFile').attr('disabled', false);
    },

    pathSelected: function(path) {
      //console.log("path selected");
      this.currentPaths.push(path);
      var fill = this.currentPaths[0].fillColor;
      var stroke = this.currentPaths[0].strokeColor;
      var width = this.currentPaths[0].strokeWidth;

      if (fill) {
        $('#fill').val(fill.toCSS(true).substr(1));
      }
      if (stroke) {
        $('#stroke').val(stroke.toCSS(true).substr(1));
      }
      if (width) {
        //console.log("setting slider");
        $('#strokeSlider').val(width);
      }

      this.setParams();
    },

    //triggered when StateManager finds selection point
    setParams: function() {

      var params = [];
      var selected = this.model.getSelected();

      var s = selected[selected.length - 1];
      var userParams = s.userParams;
      if (userParams) {
        for (var i = 0; i < userParams.length; i++) {

          var data = {
            label: userParams[i].label,
            max: userParams[i].max,
            min: userParams[i].min,
            val: s[userParams[i].propertyName],
            propertyName: userParams[i].propertyName
          };
          params.push(data);
        }
      }
      var context = {
        paramName: params
      };
      //console.log("context", context);
      var html = template(context);
      $('#parameterSliders').html(html);
      $('#parameterSlider').each(function() {
        var slider = $(this);

        slider.on('input', function(slideEvt) {
        slider.trigger('param-change');
        });
      });



    },

    selectionReset: function() {
      this.currentPaths = [];
       $('#parameterSliders').empty();
    
    }

  });

  return PropertyView;

});