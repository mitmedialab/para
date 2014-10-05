/*RadialDistributeBehavior.js
 * creates a radial distirbution defined by anchors
 */
define([
    'models/behaviors/BaseBehavior',
    'models/PaperManager',
    'utils/TrigFunc'
  ],

  function(BaseBehavior, PaperManager, TrigFunc) {
    var paper = PaperManager.getPaperInstance();
    var RadialDistributeBehavior = BaseBehavior.extend({
      name: 'radial',
      type: 'distribution',


      initialize: function() {
        this.middle=0;
        this.rad = 0;
        this.origin= null;
        this.startAngle =0;
        this.angle = 0;
        this.start = true;

      },

     /*exportJSON: function(){
      //console.log(this.renderSignature);
      this.set({
         middle: this.middle,
        rad: this.rad,
        origin: jQuery.extend(true, {}, this.origin);
        startAngle: this.startAngle =0;
        this.angle = 0;
      });
      return this.toJSON();
    },*/

   

      update: function() {
        var num = this.instances.length;
        this.middle = Math.round(num / 2);
        var pointA = this.instances[0].delta;
        var pointB = this.instances[this.middle].delta;
        this.instances[this.middle].anchor = true;
        this.instances[num - 1].anchor = false;
        if (TrigFunc.equals(pointA, pointB)) {
          this.instances[this.middle].delta.x -= 1;
          pointB = this.instances[this.middle].delta;
        }
        var dist = TrigFunc.distance(pointA, pointB);
        this.rad = dist / 2;
        if(this.start && this.rad<20){
          this.rad = 20;
          this.start=false;
        }
        this.origin = TrigFunc.midpoint(pointA, pointB);
        this.angle = 360 / num;
        this.startAngle = TrigFunc.cartToPolar(this.origin, pointA).theta;

        this.instances[0].update({
          rotation: {
            angle: this.startAngle,
          }
        });

      },

      calculate: function(data,index) {
        var position = TrigFunc.polarToCart(this.rad, (this.angle * index) + this.startAngle);
        var x = position.x + this.origin.x;
        var y = position.y + this.origin.y;
        var iAngle = this.angle * (index) + this.startAngle;
        if (index===0|| index===this.middle){
          this.instances[index].anchor=true;
        }
        else{
          this.instances[index].anchor=false;
        }
        if (index != this.middle) {
         this.instances[index].update({
            delta: {
              x: x,
              y: y
            },
            rotation: {
              angle: iAngle,
            }
          });
        } else {
          this.instances[index].update({
            rotation: {
              angle: iAngle
            }
          });
        }
      },

      clean: function() {

      }


    });

    return RadialDistributeBehavior;
  });