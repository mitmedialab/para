/*ConstrainableList.js
 * list which can enact iterative constraints on its members
 */

define([
    'underscore',
    'models/data/ListNode',
    'utils/PFloat',
    'utils/PBool',
    'paper',
    'models/data/ListFunction'
  ],

  function(_, ListNode, PFloat, PBool, paper, ListFunction) {
    var ConstrainableList = ListNode.extend({
      defaults: _.extend({},ListNode.prototype.defaults, {
        name: 'constrainable_list',
        index: 0,
      }),

      initialize: function() {
        ListNode.prototype.initialize.apply(this, arguments);
        this.get('translation_delta').setNull(false);
        this.listFunction = new ListFunction();
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
        this.set('index',value);
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

      compileMemberAt: function(index, propname, l_matrix) {
        ListNode.prototype.compileMemberAt.call(this, index, propname, l_matrix);
        this.increment();
        console.log('index=',index);
        this.listFunction.getValue(this.get('index'),this.members.length);
      },



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
        this.startText.content = 'range: ' + 0 + ' - ' + 10;

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