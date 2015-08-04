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
      ref_dimensions: null,
      rel_dimension: null,
      rel_prop_key: null,
      ref_prop_key: null,
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
          console.log("rel offset for", rel_dimensions[i], offset[rel_dimensions[i]]);
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
      console.log('propName subprops', propName, subprops);
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
      var offsets = [];
      var expressions = [];
      var refProperties = [];
      var relProperties = [];
      var constraint_data = {};
      var self = this;
      var reference = this.get('references');
      var relative = this.get('relatives');

      this.get('proxy').hide();
      this.clearUI();
      this.clearSelection();
      var relative_dimensions = relative.get('dimension_num');
      console.log('relative value pre', relative.getValue());

      for (var j = 0; j < properties.length; j++) {

        var ref_prop = properties[j][0];
        var rel_prop = properties[j][1];
        var refSplit = ref_prop.split('_');
        var ref_dimensions = refSplit[1];
        var ref_prop_key = refSplit[0];
        var relSplit = rel_prop.split('_');
        var rel_dimensions = relSplit[1];
        var rel_prop_key = relSplit[0];
        var property_dimensions = relative.get(rel_prop_key).get('dimension_num');
        refProperties.push([ref_prop_key, ref_dimensions]);
        relProperties.push([rel_prop_key, rel_dimensions]);

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


      }
      console.log("offsets", offsets, "expressions", expressions, "constraint_data", constraint_data, refProperties, relProperties, 'reference_values', this.get('reference_values'));
      /*for(var prop in this.get('reference_values')){
        for(var d in this.get('reference_values')[prop]){
          for(var z=0;z< this.get('reference_values')[prop][d].length;z++){
          console.log('reference value at ', prop, d, z, "=", this.get('reference_values')[prop][d][z].getValue());
        }
      }
      }*/
      this.setConstraintOnInstance(relative, expressions, offsets, refProperties, relProperties);
      console.log('relative value post', relative.getValue());

    },


    setConstraintOnInstance: function(relative, expressions, offsets, refProperties, relProperties) {
      var self = this;
      var constraintF = function() {
        var data = {};
        for (var i = 0; i < refProperties.length; i++) {
          var ref_prop_key = refProperties[i][0];
          var rel_prop_key = relProperties[i][0];
          var ref_dimensions = refProperties[i][1];
          var expression = expressions[i];
          var offset = offsets[i];
          var evalObj = {};
          var a_keys = Object.keys(expression);
          for (var m = 0; m < a_keys.length; m++) {
            var axis = a_keys[m];
            var ap = (ref_dimensions && ref_dimensions[m]) ? ref_dimensions[m] : ref_dimensions[ref_dimensions.length - 1];
            self.set('current_dimension', ap);
            self.set('current_ref_property', ref_prop_key);
            var reference_values = self.get('reference_values');
            var x = reference_values[ref_prop_key][axis][relative.get('index').getValue()].getValue();

            var offsetValue = offset[axis][relative.get('index').getValue()];
            var y;
            eval(expression[axis]);
            console.log('x val =', x, 'offset val=', offsetValue, 'y val=', y);

            evalObj[axis] = y;
          }
          data[rel_prop_key] = evalObj;
        }
        console.log('data =', data);
        relative.setValue(data);
        return data;
      };

      relative.setConstraint(constraintF);
      relative.getValue();
    },

    setConstraintOnProperty: function(relative_property, expression, offset) {

    },

    setConstraintOnSubProperty: function() {

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

      for (var i = 0; i < ref_dimensions.length; i++) {
        var target_dimension = ref_dimensions[i];
        var reference_subprops = reference.getLiteralSubprops(ref_prop_key, target_dimension);
        for (var z = 0; z < reference_subprops.length; z++) {
          this.listenTo(reference_subprops[z], 'modified', function() {
            self.calculateReferenceValues(ref_prop_key, target_dimension, reference_values[ref_prop_key]);
          });
        }
        if (!reference_values[ref_prop_key][target_dimension]) {
          reference_values[ref_prop_key][target_dimension] = [];

        }


        var diff = reference_values[ref_prop_key][target_dimension].length - this.get('relatives').getRange();
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
            } else {
              newItem = new PFloat(1);
            }

            reference_values[ref_prop_key][target_dimension].push(newItem);
          }
        }
        this.calculateReferenceValues(ref_prop_key, target_dimension, reference_values[ref_prop_key]);
      }
    },

    referenceValueChanged: function(target) {
      console.log('reference value changed', target, target.getValue());
    },



    getRange: function() {
      return this.get('ref_value_list').length;
    },


    calculateReferenceValues: function(ref_prop_key, ref_dimension, reference_values) {
      console.log('calculate reference values', ref_prop_key, ref_dimension, reference_values);
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
          console.log('1 points');

          polynomial = [points[0].y];
          expression = points[0].y;
        } else if (points.length < 3) {
          console.log('2 points');
          var slope = (points[0].y - points[1].y) / (points[0].x - points[1].x);
          var b = points[0].y - (slope * points[0].x);
          polynomial = [slope, b];
          expression = slope + "*x+" + b;
        } else {
          console.log('more than 2 points');

          polynomial = TrigFunc.Lagrange(points);
          expression = polynomial[0];

          for (var k = 1; k < polynomial.length; k++) {
            expression = polynomial[k] + '*Math.pow(x,' + k + ")+" + expression;
          }
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
    }




  });

  return Constraint;
});