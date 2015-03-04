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
          var length = path.length;
          var height = path.bounds.height;
          var width = path.bounds.width;
          var interval = length / (this.accessProperty('end_index') - this.accessProperty('start_index'));
          var index = this.getIndex();
          var targetPoint = path.getPointAt(interval*index);
          targetPoint.x = targetPoint.x-width;
          targetPoint.y = targetPoint.y-height;
          var value = TrigFunc.map(targetPoint.y,0,height,0,1);
          console.log('value=',value);
          this.setValue(value);
          return this.accessProperty(value);
        }
      },
    });

    return PathSampler;

  });