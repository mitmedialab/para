/*ConstrainableList.js
 * list which can enact iterative constraints on its members
 */

define([
    'underscore',
    'models/data/collections/ListNode',
    'models/data/properties/PFloat',
    'models/data/properties/PBool',
    'paper',
    'models/data/properties/PConstraint',
    'utils/TrigFunc',
    'models/data/Instance',
            'models/data/Constraint',


  ],

  function(_, ListNode, PVal, PBool, paper, PConstraint, TrigFunc, Instance, Constraint) {
    var ConstrainableList = ListNode.extend({
      defaults: _.extend({}, ListNode.prototype.defaults, {
        name: 'list',
        user_name: 'list'
      }),

      initialize: function() {
        ListNode.prototype.initialize.apply(this, arguments);
         //this.internalList = new ConstrainableList();

         //this.internalList.set('id', 'internal' + this.internalList.get('id'));
           //        this.internalList.get('ui').remove();

        //code for creating list UI
        var rectangle = new paper.Rectangle(new paper.Point(0, 0), new paper.Size(100, 20));
        var path = new paper.Path.Rectangle(rectangle);
        path.strokeColor = this.get('primary_selection_color');
        path.fillColor = 'black';
        this.startText = new paper.PointText({
          point: new paper.Point(5, 13),
          content: 'range:',
          justification: 'left',
          fontSize: 12,
          fontFamily: 'Source Sans Pro',
          fillColor: this.get('primary_selection_color')
        });

        var geom = new paper.Group();
        geom.addChild(path);
        geom.addChild(this.startText);
        this.startText.data.instance = geom.data.instance = path.data.instance = this;
        var targetLayer = paper.project.layers.filter(function(layer) {
          return layer.name === 'ui_layer';
        })[0];
        targetLayer.addChild(geom);
        this.set('ui', geom);
        this.indexNumbers = [];

        this.get('scalingDelta').setValue({
          x: 1,
          y: 1
        });
        this.count = 0;

        this.internalConstraints = [];
      },

      getInternalConstraint: function() {
        return this.internalConstraints;
      },

       setInternalConstraint: function(reference_list) {
          this.internalConstraints = [];
          if(this.members.length>0){

          reference_list.addMember(this.members[0]);

            if(this.members.length>1){
              reference_list.addMember(this.members[this.members.length - 1]);
            }

              var constraint = new Constraint();
                constraint.set('references', reference_list);
                constraint.set('relatives', this);
                constraint.set('proxy_references', this.members[0]);
                var data = [
                    ['translationDelta_xy', 'translationDelta_xy', ['interpolate', 'interpolate']],
                    ['scalingDelta_xy', 'scalingDelta_xy', ['interpolate', 'interpolate']],
                    ['fillColor_hsla', 'fillColor_hsla', ['interpolate', 'interpolate', 'interpolate']],
                    ['strokeColor_hsla', 'strokeColor_hsla', ['interpolate', 'interpolate', 'interpolate']],
                    ['rotationDelta_v', 'rotationDelta_v', ['interpolate', 'interpolate']],
                    ['strokeWidth_v', 'strokeWidth_v', ['interpolate', 'interpolate']],
                    ['blendMode_v', 'blendMode_v', ['alternate', 'alternate']]
                ];

                // NOTE: this is only for when the list appears directly in the UI!
                data.map(function(datum) { return datum[1]; }).forEach(function (propAndDims) {
                  var split = propAndDims.split('_');
                  var prop = split[0];
                  var dims = split[1];
                  
                  for (var i = 0; i < dims.length; ++i) {
                    for (var j = 0; j < reference_list.members.length; ++j) {
                      constraint.setExempt(prop, dims[i], reference_list.members[j].get('id'), true);
                    }
                  }
                });

                if (!constraint.create(data)) {
                  return null;
                }

                this.internalConstraints.push(constraint);
              }

         this.referenceList = reference_list;
                return this.internalConstraints;
            },

      /*setValue
      passes modifications onto members, stripped of any properties that are constrained on the list
      */
      // FIXME: this should probably be split into two different
      // functions, to handle the two branches separately (one is
      // specific to user interaction; the other is when it's used
      // e.g. as part of a duplicator)
      setValue: function(data, registerUndo) {
        Instance.prototype.setValue.call(this, data, registerUndo);

        if (this.referenceList)
        {
          // this branch is taken if setInternalConstraint() has been
          // called on this list, i.e. if the list is internally
          // constrained by its endpoints

          for (var i = 0; i < this.referenceList.members.length; ++i) {
            this.referenceList.members[i].setValue(data, registerUndo);
          }
        }
        else
        {
          // this branch is taken if setInternalConstraint() has NOT
          // been called, which means the endpoints are not what
          // control the values

          var constrained_props = this.getConstraintValues();
          for (var i = 0; i < this.members.length; i++) {
            this.members[i].setValue(data, registerUndo);
          }

        }

        this.trigger('modified', this);
      },

      setValueEnded: function() {
        this.stateStored = false;
        for (var i = 0; i < this.members.length; i++) {
          this.members[i].setValueEnded();
        }
      },

      /* getConstraintValues
       * returns an object containing all constrained properties of
       * this instance with their values;
       * TODO: Make recursive (will not work for objects with 3+ leves of heirarchy)
       */
      getConstraintValues: function() {
        var constraints = this.getConstraint();
        if (constraints.getValue) {
          return constraints.getValue();
        } else {
          var valuelist = [];
          for (var i = 0; i < this.members.length; i++) {
            var value = {};
            for (var c in constraints) {
              if (constraints.hasOwnProperty(c)) {
                if (constraints[c].getValue) {
                  var cValue = constraints[c].getValue();
                  if (cValue instanceof Array) {
                    value[c] = cValue[i][c];
                  } else {
                    value[c] = cValue;
                  }
                } else {

                  value[c] = {};
                  for (var v in constraints[c]) {
                    if (constraints[c].hasOwnProperty(v)) {

                      var scValue = constraints[c][v].getValue();
                      if (scValue instanceof Array) {
                        value[c][v] = scValue[i][c][v];
                      } else {
                        value[c][v] = scValue;
                      }
                    }
                  }
                }
              }
            }
            valuelist.push(value);
          }
          return valuelist;
        }
      },


      removeConstraint: function(prop, dimensions) {
        var constraint_values = this.getConstraintValues();
        for (var i = 0; i < this.members.length; i++) {
          var data = {};
          data[prop] = constraint_values[i][prop];
          this.members[i].setValue(data);
          this.increment();
        }
        ListNode.prototype.removeConstraint.call(this, prop, dimensions);
      },


      //overrides ListNode addMember and removeMember functions
      addMember: function(data, index) {
        ListNode.prototype.addMember.call(this, data, index);
        this.addMemberNotation();

      },

      addMemberNotation: function() {
        var diff = this.members.length - this.indexNumbers.length;
        for (var i = 0; i < diff; i++) {
          var numText = new paper.PointText({
            point: new paper.Point(0, 0),
            content: '0',
            justification: 'left',
            fontSize: 12,
            fontFamily: 'Source Sans Pro',
            fillColor: this.get('primary_selection_color')
          });
          var targetLayer = paper.project.layers.filter(function(layer) {
            return layer.name === 'ui_layer';
          })[0];
          targetLayer.addChild(numText);
          this.indexNumbers.push(numText);
        }
      },

      removeMember: function(data) {
        var memberIndex = _.indexOf(this.members, data);
        var member = ListNode.prototype.removeMember.call(this, data);
        this.removeMemberNotation();
        return member;
      },

      removeMemberNotation: function() {
        var diff = this.indexNumbers.length - this.members.length;
        for (var i = 0; i < diff; i++) {
          var numText = this.indexNumbers.pop();
          numText.remove();
        }
      },

      deleteSelf: function() {
        var data = ListNode.prototype.deleteSelf.call(this);
        var ui = this.get('ui');
        ui.remove();
        ui = null;
        if (this.get('selectionClone')) {
          this.get('selectionClone').remove();
        }
        for (var i = 0; i < this.members.length; i++) {
          if (this.members[i].get('type') == 'collection') {

            this.members[i].deleteSelf();

          }
        }
        this.members.length = 0;
        this.stopListening();
        return data;
      },


      increment: function() {
        var start = 0;
        var end = this.members.length;
        var value = this.get('index').getValue();

        if (value < end - 1) {
          var newIndex = value + 1;
          this.get('index').setValue(newIndex);
        }
      },

      //callback triggered when a subproperty is modified externally 
      modified: function() {
        var constrained_props = this.getConstraintValues();
        this.setNull(false);
        this.trigger('modified', this);
      },



      //renders the List UI
      render: function() {
        this.get('index').setValue(0);
        var ui = this.get('ui');
        ui.position.x = 0;
        ui.position.y = 0;

        ListNode.prototype.render.call(this, arguments);
        var ui = this.get('ui');
        var bottomLeft = this.get('screen_bottom_left').getValue();
        for (var i = 0; i < this.members.length; i++) {
          var numText = this.indexNumbers[i];
          if (numText) {
            numText.content = (i + 1);
            numText.position = this.members[i].get('screen_bottom_left').toPaperPoint();
            numText.position.x += 10;
            numText.position.y -= 10;
            if (this.get('open')) {
              numText.visible = true;
            } else {
              numText.visible = false;
            }
            numText.bringToFront();
          }
        }

        ui.position = new paper.Point(bottomLeft.x + ui.bounds.width / 2, bottomLeft.y + ui.bounds.height / 2);
        this.startText.content = 'count: ' + String(this.members.length);

        this.renderSelection(ui);
        this.trigger('rendered', this);

      },

      renderSelection: function(ui) {
        var selected = this.get('selected').getValue();
        var constraint_selected = this.get('constraintSelected').getValue();
        var bbox = this.get('bbox');


        if (selected || this.get('open') || constraint_selected) {
          ui.visible = true;
          bbox.selectedColor = (constraint_selected) ? this.get(constraint_selected + '_color') : this.getSelectionColor();

          bbox.selected = true;
          bbox.visible = true;
          if (this.get('open') && !constraint_selected) {
            bbox.strokeColor = new paper.Color(255, 0, 0, 0.5);
            bbox.strokeWidth = 1;
            bbox.visible = true;
            bbox.selected = false;
          }
        } else {
          ui.visible = false;
          bbox.selected = false;
          bbox.visible = false;
        }



      }

    });
    return ConstrainableList;

  });
