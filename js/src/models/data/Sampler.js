/*Sampler.js
 * base class for sampler datatype
 */

define([
    'underscore',
    'models/data/Instance',
    'utils/PFloat',
    'utils/PBool',
    'paper'
  ],

  function(_, Instance, PFloat, PBool, paper) {
    var Sampler = Instance.extend({
      defaults: _.extend({}, Instance.prototype.defaults, {
        name: 'sampler',
        type: 'sampler',
        value: null,
        start_val: null,
        end_val: null,
        loop: null,
      }),

      initialize: function() {

        this.set('start_val', new PFloat(0, 'set'));
        this.set('end_val', new PFloat(0, 'set'));
        this.set('value', new PFloat(0, 'set'));
        this.set('loop', new PBool(false));
        Instance.prototype.initialize.apply(this, arguments);

        var rectangle = new paper.Rectangle(new paper.Point(0, 0), new paper.Size(100, 60));
        var cornerSize = new paper.Size(10, 10);
        var path = new paper.Path.Rectangle(rectangle, cornerSize);
        path.strokeColor ='#B2B2B2';
        path.fillColor = 'white';
        path.fillColor.alpha = 0.95;
        this.get('translation_delta').setNull(false);

        this.startText = new paper.PointText({
          point:  new paper.Point(15,20),
          content: 'start:',
          justification: 'left',
          fontSize: 15,
          fontFamily: 'Source Sans Pro',
          fillColor: '#34332F'
        });
         this.endText = new paper.PointText({
          point:  new paper.Point(15,45),
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

      reset: function() {
        Instance.prototype.reset.call(this, arguments);
        var start = this.accessProperty('start_val');
        this.setValue(start);
        var geom =this.get('geom');
        geom.position.x=0;
        geom.position.y=0;

      },

      setRange: function(start, end, loop) {
        //console.log('end',end);
        this.setStart(start);
        this.setEnd(end);
        if (loop) {
          this.setLoop(loop);
        }

      },

      setValue: function(value) {
        this.modifyProperty({
          value: {
            val: value,
            operator: 'set'
          }
        });
      },

      getValue: function() {
        return this.accessProperty('value');
      },


      setStart: function(value) {
        this.modifyProperty({
          start_val: {
            val: value,
            operator: 'set'
          }
        });
        this.startText.content = 'start: '+this.accessProperty('start_val');
      },

      setEnd: function(value) {
        this.modifyProperty({
          end_val: {
            val: value,
            operator: 'set'
          }
        });
        this.endText.content = 'end: '+this.accessProperty('end_val');
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
        var start = this.accessProperty('start_val');
        var end = this.accessProperty('end_val');
        var value = this.accessProperty('value');
        var loop = this.accessProperty('loop');
        if (value < end) {
          var newVal = value + 1;
          this.setValue(newVal);
        } else {
          if (loop) {
            this.setValue(start);
          }
        }
        // console.log('incrementing sampler to:',this.accessProperty('value'));
      },

      render: function() {
        var geom = this.get('geom');
        geom.transform(this.get('tmatrix'));
        this.renderSelection(geom);
        geom.selected = false;
      },


    });

    return Sampler;
  });