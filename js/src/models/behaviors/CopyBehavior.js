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

       // console.log('copy update');

        if (this.children.length > 0) {
          for (var z = 0; z < this.children.length; z++) {
            if (this.children[z] !== null) {
              var child = this.children[z];

              var numInstances = child.instances.length;
              if (numInstances < this.copyNum) {
                var newCopy = this.copyNum-numInstances;
                console.log('creating copy of type, number:'+child.type+','+newCopy);

                for (var i = 0; i < newCopy; i++) {
                  var instance = child.createInstance(child.instances[0]);
                  /*var x = (i+1) * 20;
                  var y = x;
                  instance.update({
                    position: {
                      x: x,
                      y: y
                    }
                  });*/
                  
                }
              } else if (numInstances > this.copyNum) {
                for (var k = 0; k < numInstances - this.copyNum; k++) {
                  child.instances.pop();
                }
              }
            }
          }
        }

        /*var numInstances = this.instances.length;
          for (var j = 0; j < data.length; j++) {
          if (numInstances < this.copyNum) {
            for (var i = 0; i < this.copyNum - numInstances; i++) {

              this.instances.push(new Instance());
               var x = i * 20;
              var y = x;
              this.instances[i].update({position:{x:x,y:y}});
            }
          } else if (numInstances > this.copyNum) {
              for (var k = 0; k < numInstances - this.copyNum; k++) {
                this.instances.pop();
              }
            }
          }
           console.log('number of copies = ' + this.instances.length);*/

      },

      setCopyNum: function(data) {
        this.copyNum = data;



      }


    });

    return CopyBehavior;
  });