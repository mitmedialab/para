/*Scale Behavior.js
iteratively changes scale from start to end
 */
define([
    'models/behaviors/BaseBehavior'
  ],

  function(BaseBehavior) {

    var ScaleBehavior = BaseBehavior.extend({



      //sets parameters for behavior
      setParams: function(data){
        this.max = data.max;
        this.min = data.min;
      },

       //called when node is assigned the behavior
      setup: function(data) {
        console.log('scale behavior interesection found called');

      },

      update: function() {
        console.log('scale behavior update called');
        if(this.nodeParent.nodeParent){
          this.iterativeScale(this.getParentNode().instances[0].data);
        }

      },

      //called when node is updated
      updateInstanceAt: function(i) {
        console.log('scale behavior update called');
        if(this.nodeParent.nodeParent){
          this.scale(i);
        }

      },

      //linearly scales between start and end instances
      scale: function() {
        var instance = this.getInstance(i);
        //this.path.strokeColor = 'red';
        var num = this.instances.length;
        
        var scaleAmt = (max - min) / (num - 1);
        var currentScale = startScale;
        for (var i = 0; i < num; i++) {
          //console.log(currentScale);
          var instance = this.instances[i];
          instance.resetStrokeColor();
          instance.resetScale();
          var conditionState = this.checkConditions(instance);
          console.log('condition state=' + conditionState);
          console.log('x pos =' + instance.position.x);

          if (conditionState) {
            instance.data.strokeColor = 'red';
            instance.scale(currentScale);
          } 
          currentScale -= scaleAmt;
          console.log("currentScale="+currentScale);
        }


      }


    });

    return ScaleBehavior;
  });