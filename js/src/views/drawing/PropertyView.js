/*PropertyView.js
 * controls updates to the property menu
 */

define([
  'jquery',
  'underscore',
  'backbone',
  'handlebars',
  'iris-color-picker',
  'models/PaperManager'
], function($, _, Backbone, Handlebars, IrisColorPicker, PaperManager) {

  var template, source;
  var paper = PaperManager.getPaperInstance();
  var PropertyView = Backbone.View.extend({
    //
    initialize: function() {
      //listen to update view statements from model to re-render view
      this.listenTo(this.model, 'updateView', this.render);
      this.listenTo(this.model, 'removeItem', this.removeItem);
      this.listenTo(this.model, 'disableSave', this.disableSave);

      this.listenTo(this.model, 'pathSelected', this.pathSelected);
      this.listenTo(this.model, 'selectionReset', this.selectionReset);
      this.currentPaths = [];
      source = $('#parameterTemplate').html();
      template = Handlebars.default.compile(source);


      $('#fillColorBlock').addClass('color-block-selected');
      $('#fillColorBlock').css('background-color', 'white');
      $('#fill').val('#ffffff');
      $('#strokeColorBlock').css('background-color', 'black');
      $('#stroke').val('#000000');
      $('#strokeSlider').on('change mousemove', function() {
        $('#strokeSlider').trigger('stroke-change');
      });

      $('#color-window').each(function() {
        $(this).iris({
          palettes: ['#fff',
         '#000',
          '#0E3D63', 
        '#16A2A6',
          '#C6E8ED',
          '#BC2028',
         '#F0576D',
          '#F2682A',
          '#F1A54D',
         '#FEE4BF'],
          hide: false,
          color: '#fff',
          change: function(event, ui) {
            $(this).trigger('colorChange', event, ui);
          }
        });
      });

    },

    events: {
      'stroke-change': 'strokeChange',
      'param-change': 'paramChange',
      'change #text-filename': 'nameChange',
      'click #save': 'save',
      'click #saveFile': 'saveFile',
      'click #export': 'export',
      'change #upload': 'loadFile',
      'change #fileselect': 'load',
      'colorChange': 'colorChange',
      'click #fillColorBlock': 'toggleFillStroke',
      'click #strokeColorBlock': 'toggleFillStroke',
      'change #fill': 'colorInputChange',
      'change #stroke': 'colorInputChange',
      'click #no-color': 'clearColor',
      'click .behaviorRemove': 'removeBehavior'


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

    removeBehavior:function(event){
     var name = $(event.target).attr('id');
      this.model.removeBehavior(name);
    },

    clearColor:function(event){
       if ($('#fillColorBlock').hasClass('color-block-selected')) {
        $('#fillColorBlock').addClass('remove-color');
        $('#fill').val("#");
        this.model.updateColor(-1, 'fill');

      } else {
        $('#strokeColorBlock').addClass('remove-color');
        $('#stroke').val("#");
        this.model.updateColor(-1, 'stroke');

      }
    },

    colorInputChange: function(event) {
      var color = $(event.target).val();
      var id = $(event.target).attr('id');
      if (id == 'fill') {
        $('#fillColorBlock').css('background-color', color);
        if ($('#fillColorBlock').hasClass('color-block-selected')) {
          $('#color-window').iris('color', color);
        }
      }
      if (id == 'stroke') {
        $('#strokeColorBlock').css('background-color', color);

        if ($('#strokeColorBlock').hasClass('color-block-selected')) {
          $('#color-window').iris('color', color);
        }
      }
      this.model.updateColor(color, id);

    },

    colorChange: function(event, ui) {

      var color = $('#color-window').iris('color');
      console.log('color',color);
      if ($('#fillColorBlock').hasClass('color-block-selected')) {
          $('#fillColorBlock').removeClass('remove-color');
        $('#fillColorBlock').css('background-color', color);
        $('#fill').val(color);
        this.model.updateColor(color, 'fill');

      } else {
           $('#strokeColorBlock').removeClass('remove-color');
        $('#strokeColorBlock').css('background-color', color);
        $('#stroke').val(color);
        this.model.updateColor(color, 'stroke');

      }


    },

    pathSelected: function(node) {
   
      //console.log("path selected");
      this.currentPaths.push(node);
      console.log('node=',node);
       console.log(node.getFirstSelectedInstance());
      //TODO: reference instance value not path value
      var fill = this.currentPaths[0].getFirstSelectedInstance().fillColor;
      var stroke = this.currentPaths[0].getFirstSelectedInstance().strokeColor;
      var width = this.currentPaths[0].getFirstSelectedInstance().strokeWidth;

      if (fill) {
        $('#fillColorBlock').css('background-color', fill);
        $('#fill').val(fill);
        if ($('#fillColorBlock').hasClass('color-block-selected')) {
          $('#color-window').iris('color', fill);
        }
      }
      if (stroke) {
        $('#strokeColorBlock').css('background-color', stroke);
        $('#stroke').val(stroke);
        if ($('#strokeColorBlock').hasClass('color-block-selected')) {
          $('#color-window').iris('color', stroke);
        }
      }
      if (width) {
        //console.log("setting slider");
        $('#strokeSlider').val(width);
      }

      this.setParams();
    },


    toggleFillStroke: function(event) {
      var id = event.target.id;
      if (id == 'fillColorBlock') {
        $('#strokeColorBlock').removeClass('color-block-selected');
        $('#fillColorBlock').addClass('color-block-selected');
         if( !$('#fillColorBlock').hasClass('remove-color')){
            $('#color-window').iris('color', $('#fillColorBlock').css('background-color'));
          }
      } else {
        $('#strokeColorBlock').addClass('color-block-selected');
        $('#fillColorBlock').removeClass('color-block-selected');
        if( !$('#strokeColorBlock').hasClass('remove-color')){
          $('#color-window').iris('color', $('#strokeColorBlock').css('background-color'));
        }
      }
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
      if (s) {
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


    //triggered when StateManager finds selection point
    setParams: function() {

      var propertyParams = [];
      var behaviorParams = [];
      var context = {};
      var selected = this.model.getSelected();

      var s = selected[selected.length - 1];
      if(s){
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
          propertyParams.push(data);
        }
      }
      

    /*for (var i = 0; i < behaviors.length; i++) {

          var data = {
            label: behaviors[i].behavior.name
          };
          behaviorParams.push(data);
        }*/
     context = {
        paramName: propertyParams,
        behaviorName: behaviorParams
      };
    }
      //console.log("context", context);
      var html = template(context);
      $('#parameters').html(html);
      $('#parameterSlider').each(function() {
        var slider = $(this);

        slider.on('input', function(slideEvt) {
          slider.trigger('param-change');
        });
      });



    },

    selectionReset: function() {
      this.currentPaths = [];
      $('#parameters').empty();

    }

  });

  return PropertyView;

});