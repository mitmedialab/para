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
        start: null,
        end: null,
        loop: null,
      }),

      intialize: function() {
        Instance.prototype.initialize.apply(this, arguments);
        this.set('start', new PFloat(0));
        this.set('end', new PFloat(0));
        this.set('value', new PFloat(0));
        this.set('loop', new PBool(false));
      },

      reset: function() {
        Instance.prototype.reset.call(this, arguments);
        this.setValue(this.accessProperty('start'));
      },

      setRange: function(start, end, loop) {
        this.setStart(start);
        this.setEnd(end);
        if (loop) {
          this.setLoop(loop);
        }
      },

      setValue: function(value) {
        this.modifyProperty({
          value: value
        }, 'standard', 'none');
      },

      setStart: function(value) {
        this.modifyProperty({
          start: value
        }, 'standard', 'none');
      },

      setEnd: function(value) {
        this.modifyProperty({
          end: value
        }, 'standard', 'none');
      },

      setLoop: function(value) {
        this.modifyProperty({
          loop: value
        }, 'standard', 'none');
      },

      increment: function() {
        var start = this.accessProperty('start');
        var end = this.accessProperty('end');
        var value = this.accessProperty('value');
        var loop = this.accessProperty('loop');
        if (value < end) {
          this.setValue(value++);
        } else {
          if (loop) {
            this.setValue(start);
          }
        }
      }

      
    });

    return Generator;
  });