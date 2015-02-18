/*Generator.js
 * base class for generator datatype
 */

define([
    'underscore',
    'models/data/Instance',
    'utils/PFloat',
    'utils/PBool'
  ],

  function(_, Instance, PFloat, PBool) {
    var Generator = Instance.extend({
      defaults: _.extend({}, Instance.prototype.defaults, {
        name: 'generator',
        type: 'generator',
        value: null,
        start_val: null,
        end_val: null,
        loop: null,
      }),

      initialize: function() {
       
        this.set('start_val', new PFloat(0,'set'));
        this.set('end_val', new PFloat(0,'set'));
        this.set('value', new PFloat(0,'set'));
        this.set('loop', new PBool(false));
        Instance.prototype.initialize.apply(this, arguments);
      },

      reset: function() {
        Instance.prototype.reset.call(this, arguments);
        var start = this.accessProperty('start_val');
        this.setValue(start);
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
        this.modifyProperty({value:  {val:value,operator:'set'}});
      },

      getValue: function(){
        return this.accessProperty('value');
      },


      setStart: function(value) {
        this.modifyProperty({start_val:  {val:value,operator:'set'}});
      },

      setEnd: function(value) {
        this.modifyProperty({end_val: {val:value,operator:'set'}});
      },

      setLoop: function(value) {
        this.modifyProperty({loop: {val:value,operator:'set'}});
      },

      increment: function() {
        var start = this.accessProperty('start_val');
        var end = this.accessProperty('end_val');
        var value = this.accessProperty('value');
        var loop = this.accessProperty('loop');
        if (value < end) {
          var newVal = value+1;
          this.setValue(newVal);
        } else {
          if (loop) {
            this.setValue(start);
          }
        }
       // console.log('incrementing generator to:',this.accessProperty('value'));
      },

      render: function(){
        console.log('generator is being rendered? This is not supposed to happen');
      },


    });

    return Generator;
  });