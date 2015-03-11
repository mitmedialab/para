/*PathSampler.js
 * sampler that pulls values from single path
 * inherits from Sampler
 */

define([
    'underscore',
    'models/data/Sampler',
    'utils/PFloat',
    'utils/PBool',
    'utils/TrigFunc',
    'paper'
  ],

  function(_, Sampler, PFloat, PBool, TrigFunc, paper) {
    var PathSampler = Sampler.extend({
      defaults: _.extend({}, Sampler.prototype.defaults, {
        name: 'path_sampler'

      }),

      //only allowed to have one member at a time
      addMember: function(data) {
        if (this.members.length > 0) {
          this.removeAllMembers();
        }
        Sampler.prototype.addMember.call(this, data);
      },


      getMultiplier: function() {
        if (this.members.length > 0) {
          var path = this.members[0].get('geom');
          var width = path.bounds.width;
          var m = TrigFunc.map(width, 1, 1000, 1, 100);
          this.setMultiplier(width);
        }
        return this.accessProperty('multiplier');
      },

      getValue: function() {
        if (this.members.length > 0) {
          var path = this.members[0].get('geom');
          if (path.segments[0].point.y === path.segments[path.segments.length - 1].point.y) {
            this.setValue(0);
          } else {
            var length = path.length;
            var height = path.bounds.height;
            var width = path.bounds.width;
            var end_index = this.getEndIndex();
            var start_index = this.getStartIndex();
            var interval = (length / (end_index - start_index)) - 0.1;
            var index = this.getIndex();
            var l = interval * index;
            var targetPoint = path.getPointAt(interval * index);
            if (targetPoint) {
              targetPoint.x = targetPoint.x - path.bounds.bottomLeft.x;
              targetPoint.y = -(targetPoint.y - path.bounds.bottomLeft.y);
              var value = TrigFunc.map(targetPoint.y, 0, height, 0, 1);
              this.setValue(value);
              this.setMultiplier(width);
            } else {
              this.setValue(0);
            }
          }
          this.increment();
          return this.accessProperty('value');
        }
      },
    });

    return PathSampler;

  });