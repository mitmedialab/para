/*FillBehavior.js
 */
define([
    'models/behaviors/BaseBehavior',
  ],

  function(BaseBehavior) {
    var FillBehavior = BaseBehavior.extend({
      name: 'fill',
      type: 'style',
      constructor: function() {
        this.color = null;
      },

      update: function(data) {

      },

      calculate: function(index){
      },

      clean: function(data){

      },

      setFill: function(color, index){
        if(!index){
        for (var i = 0; i < this.instances.length; i++) {
          this.instances[i].update({fillColor:color});
        }
      }
      else{
        this.instances[index].update({fillColor:color});
      }
    }

    });

    return FillBehavior;
  });
