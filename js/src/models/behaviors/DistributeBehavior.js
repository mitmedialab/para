/*DistributeBehavior.js
 */
define([
    'models/behaviors/BaseBehavior',
    'models/PaperManager',
    'utils/TrigFunc',
       'paper'

  ],

  function(BaseBehavior, PaperManager, TrigFunc, paper) {
  
    var DistributeBehavior = BaseBehavior.extend({
      name: 'linear',
      type: 'distribution',

      initialize: function() {
        this.pointA=null;
        this.pointB =null;
        this.xDiff= 0;
        this.yDiff = 0;
      },



      update: function(data) {

        var num = this.instances.length;
        this.pointA = this.instances[0].delta;
        this.pointB = this.instances[num - 1].delta;
        if (TrigFunc.equals(this.pointA, this.pointB)) {
          this.instances[num - 1].delta.x += 40;
          this.instances[num - 1].delta.y += 40;
          this.pointB = this.instances[num - 1].delta;
        }
        var selected = this.getFirstSelectedInstance();
       this.xDiff = (this.pointB.x - this.pointA.x) / (num - 1);
      this.yDiff = (this.pointB.y - this.pointA.y) / (num - 1);
        var dist = TrigFunc.distance(this.pointA, {
          x: this.pointA.x + this.xDiff,
          y: this.pointA.y + this.yDiff
        });
        /*if (selected) {
          if (selected.index === 1) {
            this.checkDistanceIncrement(this.instances[0], selected, dist, this);
          } else if (selected.index == num - 2) {
            this.checkDistanceDecrement(this.instances[0], selected, dist, this);

          }
        }*/
      },

      calculate: function(data, index) {
        var x = this.pointA.x + this.xDiff * index;
        var y = this.pointA.y + this.yDiff * index;
        if (index===0|| index===this.instances.length-1){
          this.instances[index].anchor=true;
        }
        else{
          this.instances[index].anchor=false;
        }
        this.instances[index].update({
          delta: {
            x: x,
            y: y
          }
        });

      },

      clean: function(data) {

      }



    });

    return DistributeBehavior;
  });