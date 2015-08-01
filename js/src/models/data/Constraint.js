define([
  'underscore',
  'paper',
  'backbone',
  'models/data/paperUI/ConstraintHandles',
  'utils/PFloat',
  'utils/TrigFunc',
], function(_, paper, Backbone, ConstraintHandles, PFloat, TrigFunc) {

  var propConvMap = {
    'translationDelta:scalingDelta': 0.01,
    'translationDelta:translationDelta': 1,
    'translationDelta:rotationDelta': 1,
    'translationDelta:fillColor': 0.01,
    'translationDelta:strokeColor': 0.01,
    'scalingDelta:translationDelta': 100,
    'scalingDelta:scalingDelta': 1,
    'scalingDelta:rotationDelta': 100,
    'scalingDelta:fillColor': 1,
    'scalingDelta:strokeColor': 1,
    'rotationDelta:translationDelta': 1,
    'rotationDelta:scalingDelta': 0.01,
    'rotationDelta:rotationDelta': 1,
    'rotationDelta:fillColor': 0.01,
    'rotationDelta:strokeColor': 0.01,
    'fillColor:fillColor': 1,
    'fillColor:strokeColor': 1,
    'fillColor:scalingDelta': 1,
    'fillColor:rotationDelta': 100,
    'fillColor:translationDelta': 100,
    'strokeColor:fillColor': 1,
    'strokeColor:strokeColor': 1,
    'strokeColor:scalingDelta': 1,
    'strokeColor:rotationDelta': 100,
    'strokeColor:translationDelta': 100,

  };

  var minMaxMap = {
    translationDelta: {
      x: {
        min: 0,
        max: 1000
      },
      y: {
        min: 0,
        max: 1000
      }
    },
    scalingDelta: {
      x: {
        min: 0,
        max: 5
      },
      y: {
        min: 0,
        max: 5
      }
    },
    rotationDelta: {
      v: {
        min: 0,
        max: 360
      }
    },
    fillColor: {
      h: {
        min: 0,
        max: 360
      },
      s: {
        min: 0,
        max: 1
      },
      l: {
        min: 0,
        max: 1
      }
    },
    strokeColor: {
      h: {
        min: 0,
        max: 360
      },
      s: {
        min: 0,
        max: 1
      },
      l: {
        min: 0,
        max: 1
      }
    },
  };

  var dimension_map = {
    'translationDelta': 2,
    'scalingDelta': 2,
    'rotationDelta': 1,
    'fillColor': 3,
    'strokeColor': 3
  };


  var Constraint = Backbone.Model.extend({

    defaults: {
      id: null,

      // properties
      references: null,
      relatives: null,
      ref_type: 'shape',
      rel_type: 'shape',
      ref_prop: null,
      rel_prop: null,
      ref_dimensions:null,
      rel_dimension:null,
      rel_prop_key:null,
      ref_prop_key:null,
      expression: '',

      // UI
      proxy: null,
      ref_handle: null,
      rel_handle: null,
      commit_box: null,

      // derived state
      constraintFuncs: null,
      name: 'constraint',
      type: 'constraint',
      ref_value_list: null,
      ref_value: null,
      min: null,
      max: null,
      functionPath: null,
      offset: null,
      map_operand: null,
      operators: null,
      current_dimension: null,
    },

    initialize: function() {
      var self = this;

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
      this.set('id', this.get('type') + '_' + new Date().getTime().toString());



      var start = new paper.Segment(new paper.Point(0, 175 / 2));
      var end = new paper.Segment(new paper.Point(175, 175 / 2));
      var functionPath = new paper.Path();

      functionPath.add(start);
      functionPath.add(end);
      functionPath.strokeColor = new paper.Color(0, 0, 0);
      functionPath.strokeWidth = 2;
      functionPath.name = 'functionPath';
      functionPath.remove();
      this.set('functionPath', functionPath);

      var ref_value = new PFloat(0);
      ref_value.setNull(false);

      var refF = function() {
        if (self.get('relatives')) {
          var value = self.getReferenceValue(self.get('relatives').get('index').getValue(), self.get('current_dimension'));
          ref_value.setValue(value);
          return value;
        }
        return ref_value.getValue();
      };

      ref_value.setConstraint(refF);
      this.set('ref_value', ref_value);

      this.set('ref_value_list', []);
      this.set('map_operand', '+');

      this.set('operators', {
        '+': function(a, b) {
          return a + b;
        },
        '-': function(a, b) {
          return a - b;
        },
        '*': function(a, b) {
          return a * b;
        },
        '/': function(a, b) {
          return a / b;
        }
      });

    },

    setSelection: function(selected, type) {

      if (this.get('references') && this.get('relatives')) {
        console.log('[ERROR] References and relatives already set.');
      }
      if (selected.length === 0) {
        if (this.get('relatives')) {
          this.clearSelection();
          this.set('relatives', null);
          return false;
        } else {
          return false;
        }
      }
      var instance = selected[0];
      instance.set('selected', false);
      if (this.get('relatives')) {
        if (this.get('references')) {
          this.get('references').set('constraint_selected', undefined);

        }
        this.set('references', instance);
        instance.set('constraint_selected', 'reference_selected');
        this.set('ref_type', type);

        // create proxy with important logic // TODO: maybe class it?
        var constraint = this;
        var relatives = this.get('relatives');
        var references = this.get('references');
        var rel_geom = relatives.get('geom');
        var ref_geom = references.get('geom');

        //start of the proxy code: try to remove this //
        var proxy = relatives.getShapeClone();
        var targetLayer = paper.project.layers.filter(function(layer) {
          return layer.name === 'geometry_layer';
        })[0];
        targetLayer.addChild(proxy);
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

        this.set('proxy', proxy);

        return true;
      }
      if (this.get('relatives')) {
        this.get('relatives').set('constraint_selected', undefined);
      }

      this.set('relatives', instance);
      instance.set('constraint_selected', 'relative_selected');
      this.set('rel_type', type);
      return false;
    },


    setOffset: function(ref_prop_key,ref_dimensions,rel_prop_key,rel_dimensions) {

      var convertFactor = propConvMap[ref_prop_key + ':' + rel_prop_key];

      var refPropValue = this.propSwitch(ref_prop_key,ref_dimensions,this.get('references'));
      var relPropValue;
      var conversion = {};
      var offset = this.get('offset') ? this.get('offset') : {};
      var keys;
      var offsetLength = offset[rel_dimensions[0]] ? offset[rel_dimensions[0]].length : 0;
      var relativeRange = this.get('relatives').getRange() - offsetLength;

      if (ref_dimensions.length === rel_dimensions.length) {

          for (var i = 0; i < rel_dimensions.length; i++) {
            offset[rel_dimensions[i]] = offset[rel_dimensions[i]] ? offset[rel_dimensions[i]] : [];
            for (var p = 0; p < relativeRange; p++) {
              var instance = this.get('relatives');
             if (this.get('relatives').get('type') === 'collection') {
              instance = instance.members[p];
            } 
              relPropValue = this.propSwitch(rel_prop_key, rel_dimensions, instance);
              console.log('relPropValue',relPropValue);
              conversion[rel_dimensions[i]] = refPropValue[ref_dimensions[i]] * convertFactor;
              console.log('conversion=' ,conversion[rel_dimensions[i]]);
              offset[rel_dimensions[i]].push(relPropValue[rel_dimensions[i]] - conversion[rel_dimensions[i]]);
              console.log('offset prop value =' ,relPropValue[rel_dimensions[i]]);
            }
          }
      } else if (ref_dimensions.length > rel_dimensions.length) {
          for (var j = 0; j < rel_dimensions.length; j++) {
            offset[rel_dimensions[j]] = offset[rel_dimensions[j]] ? offset[rel_dimensions[j]] : [];
            for (var t = 0; t < relativeRange; t++) {
               var instance = this.get('relatives');
             if (this.get('relatives').get('type') === 'collection') {
              instance = instance.members[t];
            } 
              relPropValue = this.propSwitch(rel_prop_key, rel_dimensions, instance);
              conversion[rel_dimensions[j]] = (refPropValue[rel_dimensions[j]]) ? refPropValue[rel_dimensions[j]] * convertFactor : refPropValue[keys[j]] * convertFactor;
              offset[rel_dimensions[j]].push(relPropValue[rel_dimensions[j]] - conversion[rel_dimensions[j]]);
            }
          }
        
      } else if (ref_dimensions.length < rel_dimensions.length) {
          keys = Object.keys(refPropValue);
          for (var m = 0; m < rel_dimensions.length; m++) {
            offset[rel_dimensions[m]] = offset[rel_dimensions[m]] ? offset[rel_dimensions[m]] : [];
            for (var s = 0; s < relativeRange; s++) {
              conversion[rel_dimensions[m]] = (refPropValue[rel_dimensions[m]]) ? refPropValue[rel_dimensions[m]] * convertFactor : (m < keys.length) ? refPropValue[keys[m]] * convertFactor : refPropValue[keys[keys.length - 1]];
              offset[rel_dimensions[m]].push(relPropValue[rel_dimensions[m]] - conversion[rel_dimensions[m]]);
            }
          }
        
      }


      if (relativeRange < 0) {
        for (var v = 0; v < 0 - relativeRange; v++) {
          for (var prop in offset) {
            if (offset.hasOwnProperty(prop)) {
              offset[prop].pop();
            }
          }
        }
      }
     
      return {offset:offset, convertFactor:convertFactor};
    },

    matchProperty: function(ref_prop_key,ref_dimensions,rel_prop_key,rel_dimensions) {

      var data = this.setOffset(ref_prop_key,ref_dimensions,rel_prop_key,rel_dimensions);
      var convertFactor = data.convertFactor;

      var offset = data.offset;
      this.set('offset', offset);

      var exp_scale = 'y =' + convertFactor.toString() + ' * ' + 'x';
      var exp_object = {};
      for (var axis in offset) {
        if (offset.hasOwnProperty(axis)) {
          exp_object[axis] = exp_scale + ' + ' + 'offsetValue'; //offset[axis].toString()';
        }
      }
      this.set('expression', exp_object);
      console.log('expression',exp_object,'offset',offset);
    },


    propSwitch: function( propName, subprops, instance) {
      console.log('propName subprops',propName,subprops);
      var instance_value = instance.getValue();
      var propValue = {};
      for (var i = 0; i < subprops.length; i++) {
        if (propValue[propName] === undefined) {
          propValue[propName] = {};
        }
        if (typeof instance_value[propName] === 'number') {
          propValue[propName][subprops[i]] = instance_value[propName];
        } else {
          propValue[propName][subprops[i]] = instance_value[propName][subprops[i]];
        }
      }
      return propValue;
    },

    create: function() {
      var ref_prop = this.get('ref_prop');
      var rel_prop = this.get('rel_prop');
      var refSplit = ref_prop.split('_');
      var relSplit = rel_prop.split('_');
      var ref_dimensions = refSplit[1];
      var rel_dimensions = relSplit[1];
      var ref_prop_key = refSplit[0];
      var rel_prop_key = relSplit[0];
      console.log('ref dimensions, refSplit, refpropkey',ref_dimensions,refSplit,ref_prop_key);
      this.set('ref_dimensions',ref_dimensions);
      this.set('rel_dimensions',rel_dimensions);
      this.set('ref_prop_key',ref_prop_key);
      this.set('rel_prop_key',rel_prop_key);

      this.matchProperty(ref_prop_key,ref_dimensions,rel_prop_key,rel_dimensions);


      this.get('proxy').hide();
      this.clearUI();
      this.clearSelection();

      var self = this;

      var reference = this.get('references');
      var relative = this.get('relatives');
      var expression = this.get('expression');
      var expression_dimension_num = Object.keys(expression).length;



      var refPropAccess = reference.get(ref_prop_key);
      var relPropAccess = relative.get(rel_prop_key);

      console.log('ref prop target', ref_prop_key, refPropAccess.get('name'));

      this.calculateReferenceValues();

      if (expression_dimension_num < relPropAccess.get('dimension_num')) {
        var constraintFunctions = [];
        var a_keys = Object.keys(expression);

        for (var i = 0; i < a_keys.length; i++) {
          var axis = a_keys[i];
          var ap = (ref_dimensions && ref_dimensions[i]) ? ref_dimensions[i] :  ref_dimensions[ref_dimensions.length - 1];
          var cf = (function(d, a) {
            self.set('current_dimension', a);
            return function() {
              var x = self.get('ref_value').getValue();
              var offset = self.get('offset');
              var operators = self.get('operators');
              var mapOperand = self.get('map_operand');
              var offsetValue = 0; //offset[axis][relative.get('index').getValue()];
              var y;
              eval(expression[d]);
              if (d !== 'v') {
                relPropAccess[d].setValue(y);
              } else {
                relPropAccess.setValue(y);
              }
              return y;
            };
          })(axis, ap);

          constraintFunctions.push(cf);
          if (axis !== 'v') {
            relPropAccess[axis].setConstraint(cf);
            relPropAccess[axis].getConstraint();

          } else {
            relPropAccess.setConstraint(cf);
            relPropAccess.getConstraint();

          }
        }

        this.set('constraintFunc', constraintFunctions);
      } else {
        var constraintF = function() {
          var evalObj = {};
          var a_keys = Object.keys(expression);
          for (var m = 0; m < a_keys.length; m++) {

            var axis = a_keys[m];
            var ap = (ref_dimensions && ref_dimensions[m]) ? ref_dimensions[m] :  ref_dimensions[ref_dimensions.length - 1];
            self.set('current_dimension', ap);
            var operators = self.get('operators');
            var mapOperand = self.get('map_operand');
            var x = self.get('ref_value').getValue();
            var offset = self.get('offset');
            var offsetValue = 0; //offset[axis][relative.get('index').getValue()];
            var y;
            eval(expression[axis]);
            evalObj[axis] = y;
          }
          if (relPropAccess.get('dimension_num') > 1) {
            relPropAccess.setValue(evalObj);
            return evalObj;
          } else {
            relPropAccess.setValue(evalObj['v']);
            return evalObj['v'];
          }


        };
        relPropAccess.setConstraint(constraintF);
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

    clearSelection: function() {
      if (this.get('references')) {
        this.get('references').set('constraint_selected', undefined);

      }
      if (this.get('relatives')) {
        this.get('relatives').set('constraint_selected', undefined);

      }
    },

    remove: function() {
      // remove all paper UI elements
      // trigger nullification / deletion of all references
    },

    reset: function() {
      this.clear().set(this.defaults);
    },


    /* functions for getting and setting info related to mapping */
    setMin: function(val) {
      this.set('min', val);
    },
    setMax: function(val) {
      this.set('max', val);
    },

    getMin: function() {
      return this.get('min');
    },

    getMax: function() {
      return this.get('max');
    },



    getReferenceValue: function(index, dimension) {
      this.calculateReferenceValues();
      console.log('dimension', dimension);
      var ref_prop = this.get('ref_prop_key');
      console.log('ref_prop', ref_prop, 'reference', this.get('references'), 'property', this.get('references').getValueFor(ref_prop));
      var refPropAccess = this.get('references').get(ref_prop);

      console.log('isValid:', refPropAccess.isValid() + this.get('references').get('id'));
      var ref_values = this.get('ref_value_list');
      //console.log('reference value index,dimension', index, dimension,ref_values,ref_values[dimension][index]);

      return ref_values[dimension][index];
      //if(a === 'v' || !a) ? refPropAccess.getValue() : refPropAccess[a].getValue();
    },

    setRefValueLength: function() {
      var valueList = this.get('ref_value_list');
      if (valueList.length === 0) {
        valueList.push(1);
      }
      var diff = valueList.length - this.get('relatives').getRange();
      if (diff > 0) {
        for (var i = 0; i < diff; i++) {
          valueList.pop();

        }
      } else if (diff < 0) {
        for (var j = 0; j < -diff; j++) {
          var last = valueList[valueList.length - 1];
          valueList.push(last);
        }
      }
    },

    getRange: function() {
      return this.get('ref_value_list').length;
    },


    calculateReferenceValues: function() {
      console.log('calculate reference values');
      this.get('ref_value').invalidate();
      var reference = this.get('references');
      if (reference) {
        var ref_prop = this.get('ref_prop_key');
        var ref_dimensions = this.get('ref_dimensions');
        var members;
        if (reference.get('type') == 'collection') {
          members = reference.members;
        } else {
          members = [reference, reference];
        }
        var reference_points = [];
        var reference_values = {};

        for (var j = 0; j < ref_dimensions.length; j++) {
          var points = [];
          reference_values[ref_dimensions[j]] = [];
          var min, max;
          for (var i = 0; i < members.length; i++) {

            var point;

            if (ref_dimensions[j] === 'v') {
              point = {
                x: i,
                y: members[i].getValueFor(ref_prop)
              };
              points.push(point);

            } else {
              point = {
                x: i,
                y: members[i].getValueFor(ref_prop)[ref_dimensions[j]]
              };
              if (!min && !max) {
                min = y;
                max = y;
              }
              if (y < min) {
                min = y;
              }
              if (y > max) {
                max = y;
              }
              points.push(point);
            }

            reference_points.push(points);
          }
          var polynomial = TrigFunc.Lagrange(points);
          var expression = polynomial[0];

          for (var k = 1; k < polynomial.length; k++) {
            expression = polynomial[k] + '*Math.pow(x,' + k + ")+" + expression;
          }
          console.log('expression', expression, 'min', min, 'max', max);
          var range = this.get('relatives').getRange();

          for (var m = 0; m < range; m++) {
            var x;
            if (range == 1) {
              x = (points.length - 1) / 2;
            } else {
              x = TrigFunc.map(m, 0, range - 1, 0, points.length - 1);
            }
            var y = eval(expression);
            console.log('x,y', x, y);
            reference_values[ref_dimensions[j]].push(y);
          }

        }
        console.log('ref property', ref_prop, 'dimensions', ref_dimensions, "points:", reference_points, 'reference_values', reference_values);
        this.set('reference_points', reference_points);
        this.set('ref_value_list', reference_values);
      }
    },


    getReferencePoints: function() {
      return (this.get('reference_points'));
    },

    getFunctionPath: function() {
      return this.get('functionPath');
    }



  });

  return Constraint;
});