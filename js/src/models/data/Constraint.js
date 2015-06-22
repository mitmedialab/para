define([
  'underscore',
  'paper',
  'backbone',
  'models/data/ListNode',
  'models/data/paperUI/Arrow',
  'models/data/paperUI/ConstraintHandles',
], function(_, paper, Backbone, ListNode, Arrow, ConstraintHandles) {

  var propConvMap = {
    'position:scale': 0.01,
    'position:position': 1,
    'position:rotation': 1,
    'position:fill': 0.01,
    'position:stroke': 0.01,
    'scale:position': 100,
    'scale:scale': 1,
    'scale:rotation': 100,
    'scale:fill': 1,
    'scale:stroke': 1,
    'rotation:position': 1,
    'rotation:scale': 0.01,
    'rotation:rotation': 1,
    'rotation:fill': 0.01,
    'rotation:stroke': 0.01,
    'fill:fill': 1,
    'fill:stroke': 1,
    'fill:scale': 1,
    'fill:rotation': 100,
    'fill:position': 100,
    'stroke:fill': 1,
    'stroke:stroke': 1,
    'stroke:scale': 1,
    'stroke:rotation': 100,
    'stroke:position': 100,

  };
  var constraintPropMap = {
    'position': 'translation_delta',
    'scale': 'scaling_delta',
    'rotation': 'rotation_delta',
    'fill': 'fill_color',
    'stroke': 'stroke_color'
  };

  var dimension_map = {
    'position': 2,
    'scale': 2,
    'rotation': 1,
    'fill': 3,
    'stroke': 3
  };


  var Constraint = Backbone.Model.extend({

    defaults: {
      id: null,

      // properties
      references: null,
      relatives: null,
      ref_type: 'shape',
      rel_type: 'shape',
      ref_prop: 'position_xy',
      rel_prop: 'position_xy',
      expression: '',
      type: '=',

      // UI
      proxy: null,
      ref_handle: null,
      rel_handle: null,
      commit_box: null,

      // derived state
      constraintFuncs: null
    },

    initialize: function() {

      this.set('proxy', new paper.Path());
      this.set('ref_handle', new ConstraintHandles({
        constraint: this,
        side: 'ref',
        color: '#fc9917'
      }));
      this.set('rel_handle', new ConstraintHandles({
        constraint: this,
        side: 'rel',
        color: '#9717fc'
      }));
    },

    setSelection: function(instance, type) {
      if (this.get('references') && this.get('relatives')) {
        console.log('[ERROR] References and relatives already set.');
      }
      if (instance.length === 0) {
        if (this.get('relatives')) {
          this.set('relatives', null);
          return false;
        } else {
          return false;
        }
      }
      instance = instance[0];
      instance.set('selected', false);
      if (this.get('relatives')) {
        if(this.get('references')){
           this.get('references').set('constraint_selected',undefined);

        }
        this.set('references', instance);
        instance.set('constraint_selected','reference_selected');
        console.log('constraint-constraint_selected',instance.get('constraint_selected'));

        this.set('ref_type', type);

        // create proxy with important logic // TODO: maybe class it?
        var constraint = this;
        var relatives = this.get('relatives');
        var references = this.get('references');
        var rel_geom = relatives.get('geom');
        var ref_geom = references.get('geom');

        //start of the proxy code: try to remove this //
        var proxy = relatives.getShapeClone();
        proxy.name = 'proxy';
        proxy.visible = false;
        proxy.show = function() {
          relatives.hide();
          proxy.visible = true;
        };
        proxy.hide = function() {
          relatives.show();
          proxy.visible = false;
        };
        proxy.reset = function() {
          if (this instanceof paper.Group) {
            var check_rels = relatives.getInstanceMembers();
            for (var i = 0; i < this.children.length; i++) {
              this.children[i].scaling = 1;
              this.children[i].rotation = check_rels[i].get('geom').rotation;
              this.children[i].position = check_rels[i].get('geom').position;
            }
          } else {
            this.scaling = 1;
            this.rotation = rel_geom.rotation;
            this.position = rel_geom.position;
          }
          paper.view.draw();
        };
        proxy.matchProperty = function(ref_prop, rel_prop) {
          var refPropValue, relPropValue;


          var ref_dimensions = ref_prop.split('_').length > 1 ? ref_prop.split('_')[1] : ['v'];
          var rel_dimensions = rel_prop.split('_').length > 1 ? rel_prop.split('_')[1] : ['v'];
          console.log('ref_dimensions', ref_dimensions, ref_dimensions.length, 'rel_dimensions', rel_dimensions, rel_dimensions.length);

          var propSwitch = function(prop, side) {
            console.log('prop value', prop, side);
            var propValue, geom, instance;
            if (side == 'ref') {
              geom = ref_geom;
              instance = references;
            }
            if (side == 'rel') {
              geom = proxy;
               instance = relatives;
            }
            switch (prop) {
              case 'scale_x':
                propValue = instance.accessProperty('scaling_delta').x;
                break;
              case 'scale_y':
                propValue =instance.accessProperty('scaling_delta').y;
                break;
              case 'scale_xy':
                propValue = instance.accessProperty('scaling_delta');
                break;
              case 'position_x':
                propValue = geom.position.x;
                break;
              case 'position_y':
                propValue = geom.position.y;
                break;
              case 'position_xy':
                propValue = {
                  x: geom.position.x,
                  y: geom.position.y
                };
                break;
              case 'fill_h':
                propValue = geom.fillColor.hue;
                break;
              case 'fill_s':
                propValue = geom.fillColor.saturation;
                break;
              case 'fill_l':
                propValue = geom.fillColor.brightness;
                break;
              case 'fill_hs':
                propValue = {
                  h: geom.fillColor.hue,
                  s: geom.fillColor.saturation
                };
                break;
              case 'fill_sl':
                propValue = {
                  s: geom.fillColor.saturation,
                  l: geom.fillColor.brightness
                };
                break;
              case 'fill_hl':
                propValue = {
                  h: geom.fillColor.hue,
                  l: geom.fillColor.brightness,
                };
                break;
              case 'fill_hsl':
                propValue = {
                  h: geom.fillColor.hue,
                  s: geom.fillColor.saturation,
                  l: geom.fillColor.brightness,
                };
                break;
              case 'stroke_h':
                propValue = geom.fillColor.hue;
                break;
              case 'stroke_s':
                propValue = geom.fillColor.saturation;
                break;
              case 'stroke_l':
                propValue = geom.fillColor.brightness;
                break;
              case 'stroke_hs':
                propValue = {
                  h: geom.fillColor.hue,
                  s: geom.fillColor.saturation
                };
                break;
              case 'stroke_sl':
                propValue = {
                  s: geom.fillColor.saturation,
                  l: geom.fillColor.brightness
                };
                break;
              case 'stroke_hl':
                propValue = {
                  h: geom.fillColor.hue,
                  l: geom.fillColor.brightness,
                };
                break;
              case 'stroke_hsl':
                propValue = {
                  h: geom.fillColor.hue,
                  s: geom.fillColor.saturation,
                  l: geom.fillColor.brightness,
                };
                break;
              case 'rotation':
                propValue = instance.accessProperty('rotation_delta');
                break;
            }
            return propValue;
          };
          refPropValue = propSwitch(ref_prop, 'ref');
          relPropValue = propSwitch(rel_prop, 'rel');

          var ref_prop_strip = ref_prop.split('_')[0];
          var rel_prop_strip = rel_prop.split('_')[0];
          var convertFactor = propConvMap[ref_prop_strip + ':' + rel_prop_strip];
          var conversion = {};
          var offset = {};
          var keys;

          if (ref_dimensions.length === rel_dimensions.length) {
            console.log('dimensions are equal');
            if (ref_dimensions.length == 1) {
              conversion = refPropValue * convertFactor;
              offset[rel_dimensions[0]] = relPropValue - conversion;

              console.log('refPropValue', refPropValue, 'conversion', conversion);
            } else {

              for (var i = 0; i < rel_dimensions.length; i++) {
                console.log('refPropValue', refPropValue, ref_dimensions[i],
                  'convert factor:', convertFactor);
                conversion[rel_dimensions[i]] = refPropValue[ref_dimensions[i]] * convertFactor;
                offset[rel_dimensions[i]] = relPropValue[rel_dimensions[i]] - conversion[rel_dimensions[i]];
              }

            }
          } else if (ref_dimensions.length > rel_dimensions.length) {
            if (rel_dimensions.length == 1) {
              keys = Object.keys(refPropValue);
              conversion = (rel_prop_strip == 'rotation') ? refPropValue[keys[0]] * convertFactor : refPropValue[rel_prop.split('_')[1]] * convertFactor;
              offset[rel_dimensions[0]] = relPropValue - conversion;
            } else {
              for (var j = 0; j < rel_dimensions.length; j++) {
                conversion[rel_dimensions[j]] = (refPropValue[rel_dimensions[j]]) ? refPropValue[rel_dimensions[j]] * convertFactor : refPropValue[keys[j]] * convertFactor;
                offset[rel_dimensions[j]] = relPropValue[rel_dimensions[j]] - conversion[rel_dimensions[j]];
              }
            }
          } else if (ref_dimensions.length < rel_dimensions.length) {
            if (ref_dimensions.length == 1) {
              for (var k = 0; k < rel_dimensions.length; k++) {
                conversion[rel_dimensions[k]] = refPropValue * convertFactor;
                offset[rel_dimensions[k]] = relPropValue[rel_dimensions[k]] - conversion[rel_dimensions[k]];
              }
            } else {
              keys = Object.keys(refPropValue);
              for (var m = 0; m < rel_dimensions.length; m++) {
                conversion[rel_dimensions[m]] = (refPropValue[rel_dimensions[m]]) ? refPropValue[rel_dimensions[m]] * convertFactor : (m < keys.length) ? refPropValue[keys[m]] * convertFactor : refPropValue[keys[keys.length - 1]];
                offset[rel_dimensions[m]] = relPropValue[rel_dimensions[m]] - conversion[rel_dimensions[m]];
              }
            }
          }

          console.log('offset', offset, 'conversion', conversion);
          var exp_scale = 'y = ' + convertFactor.toString() + ' * ' + 'x';
          var exp_object = {};
          for (var axis in offset) {
            if (offset.hasOwnProperty(axis)) {
              exp_object[axis] = exp_scale + ' + ' + offset[axis].toString();
            }
          }
          console.log('expression object', exp_object);
          constraint.set('expression', exp_object);
        };

        this.set('proxy', proxy);
        this.set('id', (references.get('id') + ':' + relatives.get('id')));
        return true;
      }
      if(this.get('relatives')){
           this.get('relatives').set('constraint_selected',undefined);

        }
      this.set('relatives', instance);
      instance.set('constraint_selected','relative_selected');
      this.set('rel_type', type);
      return false;
    },


    create: function() {
      console.log('rel_prop', this.get('rel_prop'));
      console.log('ref_prop', this.get('ref_prop'));

      var ref_prop = this.get('ref_prop').split('_');
      var ref_available_props = ref_prop[1];
      var rel_prop = this.get('rel_prop').split('_');

      //TODO: refactor- this addition is a little hacky, it's so it recognizes rotation as having the same num of properties..
      var ref_dimensions = this.get('ref_prop').split('_').length > 1 ? this.get('ref_prop').split('_')[1] : ['v'];
      var rel_dimensions = this.get('rel_prop').split('_').length > 1 ? this.get('rel_prop').split('_')[1] : ['v'];

      var reference = this.get('references');
      var relative = this.get('relatives');
      var expression = this.get('expression');
      var expression_dimension_num = Object.keys(expression).length;

      console.log('expression=', expression, expression_dimension_num);

      var refPropAccess = reference.get(constraintPropMap[ref_prop[0]]);
      var relPropAccess = relative.get(constraintPropMap[rel_prop[0]]);
      console.log('refPropAccess', refPropAccess);
      console.log('relPropAccess', relPropAccess);
      console.log('ref_dimensions length', ref_dimensions.length, 'dimension_num', refPropAccess.get('dimension_num'), expression);
      /* if (ref_dimensions.length === rel_dimensions.length && ref_dimensions.length < refPropAccess.get('dimension_num')) {
              constraintF = function() {
                var x = (ref_prop[0] == 'rotation') ? refPropAccess.getValue() : refPropAccess[ref_prop[1]].getValue();
                var y, relPropObj;
                eval(expression['x']);
                if (rel_prop[0] == 'rotation') {
                  relPropAccess.setValue(y);
                  relPropObj = y;
                } else {
                  relPropAccess[rel_prop[1]].setValue(y);
                }
                return y;
              };

            }
          

          if (ref_dimensions.length === rel_dimensions.length && ref_dimensions.length < refPropAccess.get('dimension_num')) {
              var value = refPropAccess.getValue();
              constraintF = function() {
              for (var prop in value) {
               
                if(expression[prop]){
                  var x = refPropAccess[axis].getValue();
                  console.log('x-val', x, axis);
                  var y;
                  eval(expression[axis]);
                  console.log('y-val', y);
                  evalObj[prop] = y;
                }
                else{
                  evalObj[prop] = value[]
                }
              }
                console.log('evalObj', evalObj);
                relPropAccess.setValue(evalObj);
                return evalObj;


                var x = (ref_prop[0] == 'rotation') ? refPropAccess.getValue() : refPropAccess[ref_prop[1]].getValue();
                var y, relPropObj;
                eval(expression['x']);
                if (rel_prop[0] == 'rotation') {
                  relPropAccess.setValue(y);
                  relPropObj = y;
                } else {
                  relPropAccess[rel_prop[1]].setValue(y);
                }
                return y;
              };

            }*/
      /*if (ref_dimensions.length > rel_dimensions.length && rel_dimensions.length < relPropAccess.get('dimension_num')) {

        constraintF = function() {
          var refPropValue = refPropAccess.getValue();
          console.log('rel prop value', rel_prop[1]);
          var keys = Object.keys(refPropAccess.getValue());
          var x = (rel_prop[0] == 'rotation') ? refPropAccess.getValue()[keys[0]] : refPropAccess[rel_prop[1]].getValue();
          console.log('keys', keys, 'value', refPropAccess.getValue(), 'x:', x);
          var y;
          eval(expression['x']);
          if (rel_prop[0] == 'rotation') {
            relPropAccess.setValue(y);
          } else {
            relPropAccess[rel_prop[1]].setValue(y);
          }
          return y;
        };
      } else if (ref_dimensions.length < rel_dimensions.length && refPropAccess.get('dimension_num') < 2) {
        constraintF = function() {
          var evalObj = {};
          var x = (ref_prop[0] == 'rotation') ? refPropAccess.getValue() : refPropAccess[ref_prop[1]].getValue();
          for (var axis in expression) {
            var y;
            eval(expression[axis]);
            evalObj[axis] = y;
          }
          relPropAccess.setValue(evalObj);
          return evalObj;
        };
      } */
      if (expression_dimension_num < relPropAccess.get('dimension_num')) {
        var constraintFunctions = [];
        var a_keys = Object.keys(expression);
        for (var i = 0; i < a_keys.length; i++) {
          var axis = a_keys[i];
          var ap = (ref_available_props && ref_available_props[i]) ? ref_available_props[i] : (!ref_available_props) ? undefined: ref_available_props[ref_available_props.length - 1];
          var cf = (function(d, a) {
            return function() {
              var x = (a === 'v' || !a) ? refPropAccess.getValue() : refPropAccess[a].getValue();
              console.log('x-val', x, d);
              var y;
              eval(expression[d]);
              console.log('y-val', y, d);
              if (d !== 'v') {
                relPropAccess[d].setValue(y);
              } else {
                relPropAccess.setValue(y);
              }
              return y;
            };
          })(axis, ap);

          constraintFunctions.push(cf);
          console.log('setting constraint on', axis, relPropAccess[axis], cf);
          if (axis !== 'v') {
            relPropAccess[axis].setConstraint(cf);
            relPropAccess[axis].getConstraint();

          } else {
            relPropAccess.setConstraint(cf);
            relPropAccess.getConstraint();

          }
        }

        this.set('constraintFunc', constraintFunctions);
        console.log('constraintFunctions', constraintFunctions);
      } else {
        var constraintF = function() {
          var evalObj = {};
          var a_keys = Object.keys(expression);
          for (var i = 0; i < a_keys.length; i++) {
            var axis = a_keys[i];
            var ap = (ref_available_props && ref_available_props[i]) ? ref_available_props[i] : (!ref_available_props) ? undefined: ref_available_props[ref_available_props.length - 1];
            var x = (ap === 'v' || !ap) ? refPropAccess.getValue() : refPropAccess[ap].getValue();
            console.log('x-val', x, axis);
            var y;
            eval(expression[axis]);
            console.log('y-val', y);
            evalObj[axis] = y;
          }
          console.log('evalObj', evalObj, 'd-num',relPropAccess.get('dimension_num'));
          if (relPropAccess.get('dimension_num') > 1) {
            console.log('setting value as object');
            relPropAccess.setValue(evalObj);
            return evalObj;
          } else {
            console.log('setting value as value',evalObj['v']);
            relPropAccess.setValue(evalObj['v']);

            console.log('getting value=',relPropAccess.getValue());
            return evalObj['v'];
          }

          
        };
        relPropAccess.setConstraint(constraintF);
        console.log('setting constraint on entire object');
        this.set('constraintFunc', [constraintF]);
        relative.getConstraint();
      }
    },

    clearUI: function() {
      this.get('proxy').hide();
      this.get('proxy').remove();
      this.get('ref_handle').remove();
      this.get('rel_handle').remove();
      this.set('proxy', null);
      this.set('ref_handle', null);
      this.set('rel_handle', null);
    },

    remove: function() {
      // remove all paper UI elements
      // trigger nullification / deletion of all references
    },

    reset: function() {
      if(this.get('references')){
           this.get('references').set('constraint_selected',undefined);

        }
        if(this.get('relatives')){
           this.get('relatives').set('constraint_selected',undefined);

        }
      this.clear().set(this.defaults);
    }

  });

  return Constraint;
});