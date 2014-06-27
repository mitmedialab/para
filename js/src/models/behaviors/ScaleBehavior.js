/*Scale Behavior.js
iteratively changes scale from start to end
 */
define([
  'models/behaviors/BaseBehavior'
  ],

	function(BaseBehavior) {

  var ScaleBehavior = BaseBehavior.extend({

    update:function() {
      console.log('scale behavior called');
    },

    intersectionFound: function(data) {
      console.log('scale behavior interesection found called');
      this.iterativeScale(data.node.instances[0].data);

    },

    //linearly scales between start and end instances
    iterativeScale: function() {
     
      //this.path.strokeColor = 'red';
     var num = this.instances.length;
     var startScale = 1;
     var endScale = 0.5;
     var scaleAmt = (startScale-endScale)/(num-1);
     var currentScale = startScale;
    for (var i = 0; i < num; i++) {
        //console.log(currentScale);
        var instance = this.instances[i];
        var conditionState = this.checkConditions(instance);
         console.log("condition state="+conditionState);
         console.log("x pos ="+instance.position.x);

        if(conditionState){
          instance.scale(currentScale);
        }
        else{
          instance.data.strokeColor = 'red';
        }
        currentScale -=scaleAmt;
      }
    


    }

  });

  return ScaleBehavior;
});