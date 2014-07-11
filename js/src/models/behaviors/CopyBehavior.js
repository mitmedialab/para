/*CopyBehavior.js
iteratively changes scale from start to end
 */
define([
    'models/behaviors/BaseBehavior',


  ],

  function(BaseBehavior) {

    var CopyBehavior = BaseBehavior.extend({
      copyNum:2,

      render: function(data) {
        // console.log('copy behavior update called'  );
        console.log('copy render');
        this.instances = [];
        for(var j=0;j<data.length;j++){
         for(var i=0;i<this.copyNum; i++){
            var x = i*20+data[j].position.x;
            var y = i*20+data[j].position.y;
          this.instances.push({position:{x:x,y:y},rotation:0,scale:1});
         }
       }

      },

      setCopyNum: function(data) {
        this.copyNum = data;
        
        console.log('number of copies = ' + this.copyNum);

      }


    });

    return CopyBehavior;
  });