/*DistributeBehavior.js
 */
define([
    'models/behaviors/BaseBehavior',
    'models/PaperManager',
    'utils/TrigFunc',
  ],

  function(BaseBehavior, PaperManager, TrigFunc) {
    var paper = PaperManager.getPaperInstance();
    var GaussianBehavior = BaseBehavior.extend({
      name: 'linear',
      type: 'distribution',

      initialize: function() {
        this.pointA = null;
        this.pointB = null;
        this.xDiff = 0;
        this.yDiff = 0;
        this.points = [];
      },



      update: function(data) {

  
        var num = this.instances.length;
        for(var i=0;i<num-2;i++){
          this.points.push(this.getGaussianPoints());
        }

        this.pointA = this.instances[0].delta;
        this.pointB = this.instances[num - 1].delta;
        if (TrigFunc.equals(this.pointA, this.pointB)) {
          this.instances[num - 1].delta.x += 40;
          this.instances[num - 1].delta.y += 40;
          this.pointB = this.instances[num - 1].delta;
        }
      this.x = this.pointA.x;
      this.y = this.pointA.y;
      this.width = this.pointB.x-this.pointA.x;
      this.height = this.pointB.x-this.pointA.x;

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
        var px = this.x + ((this.width*0.5) * this.points[index][3]);
        var py = this.y + ((this.height*0.5) * this.points[index][2]);
        if (index === 0 || index === this.instances.length - 1) {
          this.instances[index].anchor = true;
        } else {
          this.instances[index].anchor = false;
       
        this.instances[index].update({
          delta: {
            x: px,
            y: py
          }
        });
      }

      },

      clean: function(data) {

      },

      getGaussianPoints: function() {
        var x1, x2, w, y1, y2;

        do {
          x1 = 2.0 * Math.random() - 1.0;
          x2 = 2.0 * Math.random() - 1.0;
          w = x1 * x1 + x2 * x2;
        } while (w >= 1.0);

        w = Math.sqrt((-2.0 * Math.log(w)) / w);
        y1 = x1 * w;
        y2 = x2 * w;

        return [x1, x2, y1, y2];
      }



    });

    return GaussianBehavior;
  });