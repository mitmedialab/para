/*PropertyView.js
 * controls updates to the property menu
 */

define([
  'jquery',
  'underscore',
  'backbone',
  'handlebars',
  'iris-color-picker',
  'paper',
  'utils/ColorUtils'
], function($, _, Backbone, Handlebars, IrisColorPicker, paper, ColorUtils) {

  var param_template, param_source;
  var stateSet = false;
  var handlerActive = true;
  var timeout;
  var selected_shape;
  var constraintTypeMap = {};
  constraintTypeMap['more-box'] = 'more';
  constraintTypeMap['more'] = 'more';
  constraintTypeMap['less-box'] = 'less';
  constraintTypeMap['less'] = 'less';
  constraintTypeMap['equal-box'] = 'equal';
  constraintTypeMap['equal-bottom'] = 'equal';
  constraintTypeMap['equal-top'] = 'equal';
  var PropertyView = Backbone.View.extend({
    //
    initialize: function() {
      //listen to update view statements from model to re-render view
      this.listenTo(this.model, 'removeItem', this.removeItem);
      this.listenTo(this.model, 'disableSave', this.disableSave);

      this.listenTo(this.model, 'selectShape', this.geometrySelected);
      this.listenTo(this.model, 'deselectAll', this.geometryDeselected);

      this.listenTo(this.model, 'selectionReset', this.selectionReset);

      this.listenTo(this.model, 'toolViewUpdate', this.update);
      this.currentPaths = [];
      param_source = $('#parameterTemplate').html();
      param_template = Handlebars.default.compile(param_source);
      var self = this;
      $('#fillColorBlock').addClass('color-block-selected');
      $('#fillColorBlock').css('background-color', 'white');
      $('#fill').val('#ffffff');
      $('#strokeColorBlock').css('background-color', 'black');
      $('#stroke').val('#000000');
      $('#opacitySlider').on('change mousemove', function() {
        window.clearTimeout(timeout);
        timeout = window.setTimeout(self.modificationEnded, 500, self);
        $('#opacitySlider').trigger('opacity-change');
      });
      $('#strokeSlider').on('change mousemove', function() {
        window.clearTimeout(timeout);
        timeout = window.setTimeout(self.modificationEnded, 500, self);
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
            if (handlerActive) {
              window.clearTimeout(timeout);
              timeout = window.setTimeout(self.modificationEnded, 500, self);
              $(this).trigger('colorChange', event, ui);
            }
          }
        });
      });

    },

    events: {

      'click #fillColorBlock': 'toggleFillStroke',
      'click #strokeColorBlock': 'toggleFillStroke',
      'click #no-color': 'clearColor',
      'change #fill': 'colorInputChange',
      'change #stroke': 'colorInputChange',
      'change #blend_mode': 'blendModeChange',
      'stroke-change': 'strokeChange',
      'opacity-change': 'opacityChange',
      'param-change': 'paramChange',
      'colorChange': 'colorChange',
      'mousedown #color-window': 'modificationStarted',
      // testing
    },

    removeBehavior: function(event) {
      var name = $(event.target).attr('id');
      this.model.removeBehavior(name);
    },

    setScaffold: function(event) {
      this.model.setScaffold(event.target.checked);
    },

    clearColor: function(event) {
      var data;
      if ($('#fillColorBlock').hasClass('color-block-selected')) {
        $('#fillColorBlock').addClass('remove-color');
        $('#fill').val("#");
        data = {
          fillColor: {
            noColor: true
          }
        };
        this.model.modifyStyle(data);

      } else {
        $('#strokeColorBlock').addClass('remove-color');
        $('#stroke').val("#");
        data = {
          strokeColor: {
            noColor: true
          }
        };
        this.model.modifyStyle(data);
      }
      stateSet = true;
      this.modificationEnded(this);
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
      data[(id + "_color")] = ColorUtils.hexToRGB(color);
      this.model.modifyStyle(data);

      stateSet = true;
      this.modificationEnded();
    },

    colorChange: function(event, ui) {
      var color = $('#color-window').iris('color');
      var data;
      if ($('#fillColorBlock').hasClass('color-block-selected')) {
        $('#fillColorBlock').removeClass('remove-color');
        $('#fillColorBlock').css('background-color', color);
        $('#fill').val(color);
        data = {
          fillColor: ColorUtils.hexToRGB(color)
        };
        this.model.modifyStyle(data);


      } else {
        $('#strokeColorBlock').removeClass('remove-color');
        $('#strokeColorBlock').css('background-color', color);
        $('#stroke').val(color);
        data = {
          strokeColor: ColorUtils.hexToRGB(color)
        };
        this.model.modifyStyle(data);

      }
    },

    update: function(view, data) {
      if (view == "constraint") {
        this.updateConstraintMenu(data);
      }
    },

    updateConstraintMenu: function(data) {
      for (var param in data) {
        if (param == "property") {
          var properties = $('.constraint-prop:not(#' + data[param] + ')');
          properties.attr('class', 'constraint-prop');
          var prop = $('#' + data[param] + '.constraint-prop');
          prop.attr('class', 'constraint-prop focus');
        }
        if (param == "type") {
          var types = $('.constraint-type:not(#' + data[param] + '-container)');
          types.attr('class', 'constraint-type');
          $('#' + data[param] + '.constraint-type').attr('class', 'constraint-type focus');
        }
        if (param == "expression") {
          var result = data[param];
          if (result == "true") {
            $('#expression').removeClass('invalid');
            $('#expression').addClass('valid');
          } else if (result == "false") {
            $('#expression').removeClass('valid');
            $('#expression').addClass('invalid');
          } else {
            $('#expression').attr('class', 'form-control expression');
          }
        }
      }
    },

    geometrySelected: function(sshape) {
      if (sshape) {
        selected_shape = sshape;
        $('#blend_mode').val(selected_shape.get('blendMode').getValue());
        this.undelegateEvents();
        var fillColor = selected_shape.getValueFor('fillColor');
        var strokeColor = selected_shape.getValueFor('strokeColor');
        var strokeWidth = selected_shape.getValueFor('strokeWidth');
        if (fillColor) {
          if (fillColor.noColor) {
            $('#fillColorBlock').addClass('remove-color');
          } else {
            $('#fillColorBlock').removeClass('remove-color');
            $('#fillColorBlock').css('background-color', ColorUtils.toHex(fillColor));
            $('#fill').val(ColorUtils.toHex(fillColor));
            if ($('#fillColorBlock').hasClass('color-block-selected')) {
              $('#color-window').iris('color', ColorUtils.toHex(fillColor));
              $('#opacitySlider').val(fillColor.a * 100);

            }
          }
        }
        if (strokeColor) {
          if (strokeColor.noColor) {
            $('#strokeColorBlock').addClass('remove-color');
          } else {
            $('#strokeColorBlock').removeClass('remove-color');
            $('#strokeColorBlock').css('background-color', ColorUtils.toHex(strokeColor));
            $('#stroke').val(ColorUtils.toHex(strokeColor));
            if ($('#strokeColorBlock').hasClass('color-block-selected')) {
              $('#color-window').iris('color', ColorUtils.toHex(strokeColor));
              $('#opacitySlider').val(strokeColor.a * 100);

            }
          }
        }
        if (strokeWidth) {
          $('#strokeSlider').val(strokeWidth);
        }
        this.setParams(selected_shape.get('userParams'), selected_shape.get('id'));
        this.delegateEvents();
      } else {
        this.geometryDeselected();
      }
    },

    geometryDeselected: function(data, params, id) {
      this.undelegateEvents();
      // this.clearParams(params,id);
      this.delegateEvents();
      selected_shape = null;

    },

    toggleFillStroke: function(event) {
      handlerActive = false;
      var id = event.target.id;
      if (id == 'fillColorBlock') {
        $('#strokeColorBlock').removeClass('color-block-selected');
        $('#fillColorBlock').addClass('color-block-selected');
        if (!$('#fillColorBlock').hasClass('remove-color')) {
          $('#color-window').iris('color', $('#fillColorBlock').css('background-color'));
          if (selected_shape) {
            $('#opacitySlider').val(selected_shape.get('fillColor').getValue().a * 100);
          } else {
            $('#opacitySlider').val(100);
          }

        }
      } else {
        $('#strokeColorBlock').addClass('color-block-selected');
        $('#fillColorBlock').removeClass('color-block-selected');
        if (!$('#strokeColorBlock').hasClass('remove-color')) {
          $('#color-window').iris('color', $('#strokeColorBlock').css('background-color'));
          if (selected_shape) {
            $('#opacitySlider').val(selected_shape.get('strokeColor').getValue().a * 100);
          } else {
            $('#opacitySlider').val(100);
          }
        }
      }
      handlerActive = true;
    },

    strokeChange: function(event) {
      var value = parseInt($(event.target).val(), 10);
      var data = {
        strokeWidth: {
          v: value,
          operator: 'set'
        }
      };
      this.model.modifyStyle(data);

      stateSet = true;
    },

    opacityChange: function(event) {
      var value = parseInt($(event.target).val(), 10);
      var data = {};
      if ($('#fillColorBlock').hasClass('color-block-selected')) {
        data.fillColor = {
          a: value / 100.0,
          operator: 'set'
        };

      } else {
        data.strokeColor = {
          a: value / 100.0,
          operator: 'set'
        };
      }
      this.model.modifyStyle(data);

      stateSet = true;
    },

     blendModeChange: function(event) {
      var value = Number($('#blend_mode').val());
      console.log('blend mode value=',value);
      var data = {blendMode: value};
      this.model.modifyStyle(data);
      stateSet = true;
    },


    // TESTING
    setConstraintProperty: function(event) {
      var element = $(event.target);
      var elementId = element.attr('id');
      // this.model.setConstraintProperty(constraintPropMap[elementId]);
    },

    setConstraintType: function(event) {
      var element = $(event.target);
      var elementId = element.attr('id');
      this.model.setConstraintType(constraintTypeMap[elementId]);

      // this.model.passEvent(tool, 'setConstraintType');
    },

    setConstraintExpression: function(event) {
      var element = $(event.target);
      var elementText = element.val();
      this.model.setConstraintExpression(elementText);
      // this.model.passEvent(tool, 'setConstraintExpression');
    },
    // END TESTING


    paramChange: function(event) {
      var element = $(event.target);
      var value = +element.val();
      if (!isNaN(value)) {
        var id = element.attr('inst_id');
        var property_name = element.attr('property_name');
        var data = {
          value: value,
          id: id,
          property_name: property_name
        };
        this.model.geometryParamsModified(data);

        stateSet = true;
      }
    },



    addSelectIndex: function(id, filename) {

      $('#fileselect').prepend('<option value=' + id + '>' + filename + '</option>');
      $('#fileselect option:first').prop('selected', true);
      $('#text-filename').val(filename);

    },


    removeItem: function(id) {
      $('#fileselect option[value=' + id + ']').remove();
    },



    clearParams: function() {
      var html = param_template({});
      var count = 0;
      $('#parameters').html(html);
    },

    //triggered when StateManager finds selection point
    setParams: function(userParams, id) {

      var paramSliders = [];
      var context = {};
      if (userParams) {
        for (var i = 0; i < userParams.length; i++) {
          userParams[i].id = id;
          paramSliders.push(userParams[i]);
        }
      }


      context = {
        paramSlider: paramSliders,
      };

      var html = param_template(context);
      var count = 0;
      $('#parameters').html(html);
      $('#parameterSliders input').each(function() {
        var slider = $(this);

        if (userParams) {
          slider.val(userParams[count].val);
        }
        count++;
        slider.on('input', function(slideEvt) {
          slider.trigger('param-change');
        });
      });
      $('#parameterTexts input').each(function() {
        var text = $(this);
        text.keyup(function(e) {
          if (e.keyCode === 13) {
            text.trigger('param-change');
          }

        });
      });


    },

    clearParameters: function() {
      this.currentPaths = [];
      $('#parameters').empty();

    },

    modificationEnded: function(self) {
      if (stateSet) {
        self.model.modificationEnded();
        stateSet = false;
      }
    },

    modificationStarted: function() {
      stateSet = true;
    }

  });

  return PropertyView;

});