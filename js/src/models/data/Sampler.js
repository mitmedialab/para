/*Sampler.js
 * base class for sampler datatype
 * inherits from ListNode
 */

define([
    'underscore',
    'models/data/ListNode',
    'utils/PFloat',
    'utils/PPoint',

    'utils/PBool',
    'paper'
  ],

  function(_, ListNode, PFloat, PPoint, PBool, paper) {
    var Sampler = ListNode.extend({
      defaults: _.extend({}, ListNode.prototype.defaults, {
        name: 'sampler',
        type: 'sampler',
        index: null,
        value: null,
        multiplier: null,
        multiplier_map: null,
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
        this.set('multiplier_map', new PPoint(0, 1, 'set'));
        this.set('loop', new PBool(false));
        ListNode.prototype.initialize.apply(this, arguments);
        this.get('translation_delta').setNull(false);

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
        var diff = this.indexNumbers.length-this.members.length;
        console.log('diff',diff);
        for (var i = 0; i < diff; i++) {
          var numText = this.indexNumbers.pop();
          numText.remove();
        }
      },

      reset: function() {
        ListNode.prototype.reset.call(this, arguments);
        var start = this.accessProperty('start_index');
        this.setIndex(start);
        var ui = this.get('ui');
        ui.position.x = 0;
        ui.position.y = 0;

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
        var v = this.get('value');
        v.setValue(value);
      },

      setMultiplier: function(value) {
        this.get('multiplier').setValue(value);
      },

      setIndex: function(value) {
        this.get('index').setValue(value);

      },

      getIndex: function() {
        return this.accessProperty('index');
      },


      setStart: function(value) {
        this.get('start_index').setValue(value);
      },

      setEnd: function(value) {
        this.get('end_index').setValue(value);
      },

      //places a constraint on the end and start values
      constrainRange: function(list) {
        if (list.get('type') === 'list' || list.get('type') === 'sampler') {
          var endIndex = this.inheritProperty('end_index');
          var constraintF = function() {
            var num = list.getMemberNumber();
            endIndex.setValue(num);
            return num;
          };
          endIndex.setConstraint(constraintF);
        }
      },

      constrainMultiplier: function(property) {
        var multiplier_map = {
          x: 0,
          y: 0,
          operator: 'set'
        };
        switch (property) {
          case 'translation_delta':
            multiplier_map.x = 1;
            multiplier_map.y = 100;
            break;
          case 'scaling_delta':
            multiplier_map.x = 0.5;
            multiplier_map.y = 2;
            break;
          case 'rotation_delta':
            multiplier_map.x = 0;
            multiplier_map.y = 360;
            break;
          case 'stroke_color':
          case 'fill_color':
            multiplier_map.x = 0;
            multiplier_map.y = 255;
            break;
          case 'stroke_weight':
            multiplier_map.x = 0.1;
            multiplier_map.y = 10;
        }
        var data = {
          'multiplier_map': multiplier_map
        };
        this.modifyProperty(data);
      },

      setMax: function(value) {
        this.get('max').setValue(value);

      },

      setMin: function(value) {
        this.get('min').setValue(value);
      },

      setLoop: function(value) {
        this.get('loop').setValue(value);
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

      getEndIndex: function() {
        return this.accessProperty('end_index');

      },

      getStartIndex: function() {
        return this.accessProperty('start_index');
      },

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
        this.startText.content = 'range: ' + this.accessProperty('start_index') + ' - ' + this.accessProperty('end_index');

        //this.renderSelection(geom);
        if (this.get('selected') || this.get('open')) {
          ui.visible = true;
        } else {
          ui.visible = false;
        }



      },


    });

    return Sampler;
  });