/*Sampler.js
 */
define([
    'models/behaviors/BaseBehavior',
    'models/behaviors/BehaviorUpdates'
  ],

  function(BaseBehavior, BehaviorUpdates) {

    var Sampler = BaseBehavior.extend({
      name: 'sampler',
      type: 'sampler',

       constructor: function() {
        this.behaviors = [];
        this.termniate = false;
        this.iterator = null;
        this.distribution=null;
        BehaviorUpdates.call(this);
      },


      setup: function(data){
        if(this.behaviors.length>0){
         var dataR= this.behaviors[0].behavior.setup(data);
        for (var j = 1; j < this.behaviors.length; j++) {
           dataR= this.behaviors[0].behavior.setup(dataR);
         
        }
        return dataR;
      }

      },

      setIterator: function(iterator){
        this.iterator = iterator;
      },

      setDistribution: function(distribution){
        this.distribution = distribution;
      },

      calculate: function(data) {
       if(this.datatype.type!= 'root'){
          console.log("sampler calculate for",this.sname);
        }
        while(!this.iterator.terminate){
          var  dataR = this.iterator.calculate();
          if(dataR!==null){
          for (var j = 0; j < this.behaviors.length; j++) {
            console.log('index=',dataR.index);
              dataR= this.behaviors[j].behavior.calculate(dataR);
            }
          }
        }
        this.terminate = true;
        console.log('terminated for',this.datatype.type);
      },

      clean: function(data) {
        for (var j = 0; j < this.behaviors.length; j++) {
          this.behaviors[j].behavior.clean(data);
        } 
        this.iterator.clean();
        this.terminate = false;
      },

      update: function(index,data){
        for(var i=0;i<this.behaviors.length;i++){
          this.behaviors[i].behavior.update(index,data);
        }
      }

    });

    return Sampler;
  });