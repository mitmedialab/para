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


    setOffset: function(ref_prop, rel_prop) {
      var ref_dimensions = ref_prop.split('_').length > 1 ? ref_prop.split('_')[1] : ['v'];
      var rel_dimensions = rel_prop.split('_').length > 1 ? rel_prop.split('_')[1] : ['v'];
      // relPropValue = propSwitch(rel_prop, 'rel');

      var ref_prop_strip = ref_prop.split('_')[0];
      var rel_prop_strip = rel_prop.split('_')[0];

      var convertFactor = propConvMap[ref_prop_strip + ':' + rel_prop_strip];

      var refPropValue = this.propSwitch(ref_prop, 'ref');
      var relPropValue;
      var conversion = {};
      var offset = this.get('offset') ? this.get('offset') : {};
      var keys;
      var offsetLength = offset[rel_dimensions[0]] ? offset[rel_dimensions[0]].length : 0;
      var relativeRange = this.get('relatives').getRange() - offsetLength;

      if (ref_dimensions.length === rel_dimensions.length) {
        if (ref_dimensions.length == 1) {
          offset[rel_dimensions[0]] = offset[rel_dimensions[0]] ? offset[rel_dimensions[0]] : [];
          for (var n = 0; n < relativeRange; n++) {
            relPropValue = this.propSwitch(rel_prop, 'rel', n);

            conversion = refPropValue * convertFactor;
            offset[rel_dimensions[0]].push(relPropValue - conversion);
          }
        } else {

          for (var i = 0; i < rel_dimensions.length; i++) {
            offset[rel_dimensions[i]] = offset[rel_dimensions[i]] ? offset[rel_dimensions[i]] : [];
            for (var p = 0; p < relativeRange; p++) {
              relPropValue = this.propSwitch(rel_prop, 'rel', p);
              conversion[rel_dimensions[i]] = refPropValue[ref_dimensions[i]] * convertFactor;
              offset[rel_dimensions[i]].push(relPropValue[rel_dimensions[i]] - conversion[rel_dimensions[i]]);
            }
          }

        }
      } else if (ref_dimensions.length > rel_dimensions.length) {
        if (rel_dimensions.length == 1) {

          keys = Object.keys(refPropValue);
          offset[rel_dimensions[0]] = offset[rel_dimensions[0]] ? offset[rel_dimensions[0]] : [];
          for (var q = 0; q < relativeRange; q++) {
            relPropValue = this.propSwitch(rel_prop, 'rel', q);
            conversion = (rel_prop_strip == 'rotation') ? refPropValue[keys[0]] * convertFactor : refPropValue[rel_prop.split('_')[1]] * convertFactor;
            offset[rel_dimensions[0]].push(relPropValue - conversion);
          }
        } else {
          for (var j = 0; j < rel_dimensions.length; j++) {
            offset[rel_dimensions[j]] = offset[rel_dimensions[j]] ? offset[rel_dimensions[j]] : [];
            for (var t = 0; t < relativeRange; t++) {
              relPropValue = this.propSwitch(rel_prop, 'rel', t);
              conversion[rel_dimensions[j]] = (refPropValue[rel_dimensions[j]]) ? refPropValue[rel_dimensions[j]] * convertFactor : refPropValue[keys[j]] * convertFactor;
              offset[rel_dimensions[j]].push(relPropValue[rel_dimensions[j]] - conversion[rel_dimensions[j]]);
            }
          }
        }
      } else if (ref_dimensions.length < rel_dimensions.length) {
        if (ref_dimensions.length == 1) {
          for (var k = 0; k < rel_dimensions.length; k++) {
            offset[rel_dimensions[k]] = offset[rel_dimensions[k]] ? offset[rel_dimensions[k]] : [];
            for (var r = 0; r < relativeRange; r++) {
              relPropValue = this.propSwitch(rel_prop, 'rel', r);
              conversion[rel_dimensions[k]] = refPropValue * convertFactor;
              offset[rel_dimensions[k]].push(relPropValue[rel_dimensions[k]] - conversion[rel_dimensions[k]]);
            }
          }
        } else {
          keys = Object.keys(refPropValue);
          for (var m = 0; m < rel_dimensions.length; m++) {
            offset[rel_dimensions[m]] = offset[rel_dimensions[m]] ? offset[rel_dimensions[m]] : [];
            for (var s = 0; s < relativeRange; s++) {
              conversion[rel_dimensions[m]] = (refPropValue[rel_dimensions[m]]) ? refPropValue[rel_dimensions[m]] * convertFactor : (m < keys.length) ? refPropValue[keys[m]] * convertFactor : refPropValue[keys[keys.length - 1]];
              offset[rel_dimensions[m]].push(relPropValue[rel_dimensions[m]] - conversion[rel_dimensions[m]]);
            }
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
      this.set('offset', offset);
      return convertFactor;
    },

    matchProperty: function(ref_prop, rel_prop) {



      var convertFactor = this.setOffset(ref_prop, rel_prop);
      var offset = this.get('offset');
      var exp_scale = 'y =' + convertFactor.toString() + ' * ' + 'x';
      var exp_object = {};
      for (var axis in offset) {
        if (offset.hasOwnProperty(axis)) {
          exp_object[axis] = exp_scale + ' + ' + 'offsetValue'; //offset[axis].toString()';
        }
      }
      this.set('expression', exp_object);
    },


    propSwitch: function(proplabels, side, index) {
      var geom, instance;
      if (side == 'ref') {
        instance = this.get('references');
      }
      if (side == 'rel') {
        var relatives = this.get('relatives');
        if (relatives.get('type') === 'collection') {
          instance = relatives.members[index];
        } else {
          instance = relatives;
        }

      }
      var instance_value = instance.getValue();
     var split = proplabels.split('_');
     var propValue = {};
      var propName = split[0];
      var subprops = split[1];
      for(var i=0;i<subprops.length;i++){
        if(propValue[propName]===undefined){
          propValue[propName] = {};
        }
        if(typeof instance_value[propName]==='number'){
         propValue[propName][subprops[i]]=instance_value[propName];
        }
        else{
          propValue[propName][subprops[i]]= instance_value[propName][subprops[i]];
        }
      }
      console.log('instance_value',instance_value,'propName',propName,'subprops',subprops,'propvalue',propValue);


     /* switch (prop) {
        case 'scale_x':
          propValue = instance.getValueFor('scalingDelta').x;
          break;
        case 'scale_y':
          propValue = instance.getValueFor('scalingDelta').y;
          break;
        case 'scale_xy':
          propValue = instance.getValueFor('scalingDelta');
          break;
        case 'position_x':
          propValue = instance.getValueFor('translationDelta').x;
          break;
        case 'position_y':
          propValue = instance.getValueFor('translationDelta').y;
          break;
        case 'position_xy':
          propValue = instance.getValueFor('translationDelta');
          break;
        case 'fill_h':
          propValue = instance.getValueFor('fillColor').h;
          break;
        case 'fill_s':
          propValue = instance.getValueFor('fillColor').s;
          break;
        case 'fill_l':
          propValue = instance.getValueFor('fillColor').l;
          break;
        case 'fill_hs':
          propValue = {
            h: instance.getValueFor('fillColor').h,
            s: instance.getValueFor('fillColor').s
          };
          break;
        case 'fill_sl':
          propValue = {
            s: instance.getValueFor('fillColor').s,
            l: instance.getValueFor('fillColor').l
          };
          break;
        case 'fill_hl':
          propValue = {
            h: instance.getValueFor('fillColor').h,
            l: instance.getValueFor('fillColor').l
          };
          break;
        case 'fill_hsl':
          propValue = {
            h: instance.getValueFor('fillColor').h,
            s: instance.getValueFor('fillColor').s,
            l: instance.getValueFor('fillColor').l
          };
          break;
        case 'stroke_h':
          propValue = instance.getValueFor('strokeColor').h;
          break;
        case 'stroke_s':
          propValue = instance.getValueFor('strokeColor').s;
          break;
        case 'stroke_l':
          propValue = instance.getValueFor('strokeColor').l;
          break;
        case 'stroke_hs':
          propValue = {
            h: instance.getValueFor('strokeColor').h,
            s: instance.getValueFor('strokeColor').s
          };
          break;
        case 'stroke_sl':
          propValue = {
            s: instance.getValueFor('strokeColor').s,
            l: instance.getValueFor('strokeColor').l
          };
          break;
        case 'stroke_hl':
          propValue = {
            h: instance.getValueFor('strokeColor').h,
            l: instance.getValueFor('strokeColor').l
          };
          break;
        case 'stroke_hsl':
          propValue = {
            h: instance.getValueFor('strokeColor').h,
            s: instance.getValueFor('strokeColor').s,
            l: instance.getValueFor('strokeColor').l
          };
          break;
        case 'rotation':
          propValue = instance.getValueFor('rotationDelta');
          break;
      }*/
      return propValue;
    },

    create: function() {
      var self = this;
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



      var refPropAccess = reference.get(ref_prop[0]);
      var relPropAccess = relative.get(rel_prop[0]);
     
      console.log('ref prop target', rel_prop[0], refPropAccess.get('name'));

      this.set('ref_prop_key', ref_prop[0]);
      this.set('rel_prop_key', ref_prop[0]);
      if (rel_prop) {
        this.set('rel_prop_dimensions', ref_prop[1]?ref_prop[1]:['v']);
      }
      this.set('ref_prop_dimensions', ref_prop[1]?ref_prop[1]:['v']);
      this.calculateReferenceValues();

      if (expression_dimension_num < relPropAccess.get('dimension_num')) {
        var constraintFunctions = [];
        var a_keys = Object.keys(expression);

        for (var i = 0; i < a_keys.length; i++) {
          var axis = a_keys[i];
          var ap = (ref_available_props && ref_available_props[i]) ? ref_available_props[i] : (!ref_available_props) ? 'v': ref_available_props[ref_available_props.length - 1];
          var cf = (function(d, a) {
            self.set('current_dimension', a);
            return function() {
              var x = self.get('ref_value').getValue();
              var offset = self.get('offset');
              var operators = self.get('operators');
              var mapOperand = self.get('map_operand');
              var offsetValue = 0;//offset[axis][relative.get('index').getValue()];
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
            var ap = (ref_available_props && ref_available_props[m]) ? ref_available_props[m] : (!ref_available_props) ? 'v' : ref_available_props[ref_available_props.length - 1];
            self.set('current_dimension', ap);
            var operators = self.get('operators');
            var mapOperand = self.get('map_operand');
            var x = self.get('ref_value').getValue();
            var offset = self.get('offset');
            var offsetValue = 0;//offset[axis][relative.get('index').getValue()];
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
      console.log('dimension',dimension);
       var ref_prop = this.get('ref_prop_key');
      console.log('ref_prop',ref_prop,'reference', this.get('references'),'property',this.get('references').getValueFor(ref_prop));
      var refPropAccess = this.get('references').get(ref_prop);

      console.log('isValid:',refPropAccess.isValid()+this.get('references').get('id'));
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
        var ref_dimensions = this.get('ref_prop_dimensions');
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
          var min,max;
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
              if(!min && !max){
                min = y;
                max = y;
              }
              if(y<min){
                min = y;
              }
              if(y>max){
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
          console.log('expression', expression, 'min',min,'max',max);
          var range = this.get('relatives').getRange();
          
          for (var m = 0; m < range; m++) {
            var x;
            if(range ==1){
              x = (points.length-1)/2;
            }
            else{
              x = TrigFunc.map(m,0,range-1,0,points.length-1);
            }
            var y = eval(expression);
            console.log('x,y',x,y);
            reference_values[ref_dimensions[j]].push(y);
          }

        }
        console.log('ref property', ref_prop, 'dimensions', ref_dimensions, "points:", reference_points, 'reference_values',reference_values);
        this.set('reference_points', reference_points);
        this.set('ref_value_list',reference_values);
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