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
    'strokeWidth:strokeWidth': 1,
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
    strokeWidth: {
      v: {
        min: 0.1,
        max: 50
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
      ref_dimensions: null,
      rel_dimension: null,
      rel_prop_key: null,
      ref_prop_key: null,
      expression: '',

      // UI
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
      reference_properties: null,
      relative_properties: null,
    },

    initialize: function() {
      var self = this;

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

      this.set('ref_values', []);

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
      instance.get('selected').setValue(false);
      if (this.get('relatives')) {
        if (this.get('references')) {
          this.get('references').set('constraintSelected', false);

        }
        this.set('references', instance);
        instance.get('constraintSelected').setValue('reference_selected');
        this.set('ref_type', type);

        var constraint = this;
        var relatives = this.get('relatives');
        var references = this.get('references');
        var rel_geom = relatives.get('geom');
        var ref_geom = references.get('geom');
        return true;
      }
      if (this.get('relatives')) {
        this.get('relatives').get('constraintSelected').setValue(false);
      }

      this.set('relatives', instance);
      instance.get('constraintSelected').setValue('relative_selected');
      this.set('rel_type', type);
      return false;
    },


    setOffset: function(reference, ref_prop_key, ref_dimensions, relative, rel_prop_key, rel_dimensions) {

      var convertFactor = propConvMap[ref_prop_key + ':' + rel_prop_key];

      var refProp = this.propSwitch(ref_prop_key, ref_dimensions, reference);
      var relPropValue;
      var refPropValue = refProp[ref_prop_key];
      var conversion = {};
      var offset = this.get('offset') ? this.get('offset') : {};
      var keys;
      var instance;
      var offsetLength = offset[rel_dimensions[0]] ? offset[rel_dimensions[0]].length : 0;
      var relativeRange = relative.getRange() - offsetLength;

      if (ref_dimensions.length === rel_dimensions.length) {

        for (var i = 0; i < rel_dimensions.length; i++) {
          offset[rel_dimensions[i]] = offset[rel_dimensions[i]] ? offset[rel_dimensions[i]] : [];
          for (var p = 0; p < relativeRange; p++) {
            instance = relative;
            if (relative.get('type') === 'collection') {
              instance = instance.members[p];
            }
            relPropValue = this.propSwitch(rel_prop_key, rel_dimensions, instance)[rel_prop_key];
            conversion[rel_dimensions[i]] = refPropValue[ref_dimensions[i]] * convertFactor;
            offset[rel_dimensions[i]].push(relPropValue[rel_dimensions[i]] - conversion[rel_dimensions[i]]);
          }
        }
      } else if (ref_dimensions.length > rel_dimensions.length) {
        for (var j = 0; j < rel_dimensions.length; j++) {
          offset[rel_dimensions[j]] = offset[rel_dimensions[j]] ? offset[rel_dimensions[j]] : [];
          for (var t = 0; t < relativeRange; t++) {
            instance = relative;
            if (relative.get('type') === 'collection') {
              instance = instance.members[t];
            }
            relPropValue = this.propSwitch(rel_prop_key, rel_dimensions, instance)[rel_prop_key];
            conversion[rel_dimensions[j]] = (refPropValue[rel_dimensions[j]]) ? refPropValue[rel_dimensions[j]] * convertFactor : refPropValue[keys[j]] * convertFactor;
            offset[rel_dimensions[j]].push(relPropValue[rel_dimensions[j]] - conversion[rel_dimensions[j]]);
          }
        }

      } else if (ref_dimensions.length < rel_dimensions.length) {
        keys = Object.keys(refPropValue);
        for (var m = 0; m < rel_dimensions.length; m++) {
          offset[rel_dimensions[m]] = offset[rel_dimensions[m]] ? offset[rel_dimensions[m]] : [];
          for (var s = 0; s < relativeRange; s++) {
            instance = relative;
            if (relative.get('type') === 'collection') {
              instance = instance.members[s];
            }
            relPropValue = this.propSwitch(rel_prop_key, rel_dimensions, instance)[rel_prop_key];
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

      return {
        offset: offset,
        convertFactor: convertFactor
      };
    },

    propSwitch: function(propName, subprops, instance) {
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


    /*properties should take the form of an array listing constraints for each subprop
     * [[translationDelta_y,rotationDelta_v],[translationDelta_x,rotationDelta_v]]
     */
    create: function(properties) {
      this.stopListening();
      var offsets = [];
      var expressions = [];
      var refProperties = [];
      var relProperties = [];
      this.set('relative_properties', relProperties);
      this.set('reference_properties', refProperties);
      var constraint_data = {};
      var self = this;
      var reference = this.get('references');
      var relative = this.get('relatives');

      var setOnInstance = false;
      console.log('properties', properties.length, 'dimension_num', relative.get('dimension_num'));
      if (properties.length === relative.get('dimension_num')) {
        setOnInstance = true;
      }

      this.listenTo(relative.get('memberCount'), 'modified', function() {
        self.create(properties);
      });
      var modes = {};
      this.set('modes', modes);
      for (var j = 0; j < properties.length; j++) {

        var ref_prop = properties[j][0];
        var rel_prop = properties[j][1];
        var mode_list = properties[j][2];
        var refSplit = ref_prop.split('_');
        var ref_dimensions = refSplit[1];
        var ref_prop_key = refSplit[0];
        var relSplit = rel_prop.split('_');
        var rel_dimensions = relSplit[1];
        var rel_prop_key = relSplit[0];
        var property_dimensions = relative.get(rel_prop_key).get('dimension_num');
        refProperties.push([ref_prop_key, ref_dimensions]);
        relProperties.push([rel_prop_key, rel_dimensions]);
        for (var m = 0; m < ref_dimensions.length; m++) {
          if (mode_list && mode_list[m]) {
            modes[ref_prop_key + '_' + ref_dimensions[m]] = mode_list[m];
          } else {
            modes[ref_prop_key + '_' + ref_dimensions[m]] = 'interpolate';
          }
        }
        var offset_data = this.setOffset(reference, ref_prop_key, ref_dimensions, relative, rel_prop_key, rel_dimensions);
        var convertFactor = offset_data.convertFactor;
        var offset = offset_data.offset;
        offsets.push(offset);

        var exp_scale = 'y =' + convertFactor.toString() + ' * ' + 'x';
        var expression = {};
        for (var p in offset) {
          if (offset.hasOwnProperty(p)) {
            expression[p] = exp_scale + ' + ' + 'offsetValue'; //offset[axis].toString()';
          }
        }
        expressions.push(expression);
        this.setReferenceValues(ref_prop_key, ref_dimensions);
        this.listenTo(reference.get('memberCount'), 'modified', function() {
          (
            function(rpk, rd) {
              self.setReferenceValues(rpk, rd);
            }(ref_prop_key, ref_dimensions)
          );
        });
        if (!setOnInstance) {
          if (relative.get(rel_prop_key).get('dimension_num') == rel_dimensions.length) {
            this.setConstraintOnProperty(relative, expression, offset, [ref_prop_key, ref_dimensions], [rel_prop_key, rel_dimensions]);
          } else {
            for (var n = 0; n < rel_dimensions.length; n++) {
              console.log('rel dimension at', n, "=" + rel_dimensions[n]);
              console.log('ref dimension at', n, "=" + ref_dimensions[n]);
              this.setConstraintOnSubProperty(relative, expression[rel_dimensions[n]], offset[rel_dimensions[n]], ref_prop_key, ref_dimensions[n], rel_prop_key, rel_dimensions[n]);
            }
          }
        }
      }

      if (setOnInstance) {
        console.log('setting constraint on instance');
        this.setConstraintOnInstance(relative, expressions, offsets, refProperties, relProperties);
      }
      //set parent constraints on members
      if (relative.get('type') === 'collection') {
        for (var i = 0; i < relative.members.length; i++) {
          if (!reference.isReference(relative.members[i])) {
            relative.members[i].setParentConstraint(relProperties, true);
          } // else {
          //console.log('excluding relative member', i);
          // }
        }
      }

    },



    setConstraintOnSubProperty: function(relative, expression, offset, ref_prop_key, ref_dimension, rel_prop_key, rel_dimension) {
      var self = this;

      var constraintF = function() {
        var list = [];
        var relative_range = relative.get('memberCount').getValue();
        for (var z = 0; z < relative_range; z++) {
          var data = {};
          data[rel_prop_key] = {};
          var ap = ref_dimension;
          var reference_values = self.get('reference_values');
          var x = reference_values[ref_prop_key][ref_dimension][z].getValue();

          var offsetValue = 0; //offset;
          var y;
          eval(expression);
          data[rel_prop_key][rel_dimension] = y;
          list.push(data);
          if (relative.get('type') === 'collection') {
            relative.members[z].get(rel_prop_key)[rel_dimension].setValue(y);
          } else {
            relative.get(rel_prop_key)[rel_dimension].setValue(y);
          }

        }
        if (relative.get('type') === 'collection') {
          console.log('list=', list);
          return list;
        } else {
          return list[0][rel_prop_key][rel_dimension];
        }
      };
      relative.get(rel_prop_key)[rel_dimension].setConstraint(constraintF, this);
    },

    setConstraintOnProperty: function(relative, expression, offset, refProperty, relProperty) {
      var self = this;
      var ref_prop_key = refProperty[0];
      var rel_prop_key = relProperty[0];
      var ref_dimensions = refProperty[1];
      var constraintF = function() {

        var list = [];
        var relative_range = relative.get('memberCount').getValue();
        var a_keys = Object.keys(expression);
        for (var z = 0; z < relative_range; z++) {
          var data = {};
          data[rel_prop_key] = {};

          for (var m = 0; m < a_keys.length; m++) {
            var axis = a_keys[m];
            var ap = (ref_dimensions && ref_dimensions[m]) ? ref_dimensions[m] : ref_dimensions[ref_dimensions.length - 1];
            var reference_values = self.get('reference_values');
            var x = reference_values[ref_prop_key][axis][z].getValue();
            var offsetValue = 0; //offset[axis][z];
            var y;
            eval(expression[axis]);
            if (axis === 'v') {
              data[rel_prop_key] = y;
            } else {
              data[rel_prop_key][axis] = y;
            }

          }
          if (relative.get('type') === 'collection') {
            relative.members[z].get(rel_prop_key).setValue(data[rel_prop_key]);
          } else {
            relative.get(rel_prop_key).setValue(data[rel_prop_key]);
          }
          list.push(data);

        }

        if (relative.get('type') === 'collection') {
          return list;
        } else {
          return list[0][rel_prop_key];
        }
      };
      relative.get(rel_prop_key).setConstraint(constraintF, this);
    },  

    setConstraintOnInstance: function(relative, expressions, offsets, refProperties, relProperties) {
      var self = this;
      var constraintF = function() {

        var list = [];
        var relative_range = relative.get('memberCount').getValue();

        /*for (var w = 0; w < relative_range; w++) {
          list.push({});
        }*/
        for (var i = 0; i < refProperties.length; i++) {

          var ref_prop_key = refProperties[i][0];
          var rel_prop_key = relProperties[i][0];
          var ref_dimensions = refProperties[i][1];
          var expression = expressions[i];
          var offset = offsets[i];
          var a_keys = Object.keys(expression);

          for (var z = 0; z < relative_range; z++) {
            if(list.length<z){
                list.push({});
            }
            if (!list[z][rel_prop_key]) {
              list[z][rel_prop_key] = {};
            }

            for (var m = 0; m < a_keys.length; m++) {
              var axis = a_keys[m];
              var ap = (ref_dimensions && ref_dimensions[m]) ? ref_dimensions[m] : ref_dimensions[ref_dimensions.length - 1];
              var reference_values = self.get('reference_values');
              var x = reference_values[ref_prop_key][axis][z].getValue();
              var offsetValue = 0; //offset[axis][z];
              var y;
              eval(expression[axis]);
              if (axis === 'v') {
                list[z][rel_prop_key] = y;
              } else {
                list[z][rel_prop_key][axis] = y;
              }

            }

          }

        }
        if (relative.get('type') === 'collection') {
          return list;
        } else {
          return list[0];
        }
      };

      relative.setConstraint(constraintF, this);
    },



    /* reference values should look like data object with arrays of values for each property
    *  ie: {
            translationDelta:{x:[100,200,300],y:[0,0,0]},
            rotationDelta:{v:100}
            }
    */

    setReferenceValues: function(ref_prop_key, ref_dimensions) {
      var reference_values = this.get('reference_values');
      var reference = this.get('references');
      var self = this;
      if (!reference_values) {
        this.set('reference_values', {});
        reference_values = this.get('reference_values');
      }

      if (!reference_values[ref_prop_key]) {
        reference_values[ref_prop_key] = {};
      }
      var ref_dimension_array = ref_dimensions.split('');
      ref_dimension_array.forEach(function(target_dimension) {
        var reference_subprops = reference.getLiteralSubprops(ref_prop_key, target_dimension);
        reference_subprops.forEach(function(target_prop) {

          (function(refVals) {
            self.listenTo(target_prop, 'modified', function() {
              (

                function(rpk, td, rv) {
                  self.calculateReferenceValues(rpk, td, rv);
                }(ref_prop_key, target_dimension, refVals)
              );
            });
          }(reference_values[ref_prop_key]));

        });
        if (!reference_values[ref_prop_key][target_dimension]) {
          reference_values[ref_prop_key][target_dimension] = [];

        }


        var diff = reference_values[ref_prop_key][target_dimension].length - self.get('relatives').getRange();
        if (diff > 0) {
          for (var j = 0; j < diff; j++) {
            var removedItem = reference_values[ref_prop_key][target_dimension].pop();
          }
        } else if (diff < 0) {
          for (var k = 0; k < -diff; k++) {
            var newItem;
            if (reference_values[ref_prop_key][target_dimension].length > 0) {
              var last = reference_values[ref_prop_key][target_dimension][reference_values[ref_prop_key][target_dimension].length - 1];
              newItem = new PFloat(last.getValue());
              newItem.setNull(true);
            } else {
              newItem = new PFloat(1);
              newItem.setNull(true);
            }

            reference_values[ref_prop_key][target_dimension].push(newItem);
          }
        }
        self.calculateReferenceValues(ref_prop_key, target_dimension, reference_values[ref_prop_key]);
      });
    },

    getRange: function() {
      return this.get('ref_value_list').length;
    },



    calculateReferenceValues: function(ref_prop_key, ref_dimension, reference_values) {
      var mode = this.get('modes')[ref_prop_key + '_' + ref_dimension];
      switch (mode) {
        case 'interpolate':
          this.calculateReferenceValuesInterpolate(ref_prop_key, ref_dimension, reference_values);
          break;
        case 'random':
          this.calculateReferenceValuesRandom(ref_prop_key, ref_dimension, reference_values);
          break;
        default:
          break;
      }
    },

    calculateReferenceValuesRandom: function(ref_prop_key, ref_dimension, reference_values) {
      var reference = this.get('references');
      if (reference) {
        var members;
        if (reference.get('type') == 'collection') {
          members = reference.members;
        } else {
          members = [reference, reference];
        }
        var reference_points = [];
        var points = [];
        var min, max;

        for (var i = 0; i < members.length; i++) {

          var point;

          if (ref_dimension === 'v') {
            point = {
              x: i,
              y: members[i].getValue()[ref_prop_key]
            };
            points.push(point);

          } else {
            point = {
              x: i,
              y: members[i].getValue()[ref_prop_key][ref_dimension]
            };
            if (!min && !max) {
              min = point.y;
              max = point.y;
            }
            if (point.y < min) {
              min = point.y;
            }
            if (point.y > max) {
              max = point.y;
            }
            points.push(point);
          }

          reference_points.push(points);
        }
        var range = this.get('relatives').getRange();
        for (var m = 0; m < range; m++) {
          var y = Math.floor(Math.random() * (max - min + 1) + min);
          reference_values[ref_dimension][m].setValue(y);

        }
      }

    },

    calculateReferenceValuesInterpolate: function(ref_prop_key, ref_dimension, reference_values) {
      var reference = this.get('references');
      if (reference) {
        var members;
        if (reference.get('type') == 'collection') {
          members = reference.members;
        } else {
          members = [reference, reference];
        }
        var reference_points = [];
        var points = [];
        var min, max;
        for (var i = 0; i < members.length; i++) {

          var point;

          if (ref_dimension === 'v') {
            point = {
              x: i,
              y: members[i].getValue()[ref_prop_key]
            };
            points.push(point);

          } else {
            point = {
              x: i,
              y: members[i].getValue()[ref_prop_key][ref_dimension]
            };
            if (!min && !max) {
              min = point.y;
              max = point.y;
            }
            if (point.y < min) {
              min = point.y;
            }
            if (point.y > max) {
              max = point.y;
            }
            points.push(point);
          }

          reference_points.push(points);
        }
        var polynomial, expression;

        if (points.length < 2) {

          polynomial = [points[0].y];
          expression = points[0].y;
        } else if (points.length < 3) {
          var slope = (points[0].y - points[1].y) / (points[0].x - points[1].x);
          var b = points[0].y - (slope * points[0].x);
          polynomial = [slope, b];
          expression = slope + "*x+" + b;
        } else {
          polynomial = TrigFunc.Lagrange(points);
          expression = polynomial[0];

          for (var k = 1; k < polynomial.length; k++) {
            expression = polynomial[k] + '*Math.pow(x,' + k + ")+" + expression;
          }
        }
        var range = this.get('relatives').getRange();

        for (var m = 0; m < range; m++) {
          var x;
          if (range == 1) {
            x = (points.length - 1) / 2;
          } else {
            x = TrigFunc.map(m, 0, range - 1, 0, points.length - 1);
          }
          var y = eval(expression);
          reference_values[ref_dimension][m].setValue(y);
        }
      }
    },


    getReferencePoints: function() {
      return (this.get('reference_points'));
    },

    getFunctionPath: function() {
      return this.get('functionPath');
    },

    clearUI: function() {
      this.get('ref_handle').remove();
      this.get('rel_handle').remove();
      this.set('ref_handle', null);
      this.set('rel_handle', null);

    },

    clearSelection: function() {
      if (this.get('references')) {
        this.get('references').get('constraintSelected').setValue(false);

      }
      if (this.get('relatives')) {
        this.get('relatives').get('constraintSelected').setValue(false);

      }
    },

    remove: function() {
      if (this.get('relatives').get('type') === 'collection') {
        for (var i = 0; i < this.get('relatives').members.length; i++) {
          this.get('relatives').members[i].setParentConstraint(this.get('relative_properties'), false);
        }
      }

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
    }



  });

  return Constraint;
});