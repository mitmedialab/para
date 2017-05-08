define([
  'underscore',
  'paper',
  'backbone',
  'models/data/paperUI/ConstraintHandles',
  'models/data/properties/PFloat',
  'utils/TrigFunc',
  'utils/Ziggurat'
], function(_, paper, Backbone, ConstraintHandles, PFloat, TrigFunc, Ziggurat) {

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
        'blendMode:blendMode': 1,

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
    blendMode: {
      v: {
        min: 0,
        max: 32
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
      },
      a: {
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
      },
       a: {
        min: 0,
        max: 1
      }
    },
  };

  var dimension_map = {
    'translationDelta': 2,
    'scalingDelta': 2,
    'rotationDelta': 1,
    'fillColor': 4,
    'strokeColor': 4,
    'blendMode':1,
    'strokeWidth':1
  };

  var ziggurat = new Ziggurat();

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
      exempt_indicies: null,
      map_operand: null,
      operators: null,
      reference_properties: null,
      relative_properties: null,
      user_name: 'constraint',
      paused: false
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

      this.previousStates = [];
      this.futureStates = [];

      this.stateStored = false;
    },


    clearUndoCache: function() {
      this.previousStates = [];
      this.futureStates = [];
      this.stateStored = false;
    },

    //undo to last state
    undo: function(manager) {

      if (this.previousStates.length > 0) {
        var toRemove = [];
        var toAdd = [];

        var state = this.previousStates.pop();
        var currentState = this.toJSON();
        this.futureStates.push(currentState);
        var changed = this.parseJSON(state,manager);

        toRemove.push.apply(toRemove, changed.toRemove);
        toAdd.push.apply(toAdd, changed.toAdd);
        return {
          toRemove: toRemove,
          toAdd: toAdd
        };
      }
    },

    /*setValueEnded
     * called when a manual adujstment is ended
     * such as on a mouse up event
     * sets stateStored to false, enabling the next
     * state of an object to be saved
     */
    setValueEnded: function() {
      this.stateStored = false;
    },


    trimUndoStack: function() {
      this.previousStates.shift();
    },

    trimRedoStack: function() {
      this.futureStates.shift();
    },

    redo: function(manager) {
      if (this.futureStates.length > 0) {
        var toRemove = [];
        var toAdd = [];
        var state = this.futureStates.pop();
        var currentState = this.toJSON();
        this.previousStates.push(currentState);
        var changed = this.parseJSON(state,manager);

        toRemove.push.apply(toRemove, changed.toRemove);
        toAdd.push.apply(toAdd, changed.toAdd);
        return {
          toRemove: toRemove,
          toAdd: toAdd
        };
      }

    },

    addToUndoStack: function() {
      if (!this.stateStored) {
        this.previousStates.push(this.toJSON());
        this.stateStored = true;
        this.futureStates = [];
      }
    },

    toJSON: function(noUndoCache) {
      var data = {};
      data.id = this.get('id');
      data.properties = this.get('properties');
      data.references = this.get('references').get('id');
      data.relatives = this.get('relatives').get('id');
      data.modes = this.get('modes');
      data.relative_properties = this.get('relative_properties');
      data.reference_properties = this.get('reference_properties');
      if (this.get('proxy_references')) {
        data.proxy_references = this.get('proxy_references').get('id');
      }
      if (this.get('proxy_relatives')) {
        data.proxy_relatives = this.get('proxy_relatives').get('id');
      }

      var prop, subprop, i, vals;

      data.exempt_indicies = {};
      var exempt_indicies = this.get('exempt_indicies');

      data.expressions = {};
      var expressions = this.get('expressions');

      data.offsets = {};
      var offsets = this.get('offsets');
      for (prop in offsets) {
        if (offsets.hasOwnProperty(prop)) {
          data.offsets[prop] = {};
          data.exempt_indicies[prop] = {};
          data.expressions[prop] = {};
          for (subprop in offsets[prop]) {
            if (offsets[prop].hasOwnProperty(subprop)) {
              data.offsets[prop][subprop] = [];
              data.exempt_indicies[prop][subprop] = {};

              vals = offsets[prop][subprop];
              for (i = 0; i < vals.length; i++) {
                data.offsets[prop][subprop].push(vals[i].toJSON());
              }
              vals = exempt_indicies[prop][subprop];
              for (var id in vals) {
                if(vals.hasOwnProperty(id)){
                  data.exempt_indicies[prop][subprop][id]= vals[id].toJSON();
                }
              }
              data.expressions[prop][subprop] = expressions[prop][subprop];

            }
          }
        }
      }
      return data;
    },

    parseJSON: function(data, manager) {
      var reference = manager.getById(data.references);
      var relative = manager.getById(data.relatives);
      this.set('id', data.id);
      this.set('references', reference);
      this.set('relatives', relative);
      this.set('modes', data.modes);
      this.set('relative_properties', data.relative_properties);
      this.set('reference_properties', data.reference_properties);
      if (data.proxy_references) {
        this.set('proxy_references', manager.getById(data.proxy_references));
      }
      if (data.proxy_relatives) {
        this.set('proxy_relatives', manager.getById(data.proxy_relatives));
      }

      var prop, subprop, i, vals;

      var exempt_indicies = {};
      var expressions = {};
      var offsets = {};

      for (prop in data.offsets) {
        if (data.offsets.hasOwnProperty(prop)) {
          offsets[prop] = {};
          exempt_indicies[prop] = {};
          expressions[prop] = {};
          for (subprop in data.offsets[prop]) {
            if (data.offsets[prop].hasOwnProperty(subprop)) {
              offsets[prop][subprop] = [];
              exempt_indicies[prop][subprop] = {};

              vals = data.offsets[prop][subprop];
              for (i = 0; i < vals.length; i++) {
                offsets[prop][subprop].push(new PFloat(vals[i]));
              }
              vals = data.exempt_indicies[prop][subprop];
              for (var id in vals) {
                if(vals.hasOwnProperty(id)){
                exempt_indicies[prop][subprop][id] = new PFloat(vals[id]);
                }
              }
              expressions[prop][subprop] = data.expressions[prop][subprop];

            }
          }
        }
      }
      this.set('exempt_indicies', exempt_indicies);
      this.set('offsets', offsets);
      this.set('expressions', expressions);

      this.create(data.properties, true);

      return {
        toRemove: [],
        toAdd: []
      };
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
        this.get('relatives').get('constraintraintSelected').setValue(false);
      }

      this.set('relatives', instance);
      instance.get('constraintSelected').setValue('relative_selected');
      this.set('rel_type', type);
      return false;
    },


    updateOffset: function(rel_prop_key, rel_dimension, index, value) {
      this.get('offsets')[rel_prop_key][rel_dimension][index].setValue(value);
    },

    setExempt: function(rel_prop_key, rel_dimension, id, status) {
      var exempt_indicies = this.get('exempt_indicies');
      console.log('setting exempt for',rel_prop_key, rel_dimension, id, status);
      var value = 0;
      if (status === true) {
        value = 1;
      }
      if( exempt_indicies[rel_prop_key][rel_dimension][id]){
        exempt_indicies[rel_prop_key][rel_dimension][id].setValue(value);
      }
      else{
        exempt_indicies[rel_prop_key][rel_dimension][id] = new PFloat(value);
      }
       console.log('setting exempt for',rel_prop_key, rel_dimension, id, status,  exempt_indicies[rel_prop_key][rel_dimension][id].getValue());
      return true;
    },

    setExemptForAll: function(id, status) {
      var value = 0;
      if (status === true) {
        value = 1;
      }

      var exempt_indicies = this.get('exempt_indicies');
      for (var rel_prop in exempt_indicies) {
        if (exempt_indicies.hasOwnProperty(rel_prop)) {
          for (var rel_dimension in exempt_indicies[rel_prop]) {
            if (exempt_indicies[rel_prop].hasOwnProperty(rel_dimension)) {
              exempt_indicies[rel_prop][rel_dimension][id].setValue(value);

            }
          }
        }
      }

    },



    createOffsetFor: function(id, ref_prop_key, ref_dimensions, rel_prop_key, rel_dimensions) {
      var convertFactor = propConvMap[ref_prop_key + ':' + rel_prop_key];
      var reference_values = this.get('reference_values');
      var relPropValue;
      var refPropValue = reference_values[ref_prop_key];
      var conversion = {};
      var offsets = this.get('offsets');
      if (!offsets[rel_prop_key]) {
        offsets[rel_prop_key] = {};
      }
      var offset = offsets[rel_prop_key];
      var expressions = this.get('expressions');
      if (!expressions[rel_prop_key]) {
        expressions[rel_prop_key] = {};
      }
      var expression = expressions[rel_prop_key];
      var exempt_indicies = this.get('exempt_indicies');
      if (!exempt_indicies[rel_prop_key]) {
        exempt_indicies[rel_prop_key] = {};
      }
      var exempt_index = exempt_indicies[rel_prop_key];
      var relative = this.get('relatives');
      var keys;
      var instance;
      var index = 0;
      var relativeRange = relative.getRange();
      if (ref_dimensions.length === rel_dimensions.length) {

        for (var i = 0; i < rel_dimensions.length; i++) {
          offset[rel_dimensions[i]] = offset[rel_dimensions[i]] ? offset[rel_dimensions[i]] : [];
          exempt_index[rel_dimensions[i]] = exempt_index[rel_dimensions[i]] ? exempt_index[rel_dimensions[i]] : {};
          instance = relative;
          if (relative.get('type') === 'collection') {
            instance = instance.getMemberById(id);
            index = relative.getMemberIndex(instance);
          }
          relPropValue = this.propSwitch(rel_prop_key, rel_dimensions, instance)[rel_prop_key];
          conversion[rel_dimensions[i]] = refPropValue[ref_dimensions[i]].vals[index].getValue() * convertFactor;
          if (offset[rel_dimensions[i]].length <= index) {
             
              offset[rel_dimensions[i]].push(new PFloat(relPropValue[rel_dimensions[i]] - conversion[rel_dimensions[i]]));
            
          } else {
            //offset[rel_dimensions[i]][index].setValue(relPropValue[rel_dimensions[i]] - conversion[rel_dimensions[i]]);
          }
          if (!exempt_index[rel_dimensions[i]][id]) {
            exempt_index[rel_dimensions[i]][id]=new PFloat(0);
          }

        }
      } else if (ref_dimensions.length > rel_dimensions.length) {
        for (var j = 0; j < rel_dimensions.length; j++) {
          offset[rel_dimensions[j]] = offset[rel_dimensions[j]] ? offset[rel_dimensions[j]] : [];
          exempt_index[rel_dimensions[j]] = exempt_index[rel_dimensions[j]] ? exempt_index[rel_dimensions[j]] : {};

          instance = relative;
          if (relative.get('type') === 'collection') {
            instance = instance.getMemberById(id);
          }
          relPropValue = this.propSwitch(rel_prop_key, rel_dimensions, instance)[rel_prop_key];
          conversion[rel_dimensions[j]] = (refPropValue[rel_dimensions[j]]) ? refPropValue[rel_dimensions[j]].vals[index].getValue() * convertFactor : refPropValue[keys[j]].vals[index].getValue() * convertFactor;
          if (offset[rel_dimensions[j]].length <= index) {
            
              offset[rel_dimensions[j]].push(new PFloat(relPropValue[rel_dimensions[j]] - conversion[rel_dimensions[j]]));
            
          } else {
            //offset[rel_dimensions[j]][index].setValue(relPropValue[rel_dimensions[j]] - conversion[rel_dimensions[j]]);
          }
         if (!exempt_index[rel_dimensions[j]][id]) {
            exempt_index[rel_dimensions[j]][id]=new PFloat(0);
          }

        }

      } else if (ref_dimensions.length < rel_dimensions.length) {
        keys = Object.keys(refPropValue);
        for (var m = 0; m < rel_dimensions.length; m++) {
          offset[rel_dimensions[m]] = offset[rel_dimensions[m]] ? offset[rel_dimensions[m]] : [];
          exempt_index[rel_dimensions[m]] = exempt_index[rel_dimensions[m]] ? exempt_index[rel_dimensions[m]] : {};

          instance = relative;
          if (relative.get('type') === 'collection') {
            instance = instance.getMemberById(id);
          }
          relPropValue = this.propSwitch(rel_prop_key, rel_dimensions, instance)[rel_prop_key];
          conversion[rel_dimensions[m]] = (refPropValue[rel_dimensions[m]]) ? refPropValue[rel_dimensions[m]].vals[index].getValue() * convertFactor : (m < keys.length) ? refPropValue[keys[m]].vals[index].getValue() * convertFactor : refPropValue[keys[keys.length - 1]].vals[index].getValue();
          if (offset[rel_dimensions[m]].length <= index) {
              offset[rel_dimensions[m]].push(new PFloat(relPropValue[rel_dimensions[m]] - conversion[rel_dimensions[m]]));
            
          } else {
            //offset[rel_dimensions[m]][index].setValue(relPropValue[rel_dimensions[m]] - conversion[rel_dimensions[m]]);
          }
          if (!exempt_index[rel_dimensions[m]][id]) {
            exempt_index[rel_dimensions[m]][id]=new PFloat(0);
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


      for (var f = 0; f < rel_dimensions.length; f++) {
        var exp_scale = 'y =' + convertFactor.toString() + ' * ' + 'x';
        var e = exp_scale + ' + ' + 'offsetValue';
        expression[rel_dimensions[f]] = e;

      }


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
    create: function(properties, json_loaded) {
      console.trace();
      this.stopListening();
      this.set('properties', properties);
      var offsets = {};
      var exempt_indicies = {};
      var expressions = [];
      var refProperties = [];
      var relProperties = [];
      var modes = {};

      if (!json_loaded) {

        this.set('modes', modes);

        this.set('offsets', offsets);
        this.set('exempt_indicies', exempt_indicies);
        this.set('expressions', expressions);
      } else {
        offsets = this.get('offsets');
        exempt_indicies = this.get('exempt_indicies');
        expressions = this.get('expressions');
        modes = this.get('modes');
      }
      this.set('relative_properties', relProperties);
      this.set('reference_properties', refProperties);
      var constraint_data = {};
      var self = this;
      var reference = this.get('references');
      var relative = this.get('relatives');

      var relative_range = relative.getRange();

      var setOnInstance = false;

      this.listenTo(relative.get('memberCount'), 'modified', function() {
        for (var h = 0; h < refProperties.length; h++) {
          for (var m = 0; m < refProperties[h][1].length; m++) {
            self.calculateReferenceValues(refProperties[h][0], refProperties[h][1][m]);
          }
        }
      });

      for (var j = 0; j < properties.length; j++) {

        var ref_prop = properties[j][0];
        var rel_prop = properties[j][1];
        var mode_list = properties[j][2];
        var exempt_list = properties[j][3];
        var refSplit = ref_prop.split('_');
        var ref_dimensions = refSplit[1];
        var ref_prop_key = refSplit[0];
        var relSplit = rel_prop.split('_');
        var rel_dimensions = relSplit[1];
        var rel_prop_key = relSplit[0];
        refProperties.push([ref_prop_key, ref_dimensions]);
        relProperties.push([rel_prop_key, rel_dimensions]);

        if (!json_loaded) {
          for (var m = 0; m < ref_dimensions.length; m++) {
            if (mode_list && mode_list[m]) {
              modes[ref_prop_key + '_' + ref_dimensions[m]] = mode_list[m];
            } else {
              modes[ref_prop_key + '_' + ref_dimensions[m]] = 'interpolate';
            }


          }
        }
        this.setReferenceValues(ref_prop_key, ref_dimensions);

        if (!json_loaded) {
          for (var g = 0; g < relative_range; g++) {
            var id = relative.getMemberAt(g).get('id');
            this.createOffsetFor(id, ref_prop_key, ref_dimensions, rel_prop_key, rel_dimensions);

          }
        }
        for (var n = 0; n < rel_dimensions.length; n++) {
          this.setConstraintOnSubProperty(reference, relative, expressions[rel_prop_key][rel_dimensions[n]], offsets[rel_prop_key][rel_dimensions[n]], ref_prop_key, ref_dimensions[n], rel_prop_key, rel_dimensions[n]);
        }
      }

      this.listenTo(reference.get('memberCount'), 'modified', function() {

        for (var i = 0; i < refProperties.length; i++) {
          (
            function(rpk, rd) {
              self.setReferenceValues(rpk, rd);
            }(refProperties[i][0], refProperties[i][1])
          );

        }
      });

      this.listenTo(relative.get('memberCount'), 'modified', function() {

        for (var i = 0; i < relProperties.length; i++) {
          (
            function(rpk, rd, rlpk, rld) {
              for (var g = 0; g < relative.get('memberCount').getValue(); g++) {
                var target = relative.getMemberAt(g);
                var id = target.get('id');
                self.createOffsetFor(id, rpk, rd, rlpk, rld);
                if(target.nodeParent.get('name')=='duplicator'){
                  for(var n=0;n<rd.length;n++){
                  self.updateOffset(rpk, rd[n], g, 0);
                  }
                }
                
              }
            }(refProperties[i][0], refProperties[i][1], relProperties[i][0], relProperties[i][1])
          );

        }
      });

    },


    getProperties: function() {
      var relative_properties = this.get('relative_properties');
      var reference_values = this.get('reference_values');
      var relative = this.get('relatives');
      var properties = [];
      for (var i = 0; i < relative_properties.length; i++) {
        var data = {
          name: relative_properties[i][0]
        };
        data.subproperties = [];
        for (var j = 0; j < relative_properties[i][1].length; j++) {
          var ref_vals = reference_values[relative_properties[i][0]][relative_properties[i][1][j]];
          var rel_vals = [];
          if (relative.get('type') === 'collection') {
            for (var k = 0; k < relative.members.length; k++) {
              rel_vals.push(relative.members[k].get(relative_properties[i][0])[relative_properties[i][1][j]]);
            }
          } else {
            rel_vals.push(relative.get(relative_properties[i][0])[relative_properties[i][1][j]]);
          }

          data.subproperties.push({
            name: relative_properties[i][1][j],
            ref_vals: ref_vals,
            rel_vals: rel_vals
          });
        }
        properties.push(data);
      }
      return properties;
    },



    getRelativeRange: function() {
      return this.get('relatives').getRange();
    },

    getOffsetsAt: function(index) {},

    //Start here, need to modify get relative at

    setConstraintOnSubProperty: function(reference, relative, expression, offset, ref_prop_key, ref_dimension, rel_prop_key, rel_dimension) {
      var self = this;
      var constraintF = function() {
        var list = [];

        
          var exempt_indicies = self.get('exempt_indicies');

          var relative_range = relative.getRange();
          var reference_values = self.get('reference_values');

          for (var z = 0; z < relative_range; z++) {
            var data = {};
            var y;
            data[rel_prop_key] = {};
            var relative_target = relative.getMemberAt(z);
            var relative_id = relative_target.get('id');
            //var isReference = relative.get(rel_prop_key)[rel_dimension].isReference(relative_target);
            if (exempt_indicies[rel_prop_key][rel_dimension][relative_id].getValue() === 1 || self.get('paused')) {
              y = relative_target.get(rel_prop_key)[rel_dimension].getValue();

            } else {
              var x = reference_values[ref_prop_key][ref_dimension].vals[z].getValue();
              var offsetValue = offset[z].getValue();
              eval(expression);
            }

            if (rel_prop_key === 'scalingDelta') {
              if (y === 0) {
                y = 0.1;
              }

            }
            data[rel_prop_key][rel_dimension] = y;

            list.push(data);

            relative_target.get(rel_prop_key)[rel_dimension].setValue(y);
            relative_target.get(rel_prop_key)[rel_dimension].getValue();
           

          }
          if (relative.get('type') == 'collection') {
            return list;
          } else {
            return list[0][rel_prop_key][rel_dimension];
          }
        
      };

      relative.get(rel_prop_key)[rel_dimension].setConstraint(constraintF, this);
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
          reference_values[ref_prop_key][target_dimension] = {
            min: null,
            max: null,
            vals: []
          };

        }


        var diff = reference_values[ref_prop_key][target_dimension].vals.length - self.get('relatives').getRange();
        if (diff > 0) {
          for (var j = 0; j < diff; j++) {
            var removedItem = reference_values[ref_prop_key][target_dimension].vals.pop();
          }
        } else if (diff < 0) {
          for (var k = 0; k < -diff; k++) {
            var newItem;
            if (reference_values[ref_prop_key][target_dimension].vals.length > 0) {
              var last = reference_values[ref_prop_key][target_dimension].vals[reference_values[ref_prop_key][target_dimension].vals.length - 1];
              newItem = new PFloat(last.getValue());
              newItem.setNull(true);
            } else {
              newItem = new PFloat(1);
              newItem.setNull(true);
            }

            reference_values[ref_prop_key][target_dimension].vals.push(newItem);
          }
        }
        self.calculateReferenceValues(ref_prop_key, target_dimension, reference_values[ref_prop_key]);
      });
    },

    getRange: function() {
      return this.get('ref_value_list').length;
    },



    calculateReferenceValues: function(ref_prop_key, ref_dimension) {

      var mode = this.get('modes')[ref_prop_key + '_' + ref_dimension];
      var reference_values = this.get('reference_values')[ref_prop_key];

      //if((ref_prop_key==='fillColor' || ref_prop_key ==='strokeColor')&&
      switch (mode) {
        case 'interpolate':
          this.calculateReferenceValuesInterpolate(ref_prop_key, ref_dimension, reference_values);
          break;
        case 'random':
          this.calculateReferenceValuesRandom(ref_prop_key, ref_dimension, reference_values);
          break;
        case 'radial':
          this.calculateReferenceValuesRadial(ref_prop_key, ref_dimension, reference_values);
          break;
        case 'gaussian':
          this.calculateReferenceValuesGaussian(ref_prop_key, ref_dimension, reference_values);
          break;
         case 'alternate':
          this.calculateReferenceValuesAlternate(ref_prop_key, ref_dimension, reference_values);
        break;
        default:
          break;
      }
    },

    /*calculateNullReferenceValues: function(ref_prop_key, ref_dimension, reference_values){

        var range = this.get('relatives').getRange();
        for (var m = 0; m < range; m++) {
          if (reference_values[ref_dimension][m]) {
            reference_values[ref_dimension][m].setValue(-1);
          } else {
            var newVal = new PFloat(-1);
            newVal.setNull(false);
            reference_values[ref_dimension].push(newVal);
          }
        }
      
    },*/


    calculateReferenceValuesAlternate: function(ref_prop_key, ref_dimension, reference_values) {
      var reference = this.get('references');
      if (reference) {
        var members;
        if (reference.get('type') == 'collection' || reference.get('name') === 'duplicator') {
          members = reference.members;
        } else {
          members = [reference, reference];
        }
        var reference_points = [];
        for(var i=0;i<members.length;i++){
          reference_points.push(members[i].get(ref_prop_key)[ref_dimension].getValue());
        }
      
        var range = this.get('relatives').getRange();
        var count = 0;
        for (var m = 0; m < range; m++) {

          var y_val = reference_points[count];
          count++;
          if(count>reference_points.length-1){
            count = 0;
          }
          if (reference_values[ref_dimension].vals[m]) {
            reference_values[ref_dimension].vals[m].setValue(y_val);
          } else {
            var newVal = new PFloat(y_val);
            newVal.setNull(false);
            reference_values[ref_dimension].vals.push(newVal);
          }
        }
      }

    },


    calculateReferenceValuesRandom: function(ref_prop_key, ref_dimension, reference_values) {
      var reference = this.get('references');
      if (reference) {
        var members;
        if (reference.get('type') == 'collection' || reference.get('name') === 'duplicator') {
          members = reference.members;
        } else {
          members = [reference, reference];
        }
        var reference_points = [];
        var points = [];
        var min, max, min_offset;
        var fMin = reference_values.min;
        var fMax = reference_values.max;
        var reset = true;
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
          }
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


          reference_points.push(points);
        }
        /*if (fMin && fMax) {
          var fdiff = fMax - fMin;
          var newDiff = max - min;

          if (Math.abs(fdiff - newDiff) === 0) {
            reset = false;
            min_offset = min - fMin;
          }
        }*/


        var range = this.get('relatives').getRange();
        for (var m = 0; m < range; m++) {

          var y = Math.floor(Math.random() * (max - min + 1) + min);

          if (reference_values[ref_dimension].vals[m]) {
            if (reset) {
              reference_values[ref_dimension].vals[m].setValue(y);
            } else {
              reference_values[ref_dimension].vals[m].add(min_offset);
            }
          } else {
            var newVal = new PFloat(y);
            newVal.setNull(false);
            reference_values[ref_dimension].vals.push(newVal);
          }
        }
        reference_values.min = min;
        reference_values.max = max;
      }


    },

    calculateReferenceValuesGaussian: function(ref_prop_key, ref_dimension, reference_values) {
      var reference = this.get('references');
      if (reference) {
        var members;
        if (reference.get('type') == 'collection' || reference.get('name') === 'duplicator') {
          members = reference.members;
        } else {
          members = [reference, reference];
        }
        var reference_points = [];
        var points = [];
        var mean, std;
        mean = members[0].get(ref_prop_key)[ref_dimension].getValue();
        std = Math.abs(mean - members[1].get(ref_prop_key)[ref_dimension].getValue());
        var range = this.get('relatives').getRange();

        for (var m = 0; m < range; m++) {

          var y_val = (std * ziggurat.nextGaussian()) + mean;

          if (reference_values[ref_dimension].vals[m]) {
            reference_values[ref_dimension].vals[m].setValue(y_val);
          } else {
            var newVal = new PFloat(y_val);
            newVal.setNull(false);
            reference_values[ref_dimension].vals.push(newVal);
          }
        }
      }

    },

    calculateReferenceValuesRadial: function(ref_prop_key, ref_dimension, reference_values) {
      if (ref_prop_key === 'translationDelta') {
        this.calculateReferenceValuesPolar(ref_prop_key, ref_dimension, reference_values);
      } else {
        var reference = this.get('references');
        if (reference) {
          var members;
          if (reference.get('type') == 'collection' || reference.get('name') === 'duplicator') {
            members = reference.members;
          } else {
            members = [reference, reference];
          }
          var diff = members[1].get(ref_prop_key)[ref_dimension].getValue() - members[0].get(ref_prop_key)[ref_dimension].getValue();

          var range = this.get('relatives').getRange();
          var increment = diff / range;
          var vals = [];
          vals.length = range;

          for (var m = 0; m < range; m += 2) {
            var y = members[0].get(ref_prop_key)[ref_dimension].getValue() + m * increment;
            vals[m] = y;
          }
          for (var m = 1; m < range; m += 2) {
            var y = members[members.length - 1].get(ref_prop_key)[ref_dimension].getValue() + ((m + 1) * increment);

            vals[m] = y;
          }
          for (var m = 0; m < range; m++) {

            if (reference_values[ref_dimension].vals[m]) {
              reference_values[ref_dimension].vals[m].setValue(vals[m]);
            } else {
              var newVal = new PFloat(vals[m]);
              newVal.setNull(false);
              reference_values[ref_dimension].vals.push(newVal);
            }
          }

        }
      }

    },

    calculateReferenceValuesPolar: function(ref_prop_key, ref_dimension, reference_values) {
      var reference = this.get('references');
      if (reference) {
        var members;
        if (reference.get('type') == 'collection') {
          members = reference.members;
        } else {
          members = [reference, reference];
        }
        var reference_points = [];
        var min, max;
        var points = [];
        var minPoint = {};
        var maxPoint = {};
        var origin = {
          x: 0,
          y: 0
        };
        if (ref_dimension === 'x' || ref_dimension === 'y') {
          min = {
            x: members[0].getValue()[ref_prop_key]['x'],
            y: members[0].getValue()[ref_prop_key]['y']
          };
          max = {
            x: members[1].getValue()[ref_prop_key]['x'],
            y: members[1].getValue()[ref_prop_key]['y']
          };

        } else {
          min = {
            x: members[0].get(ref_prop_key)[ref_dimension].getValue(),
            y: members[0].get(ref_prop_key)[ref_dimension].getValue()
          };
          max = {
            x: members[1].get(ref_prop_key)[ref_dimension].getValue(),
            y: members[1].get(ref_prop_key)[ref_dimension].getValue()
          };
        }

        var center = TrigFunc.midpoint(min, max);
        var polar_min = TrigFunc.cartToPolar(center, min);
        var polar_max = TrigFunc.cartToPolar(center, max);
       // console.log("rad",polar_min.rad,polar_max.rad);
        var range = this.get('relatives').getRange();
        var theta_increment = Math.PI / (range);
        var vals = [];
        vals.length = range;
        for (var m = 0; m < range; m += 2) {
          var y;
          var angle;
          angle = polar_min.theta + (theta_increment * m);

          if (ref_dimension == 'y') {
            y = (Math.sin(angle) * polar_min.rad) + center.y;
          } else {
            y = (Math.cos(angle) * polar_min.rad) + center.x;

          }
          vals[m] = y;
        }

         for (var m = 1; m < range; m += 2) {
          var y;
          var angle;
          angle = polar_max.theta + (theta_increment * (m + 1));

          if (ref_dimension == 'y') {
            y = (Math.sin(angle) * polar_min.rad) + center.y;
          } else {
            y = (Math.cos(angle) * polar_min.rad) + center.x;

          }
          vals[m] = y;
        }

        for (var m = 0; m < range; m++) {
         /* var val = this.get('relatives').members[m].getValue()[ref_prop_key][ref_dimension];
           console.log('val for',m,val);
          if (reference_values[ref_dimension].vals[m]) {
            reference_values[ref_dimension].vals[m].setValue(val);
          } else {
            var newVal = new PFloat(val);
            newVal.setNull(false);
            reference_values[ref_dimension].vals.push(newVal);
          }*/
          //console.log('val for',m,vals[m]);
          if (reference_values[ref_dimension].vals[m]) {
            reference_values[ref_dimension].vals[m].setValue(vals[m]);

          } else {
            var newVal = new PFloat(vals[m]);
            newVal.setNull(false);
            if(reference_values[ref_dimension].vals.length<2){
              reference_values[ref_dimension].vals.push(newVal);
            }
            else{
                reference_values[ref_dimension].vals.splice(reference_values.length-1,0,newVal);
            }
          }
        }

       reference_values[ref_dimension].vals.length = range;


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
              y: members[i].getValue()[ref_prop_key] //[ref_dimension]
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
          if (reference_values[ref_dimension].vals[m]) {
            reference_values[ref_dimension].vals[m].setValue(y);
          } else {
            var newVal = new PFloat(y);
            newVal.setNull(false);
            reference_values[ref_dimension].vals.push(newVal);
          }
        }
      }
    },


    getReferencePoints: function() {
      return (this.get('reference_points'));
    },

    getFunctionPath: function() {
      return this.get('functionPath');
    },



    clearSelection: function() {
      if (this.get('references')) {
        this.get('references').get('constraintSelected').setValue(false);

      }
      if (this.get('relatives')) {
        this.get('relatives').get('constraintSelected').setValue(false);

      }
    },


    clearUI: function() {
      if(this.get('ref_handle')){
        this.get('ref_handle').remove();
      }
      if(this.get('rel_handle')){
        this.get('rel_handle').remove();
      }
      this.set('ref_handle', null);
      this.set('rel_handle', null);

    },

    removeConstraintOn: function(property,dimensions,registerUndo){
      if (registerUndo) {
        this.addToUndoStack();
      }
      var relatives = this.get('relatives');
      relatives.removeConstraint(property, dimensions);

      var filtered_props = this.get('properties').filter(function(p){
          if(p[0].indexOf(property) > -1){
            return false;
          }
          return true;
      });
            this.set('properties',filtered_props);

    var filtered_rel_props = this.get('relative_properties').filter(function(p){
          if(p[0].indexOf(property) > -1){
            return false;
          }
          return true;
      });
            this.set('relative_properties',filtered_rel_props);

            console.log('removing constraint for',property, dimensions,this.get('properties'));

      //need to do something about removing object from property list. which will be a pain.
    },

    deleteSelf: function() {
      this.stopListening();
      this.clearUI();
      this.clearSelection();
      var relatives = this.get('relatives');
      var relative_properties = this.get('relative_properties');
      for (var j = 0; j < relative_properties.length; j++) {
        var rprop = relative_properties[j][1].split("");
        relatives.removeConstraint(relative_properties[j][0], rprop);
      }

      var reference_values = this.get('reference_values');
      var prop, subprop, i;
      for (prop in reference_values) {
        if (reference_values.hasOwnProperty(prop)) {
          for (subprop in reference_values[prop]) {
            if (reference_values[prop].hasOwnProperty(subprop)) {
              var ref_vals = reference_values[prop][subprop];
              for (i = 0; i < ref_vals.length; i++) {
                ref_vals[i].deleteSelf();
              }
              ref_vals.length = 0;
            }
          }
        }
      }

      var offsets = this.get('offsets');
      for (prop in offsets) {
        if (offsets.hasOwnProperty(prop)) {
          for (subprop in offsets[prop]) {
            if (offsets[prop].hasOwnProperty(subprop)) {
              var offset_vals = offsets[prop][subprop];
              for (i = 0; i < offset_vals.length; i++) {
                offset_vals[i].deleteSelf();
              }
              offset_vals.length = 0;
            }
          }
        }
      }

      var exempt_indicies = this.get('exempt_indicies');
      for (prop in exempt_indicies) {
        if (exempt_indicies.hasOwnProperty(prop)) {
          for (subprop in exempt_indicies[prop]) {
            if (exempt_indicies[prop].hasOwnProperty(subprop)) {
              var exempt_vals = exempt_indicies[prop][subprop];
              for (i = 0; i < exempt_vals.length; i++) {
                exempt_vals[i].deleteSelf();
              }
              exempt_vals.length = 0;
            }
          }
        }
      }

      this.set('reference_values', null);
      this.set('expressions', null);
      this.set('relatives', null);
      this.set('references', null);
      this.set('relatives', null);
      this.set('offsets', null);
      this.set('exempt_indicies', null);

    },

    // FIXME: i think this is never called, and if so, it can be removed
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