/*SamplerNode.js
Node that triggers (runs) subsequent chain of behaviors 
until end statement is passed back up execution chain
*/

define([
    'models/behaviors/actions/BaseNode',
  ],

  function(BaseNode) {

    var SamplerNode = BaseNode.extend({
      name: 'sampler',
     type: 'procedure',

      constructor: function() {

      },


      /* tick
      * runs until one of the procedures in the chain returns end
      */
      tick: function(data) {
        var endCheck;
        if (this.next) {
          while (endCheck != this.end) {
            //console.log("=====sampler_tick=======");
            endCheck = this.next.trigger();
          }
        }
      },

    });

    return SamplerNode;
  });