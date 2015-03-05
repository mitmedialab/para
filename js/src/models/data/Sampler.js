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
        this.set('loop', new PBool(false));
        ListNode.prototype.initialize.apply(this, arguments);

        var rectangle = new paper.Rectangle(new paper.Point(0, 0), new paper.Size(100, 60));
        var cornerSize = new paper.Size(10, 10);
        var path = new paper.Path.Rectangle(rectangle, cornerSize);
        path.strokeColor = '#B2B2B2';
        path.fillColor = 'white';
        path.fillColor.alpha = 0.95;
        this.get('translation_delta').setNull(false);

        this.startText = new paper.PointText({
          point: new paper.Point(15, 20),
          content: 'start:',
          justification: 'left',
          fontSize: 15,
          fontFamily: 'Source Sans Pro',
          fillColor: '#34332F'
        });
        this.endText = new paper.PointText({
          point: new paper.Point(15, 45),
          content: 'end:',
          justification: 'left',
          fontSize: 15,
          fontFamily: 'Source Sans Pro',
          fillColor: '#34332F',
        });
        var geom = new paper.Group();
        geom.addChild(path);
        geom.addChild(this.startText);
        geom.addChild(this.endText);
        this.startText.data.instance = geom.data.instance = path.data.instance = this.endText.data.instance = this;

        this.set('geom', geom);

      },

      //overrides ListNode addMember and removeMember functions
      addMember: function(data) {
        ListNode.prototype.addMember.call(this, data);
      },

      removeMember: function(data) {
        ListNode.prototype.removeMember.call(this, data);
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
        this.startText.content = 'start: ' + this.accessProperty('start_index');
      },

      setEnd: function(value) {
        this.modifyProperty({
          end_index: {
            val: value,
            operator: 'set'
          }
        });
        this.endText.content = 'end: ' + this.accessProperty('end_index');
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
        var bottomLeft = this.get('screen_bottom_left');
        geom.position = new paper.Point(bottomLeft.x, bottomLeft.y);
        //this.renderSelection(geom);
        //geom.selected = false;
      },


    });

    return Sampler;
  });