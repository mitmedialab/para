/*ListSampler.js
 * sampler that pulls values from a list, used when converting standard list 
 * into one that is being constrained iteratively.
 * inherits from Sampler
 */

define([
    'underscore',
    'models/data/Sampler',
    'utils/PFloat',
    'utils/PBool',
    'paper'
  ],

  function(_, Sampler, PFloat, PBool, paper) {
    var ListSampler = Sampler.extend({
      defaults: _.extend({}, SamplerNode.prototype.defaults, {
      name: 'list_sampler'
    

      }),

   //overrides ListNode addMember and removeMember functions
      addMember: function(data) {
        ListNode.prototype.addMember.call(this, data);
        this.setRange(0, this.members.length - 1);
      },

      removeMember: function(data) {
        ListNode.prototype.removeMember.call(this, data);
        this.setRange(0, this.members.length - 1);
      },



    });
    return ListSampler;

  });