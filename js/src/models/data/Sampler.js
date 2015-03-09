/*Sampler.js
 * base class for sampler datatype
 * inherits from ListNode
 */

define([
    'underscore',
    'models/data/ListNode',
    'utils/PFloat',
    'utils/PBool',
    'paper'
  ],

  function(_, ListNode, PFloat, PBool, paper) {
    var Sampler = ListNode.extend({
      defaults: _.extend({}, ListNode.prototype.defaults, {
        name: 'sampler',
        type: 'sampler',
        index: null,
        value: null,
        multiplier: null,
        start_index: null,
        end_index: null,
        max_val: null,
        min_val: null,
        loop: null,
      }),

      initialize: function() {

        this.set('start_index', new PFloat(0, 'set'));
        this.set('end_index', new PFloat(0, 'set'));
        this.set('max_val', new PFloat(1, 'set'));
        this.set('min_val', new PFloat(0, 'set'));
        this.set('value', new PFloat(0, 'set'));
        this.set('index', new PFloat(0, 'set'));
        this.set('multiplier', new PFloat(1, 'set'));

        this.set('loop', new PBool(false));
        ListNode.prototype.initialize.apply(this, arguments);

        var rectangle = new paper.Rectangle(new paper.Point(0, 0), new paper.Size(100, 20));
        var cornerSize = new paper.Size(10, 10);
        var path = new paper.Path.Rectangle(rectangle);
        path.strokeColor = this.get('primary_selection_color');
        //path.fillColor = 'white';
        //path.fillColor.alpha = 0.95;
        this.get('translation_delta').setNull(false);

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

        this.set('geom', geom);
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
        for(var j=0;j<this.members.length;j++){
          this.members[j].get('geom').bringToFront();
        }
      },

      removeMember: function(data) {
        ListNode.prototype.removeMember.call(this, data);
        var diff = this.members.length - this.indexNumbers.length;
        for (var i = 0; i < diff; i++) {
          var numText = this.indexNumbers.pop();
          numText.remove();
        }
      },


      reset: function() {
        ListNode.prototype.reset.call(this, arguments);
        var start = this.accessProperty('start_index');
        this.setIndex(start);
        var geom = this.get('geom');
        geom.position.x = 0;
        geom.position.y = 0;

      },

      setRange: function(start, end, loop) {
        this.setStart(start);
        this.setEnd(end);
        if (loop) {
          this.setLoop(loop);
        }

      },

      setMaxMin: function(max, min) {
        this.setMax(max);
        this.setMin(min);
      },

      setValue: function(value) {
        this.modifyProperty({
          value: {
            val: value,
            operator: 'set'
          }
        });
      },


      setMultiplier: function(value) {
        this.modifyProperty({
          multiplier: {
            val: value,
            operator: 'set'
          }
        });
      },



      setIndex: function(value) {
        this.modifyProperty({
          index: {
            val: value,
            operator: 'set'
          }
        });
      },

      getIndex: function() {
        return this.accessProperty('index');
      },


      setStart: function(value) {
        this.modifyProperty({
          start_index: {
            val: value,
            operator: 'set'
          }
        });
      },

      setEnd: function(value) {
        this.modifyProperty({
          end_index: {
            val: value,
            operator: 'set'
          }
        });
      },

      //places a constraint on the end and start values
      constrainRange: function(list) {
        console.log('attempting to constrain range');
        if (list.get('type') === 'list' || list.get('type') === 'sampler') {
          var endIndex = this.get('end_index');
          var constraintF = function() {
            var num = list.members.length-1;
            endIndex.setValue(num);
            return num;
          };
          endIndex.setConstraint(constraintF);
        }
      },

      setMax: function(value) {
        this.modifyProperty({
          max: {
            val: value,
            operator: 'set'
          }
        });

      },

      setMin: function(value) {
        this.modifyProperty({
          min: {
            val: value,
            operator: 'set'
          }
        });
      },

      setLoop: function(value) {
        this.modifyProperty({
          loop: {
            val: value,
            operator: 'set'
          }
        });
      },

      increment: function() {
        var start = this.accessProperty('start_index');
        var end = this.accessProperty('end_index');
        var index = this.accessProperty('index');
        var loop = this.accessProperty('loop');
        if (index < end) {
          var newIndex = index + 1;
          this.setIndex(newIndex);
        } else {
          if (loop) {
            this.setIndex(start);
          }
        }
      },


      getValue: function() {
        return this.accessProperty('value');
      },


      compile: function() {



      },


      render: function() {
        ListNode.prototype.render.call(this, arguments);
        var geom = this.get('geom');
        var bottomLeft = this.get('screen_bottom_left').getValue();
        for (var i = 0; i < this.indexNumbers.length; i++) {
          var numText = this.indexNumbers[i];
          numText.content = (i+1);
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

        geom.position = new paper.Point(bottomLeft.x + geom.bounds.width / 2, bottomLeft.y + geom.bounds.height / 2);
        this.startText.content = 'range: ' + this.accessProperty('start_index') + ' - ' + this.accessProperty('end_index');

        //this.renderSelection(geom);
        if (this.get('selected') || this.get('open')) {
          geom.visible = true;
        } else {
          geom.visible = false;
        }



      },


    });

    return Sampler;
  });