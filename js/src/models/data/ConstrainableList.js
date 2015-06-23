/*ConstrainableList.js
 * list which can enact iterative constraints on its members
 */

define([
    'underscore',
    'models/data/ListNode',
    'utils/PFloat',
    'utils/PBool',
    'paper',
    'utils/PConstraint',

  ],

  function(_, ListNode, PFloat, PBool, paper, PConstraint) {
    var ConstrainableList = ListNode.extend({
      defaults: _.extend({}, ListNode.prototype.defaults, {
        name: 'list',
        index: 0,
      }),

      initialize: function() {
        ListNode.prototype.initialize.apply(this, arguments);
        this.get('translation_delta').setNull(false);
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

        this.set('ui', geom);
        this.indexNumbers = [];
      },

      //overrides ListNode addMember and removeMember functions
      addMember: function(data) {
        ListNode.prototype.addMember.call(this, data);
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
          this.indexNumbers.push(numText);
        }
      },

      removeMember: function(data) {
        ListNode.prototype.removeMember.call(this, data);
        var diff = this.indexNumbers.length - this.members.length;
        console.log('diff', diff);
        for (var i = 0; i < diff; i++) {
          var numText = this.indexNumbers.pop();
          numText.remove();
        }
      },


      reset: function() {
        ListNode.prototype.reset.call(this, arguments);
        this.setIndex(0);
        var ui = this.get('ui');
        ui.position.x = 0;
        ui.position.y = 0;

      },

      getIndex: function() {
        return this.get('index');
      },

      setIndex: function(value) {
        this.set('index', value);
      },


      increment: function() {
        var start = 0;
        var end = this.members.length;
        var index = this.getIndex();

        if (index < end) {
          var newIndex = index + 1;
          this.setIndex(newIndex);
        }
      },

      /*compile: function() {
        var constraints = this.getConstraint();
        console.log('list constraints', constraints);
        for (var i = 0; i < this.members.length; i++) {
          var i_matricies = this.compileTransforms();
         if (this.members[i].get('type') === 'list') {
            this.members[i].reset();
          }
          this.compileMemberAt(i, i_matricies, constraints);
          this.increment();
        }
      },*/

      updateMemberTranslation: function(){
        var deltaConstrained = this.get('translation_delta').isConstrained();
       // var memberDeltaConstrained = this.get()
      },


      compileMemberAt: function(index, list_constraints) {
        console.log('list_constraints');
        var member = this.members[index];

        member.modifyAfterCompile('translation_delta');
      },
      /*  var delta = this.inheritProperty(propname);

        if (delta) {
          var member = this.members[index];
          var member_property = member.inheritProperty(propname);
          var matrixMap = this.get('matrix_map');
          var matrix_props = matrixMap[propname].properties;
          var member_matrix = member.get(matrixMap[propname].name);
          var delta_constrained = delta.isSelfConstrained();
          var member_property_constrained = member_property.isSelfConstrained();

          for (var p in matrix_props) {
            if (delta.hasOwnProperty(p)) {
              var delta_subproperty_constrained = false;
              var member_subproperty_constrained = false;
              if (delta[p] instanceof PConstraint) {
                delta_subproperty_constrained = delta[p].isSelfConstrained();
                member_subproperty_constrained = member_property[p].isSelfConstrained();
              }
              for (var i = 0; i < matrix_props[p].length; i++) {
                if ((delta_subproperty_constrained || delta_constrained) && !member_subproperty_constrained && !member_property_constrained) {
                  member_matrix[matrix_props[p][i]] = 0;
                }
                if (member_subproperty_constrained || member_property_constrained) {
                  l_matrix[matrix_props[p][i]] = 0;
                }
              }
            }
          }
          member_matrix.concatenate(l_matrix);
        }

      },*/

      //renders the List UI
      render: function() {
        ListNode.prototype.render.call(this, arguments);
        var ui = this.get('ui');
        var bottomLeft = this.get('screen_bottom_left').getValue();
        for (var i = 0; i < this.indexNumbers.length; i++) {
          var numText = this.indexNumbers[i];
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

        ui.position = new paper.Point(bottomLeft.x + ui.bounds.width / 2, bottomLeft.y + ui.bounds.height / 2);
        this.startText.content = 'count: '+ String(this.members.length);

        //this.renderSelection(geom);
        if (this.get('selected') || this.get('open')) {
          ui.visible = true;
        } else {
          ui.visible = false;
        }

      },
    });
    return ConstrainableList;

  });