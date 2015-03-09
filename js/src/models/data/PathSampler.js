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


      getValue: function() {
        if (this.members.length > 0) {
          var path = this.members[0].get('geom');
          if (path.segments[0].point.y === path.segments[path.segments.length - 1].point.y) {
            this.setValue(0);
            console.log('y positions are equal');
          } else {
            var length = path.length;
            var height = path.bounds.height;
            var width = path.bounds.width;
            console.log('end index', this.get('end_index'), this.get('end_index').getValue());
            var interval = (length / (this.get('end_index').getValue() - this.get('start_index').getValue())) - 0.1;
            var index = this.getIndex();
            var l = interval * index;
            console.log('index=', index, 'interval=', interval, 'unmappedPos=', l);
            var targetPoint = path.getPointAt(interval * index);
            if (targetPoint) {
              console.log('target point=', targetPoint.x, targetPoint.y);
              targetPoint.x = targetPoint.x - path.bounds.bottomLeft.x;
              targetPoint.y = targetPoint.y - path.bounds.bottomLeft.y;
              console.log("targetPoint", targetPoint.x, targetPoint.y);
              var value = 0 - TrigFunc.map(targetPoint.y, 0, height, 0, 100);
              console.log('value=', value);
              this.setValue(value);
            } else {
              console.log('target point not found');
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