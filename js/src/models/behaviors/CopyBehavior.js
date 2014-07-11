/*CopyBehavior.js
iteratively changes scale from start to end
 */
define([
    'models/behaviors/BaseBehavior',
    'models/data/Instance'


  ],

  function(BaseBehavior, Instance) {

    var CopyBehavior = BaseBehavior.extend({
        copyNum: 2,

        update: function(data) {
          // console.log('copy behavior update called'  );
          //checks to see if we have the correct number of copies

          console.log('copy update');
           var numInstances = this.instances.length;
          for (var j = 0; j < data.length; j++) {
          if (numInstances < this.copyNum) {
            for (var i = 0; i < this.copyNum - numInstances; i++) {

              this.instances.push(new Instance());
               var x = i * 20 + data[j].position.x;
              var y = x + data[j].position.y;
              this.instances[i].position = {
                x: x,
                y: y
              };
            }
          } else if (numInstances > this.copyNum) {
              for (var k = 0; k < numInstances - this.copyNum; k++) {
                this.instances.pop();
              }
            }
          }
         
        },

        setCopyNum: function(data) {
          this.copyNum = data;
         

            console.log('number of copies = ' + this.instances.length);


          }


        });

      return CopyBehavior;
    });