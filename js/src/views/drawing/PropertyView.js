/*PropertyView.js
 * controls updates to the property menu
 */

define([
  'jquery',
  'underscore',
  'backbone',
  'handlebars',
  'iris-color-picker',
  'paper'
], function($, _, Backbone, Handlebars, IrisColorPicker, paper) {

  var template, source;
  var PropertyView = Backbone.View.extend({
    //
    initialize: function() {
      //listen to update view statements from model to re-render view
      this.listenTo(this.model, 'updateView', this.render);
      this.listenTo(this.model, 'removeItem', this.removeItem);
      this.listenTo(this.model, 'disableSave', this.disableSave);

      this.listenTo(this.model, 'geometrySelected', this.geometrySelected);
      this.listenTo(this.model, 'selectionReset', this.selectionReset);
      this.curresntPaths = [];
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
            '#FEE4BF'
          ],
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

    removeBehavior: function(event) {
      var name = $(event.target).attr('id');
      this.model.removeBehavior(name);
    },

    clearColor: function(event) {
      if ($('#fillColorBlock').hasClass('color-block-selected')) {
        $('#fillColorBlock').addClass('remove-color');
        $('#fill').val("#");
        this.model.styleModified({
          fill_color: null
        });

      } else {
        $('#strokeColorBlock').addClass('remove-color');
        $('#stroke').val("#");
        this.model.styleModified({
          stroke_color: null
        });
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
      var data = {};
      data[(id + "_color")] = color;
      this.model.styleModified(data);

    },

    colorChange: function(event, ui) {

      var color = $('#color-window').iris('color');
      console.log('color', color);
      if ($('#fillColorBlock').hasClass('color-block-selected')) {
        $('#fillColorBlock').removeClass('remove-color');
        $('#fillColorBlock').css('background-color', color);
        $('#fill').val(color);
        this.model.styleModified({
          fill_color: color
        });


      } else {
        $('#strokeColorBlock').removeClass('remove-color');
        $('#strokeColorBlock').css('background-color', color);
        $('#stroke').val(color);
        this.model.styleModified({
          stroke_color: color
        });

      }


    },

    geometrySelected: function(data) {

      if (data.fill_color) {
        $('#fillColorBlock').css('background-color', data.fill_color);
        $('#fill').val(data.fill_color);
        if ($('#fillColorBlock').hasClass('color-block-selected')) {
          $('#color-window').iris('color', data.fill_color);
        }
      }
      if (data.stroke_color) {
        $('#strokeColorBlock').css('background-color', data.stroke_color);
        $('#stroke').val(data.stroke_color);
        if ($('#strokeColorBlock').hasClass('color-block-selected')) {
          $('#color-window').iris('color', data.stroke_color);
        }
      }
      if (data.stroke_width) {
        //console.log("setting slider");
        $('#strokeSlider').val(data.stroke_width);
      }

      this.setParams(data.params,data.id);
    },


    toggleFillStroke: function(event) {
      var id = event.target.id;
      if (id == 'fillColorBlock') {
        $('#strokeColorBlock').removeClass('color-block-selected');
        $('#fillColorBlock').addClass('color-block-selected');
        if (!$('#fillColorBlock').hasClass('remove-color')) {
          $('#color-window').iris('color', $('#fillColorBlock').css('background-color'));
        }
      } else {
        $('#strokeColorBlock').addClass('color-block-selected');
        $('#fillColorBlock').removeClass('color-block-selected');
        if (!$('#strokeColorBlock').hasClass('remove-color')) {
          $('#color-window').iris('color', $('#strokeColorBlock').css('background-color'));
        }
      }
    },

    strokeChange: function(event) {
      var value = parseInt($(event.target).val(), 10);
      this.model.styleModified({
        stroke_width: value
      });
    },

    paramChange: function(event) {
      var element = $(event.target);
      var value = +element.val();
      if(!isNaN(value)){
        var id = element.attr('inst_id');
        var property_name = element.attr('property_name');
        var data = {
          value: value,
          id: id,
          property_name: property_name
        };
        console.log('param change', data);
        this.model.geometryParamsModified(data);
      }

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
    setParams: function(userParams,id) {

      var paramSliders = [];
      var paramTexts = [];
      var behaviorParams = [];
      var context = {};
      console.log('userParams', userParams);

      if (userParams) {
        for (var i = 0; i < userParams.length; i++) {
            userParams[i].id = id;
          if (userParams[i].type === 'text_box') {
            paramTexts.push(userParams[i]);
          } else {
            console.log('slider val',userParams[i].val);
            paramSliders.push(userParams[i]);
          }
        }


        context = {
          paramSlider: paramSliders,
          paramText: paramTexts
        };
      }

      var html = template(context);
      $('#parameters').html(html);
      $('#parameterSlider').each(function() {
        var slider = $(this);
        console.log('actual slider val',slider.val());
        slider.on('input', function(slideEvt) {
          slider.trigger('param-change');
        });
      });
      $('#parameterText').each(function() {
        var text = $(this);

        text.keyup(function(e) {
          if (e.keyCode === 13) {
            text.trigger('param-change');
          }

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