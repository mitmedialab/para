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

      this.listenTo(this.model, 'geometrySelected', this.geometrySelected);
      this.listenTo(this.model, 'geometryDeselected', this.geometryDeselected);

      this.listenTo(this.model, 'selectionReset', this.selectionReset);

      this.listenTo(this.model, 'toolViewUpdate', this.update);
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
      'click .behaviorRemove': 'removeBehavior',
      'click #scaffold': 'setScaffold',
      // testing
    },

    removeBehavior: function(event) {
      var name = $(event.target).attr('id');
      this.model.removeBehavior(name);
    },

    setScaffold: function(event){
      this.model.setScaffold(event.target.checked);
    },

    clearColor: function(event) {
      var data;
      if ($('#fillColorBlock').hasClass('color-block-selected')) {
        $('#fillColorBlock').addClass('remove-color');
        $('#fill').val("#");
        data = { fill_color: -1};
        this.model.styleModified(data);
        this.model.setToolStyle(data);

      } else {
        $('#strokeColorBlock').addClass('remove-color');
        $('#stroke').val("#");
        data = { stroke_color: -1};
        this.model.styleModified(data);
        this.model.setToolStyle(data);
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
      this.model.setToolStyle(data);

    },

    colorChange: function(event, ui) {
      var color = $('#color-window').iris('color');
      var data;
      if ($('#fillColorBlock').hasClass('color-block-selected')) {
        $('#fillColorBlock').removeClass('remove-color');
        $('#fillColorBlock').css('background-color', color);
        $('#fill').val(color);
        data = { fill_color: color};
        this.model.styleModified(data);
        this.model.setToolStyle(data);



      } else {
        $('#strokeColorBlock').removeClass('remove-color');
        $('#strokeColorBlock').css('background-color', color);
        $('#stroke').val(color);
        data = {stroke_color: color};
        this.model.styleModified(data);
         this.model.setToolStyle(data);

      }


    },

    update: function( view, data ) {
      console.log('Updating view: ' + view + ' with data: ' + data);
      if ( view == "constraint" ) {
        this.updateConstraintMenu( data );
      } 
    },

    updateConstraintMenu: function( data ) {
      for ( var param in data ) {
        console.log('[INFO] Updating... Parameter: ' + param + ', Value: ' + data[param]);
        if ( param == "property" ) {
          var properties = $('.constraint-prop:not(#' + data[param] + ')');
          properties.attr('class', 'constraint-prop');
          var prop = $('#' + data[param] + '.constraint-prop');
          prop.attr('class', 'constraint-prop focus'); 
        }
        if ( param == "type" ) {
          var types = $('.constraint-type:not(#' + data[param] + '-container)');
          types.attr('class', 'constraint-type');
          $('#' + data[param] + '.constraint-type').attr('class', 'constraint-type focus');
        }
        if ( param == "expression" ) {
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

    geometrySelected: function(data,params,id) {
      this.undelegateEvents();
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
        $('#strokeSlider').val(data.stroke_width);
      }

      this.setParams(params,id);
      this.delegateEvents();  
    },

   geometryDeselected: function(data,params,id) {
      this.undelegateEvents();
      this.clearParams(params,id);
      this.delegateEvents();  
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
      var data = {stroke_width: {val:value, operator:'set'}};
      this.model.styleModified(data);
      this.model.setToolStyle(data);
    },

    // TESTING
    setConstraintProperty: function(event) {
      var element = $(event.target);
      var elementId = element.attr('id');
      console.log('Registered click from: ' + elementId);
      this.model.setConstraintProperty(constraintPropMap[elementId]);
    },

    setConstraintType: function(event) {
      var element = $(event.target);
      var elementId = element.attr('id');
      console.log('Registered click from: ' + elementId);
      this.model.setConstraintType(constraintTypeMap[elementId]);
      // this.model.passEvent(tool, 'setConstraintType');
    },

    setConstraintExpression: function(event) {
      var element = $(event.target);
      var elementText = element.val();
      console.log('Registered expression input change: ' + elementText);
      this.model.setConstraintExpression(elementText);
      // this.model.passEvent(tool, 'setConstraintExpression');
    },
    // END TESTING
    

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


    clearParams: function(){
       var html = template({});
      var count = 0;
      $('#parameters').html(html);
    },

    //triggered when StateManager finds selection point
    setParams: function(userParams,id) {

      var paramSliders = [];
      var paramTexts = [];
      var behaviorParams = [];
      var context = {};

      if (userParams) {
        for (var i = 0; i < userParams.length; i++) {
            userParams[i].id = id;
          if (userParams[i].type === 'text_box') {
            paramTexts.push(userParams[i]);
          } else {
            paramSliders.push(userParams[i]);
          }
        }


        context = {
          paramSlider: paramSliders,
          paramText: paramTexts
        };
      }

      var html = template(context);
      var count = 0;
      $('#parameters').html(html);
      $('#parameterSliders input').each(function() {
        var slider = $(this);

        if(userParams){
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

    }

  });

  return PropertyView;

});
