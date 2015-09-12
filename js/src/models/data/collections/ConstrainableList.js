/*ConstrainableList.js
 * list which can enact iterative constraints on its members
 */

define([
    'underscore',
    'models/data/collections/ListNode',
    'utils/PFloat',
    'utils/PBool',
    'paper',
    'utils/PConstraint',
    'utils/TrigFunc',
    'models/data/Instance'

  ],

  function(_, ListNode, PFloat, PBool, paper, PConstraint, TrigFunc, Instance) {
    var ConstrainableList = ListNode.extend({
      defaults: _.extend({}, ListNode.prototype.defaults, {
        name: 'list',
      }),

      initialize: function() {
        ListNode.prototype.initialize.apply(this, arguments);
        //code for creating list UI
        var rectangle = new paper.Rectangle(new paper.Point(0, 0), new paper.Size(100, 20));
        var path = new paper.Path.Rectangle(rectangle);
        path.strokeColor = this.get('primary_selection_color');

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
      },

    /*setValue
    passes modifications onto members, stripped of any properties that are constrained on the list
    */
      setValue: function(data) {
        Instance.prototype.setValue.call(this.data);
        var constrained_props = this.getConstraintValues();
        for (var i = 0; i < this.members.length; i++) {
          if (constrained_props[i]) {
            var reference_status = this.isReference(this.members[i]);
            var set_data = this.members[i].getAddedValueFor(data);
            var stripped_data = TrigFunc.stripBoolean(set_data, constrained_props[i], reference_status);
            this.members[i].setValue(stripped_data);
          } else {
            this.members[i].setValue(data);
          }
        }
        this.trigger('modified', this);
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

      reset: function() {
        ListNode.prototype.reset.call(this, arguments);
        this.get('index').setValue(0);
        var ui = this.get('ui');
        ui.position.x = 0;
        ui.position.y = 0;

      },

      deleteSelf: function() {
        var data =ListNode.prototype.deleteSelf.call(this);
        var ui = this.get('ui');
        ui.remove();
        ui = null;
        if(this.get('selectionClone')){
          this.get('selectionClone').remove();
        }
        for(var i=0;i<this.members.length;i++){
          if(this.members[i].get('type')=='collection'){
            this.members[i].deleteSelf();
          }
        }
        this.members.length = 0;
        this.members = null;
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
        var selection_clone = this.get('selection_clone');
        var bbox = this.get('bbox');

        if (constraint_selected) {
          if (!selection_clone) {
            this.createSelectionClone();
            selection_clone = this.get('selection_clone');
          }
          selection_clone.visible = true;
          selection_clone.strokeColor = this.get(constraint_selected + '_color');
          bbox.selected = false;

        } else {
          if (selection_clone) {
            selection_clone.visible = false;
          }
          if (selected || this.get('open')) {
            ui.visible = true;
          } else {
            ui.visible = false;
          }

          bbox.selectedColor = this.getSelectionColor();
          bbox.selected = this.get('selected').getValue();
          bbox.visible = this.get('selected').getValue();
          if (this.get('open')) {
            bbox.strokeColor = new paper.Color(255, 0, 0, 0.5);
            bbox.strokeWidth = 1;
            bbox.visible = true;
          }
        }



      }

    });
    return ConstrainableList;

  });