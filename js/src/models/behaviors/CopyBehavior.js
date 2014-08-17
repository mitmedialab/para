/*CopyBehavior.js
creates correct number of copies
 */
define([
    'models/behaviors/BaseBehavior',
    'models/data/Instance',
    'utils/TrigFunc'



  ],

  function(BaseBehavior, Instance, TrigFunc) {

    var CopyBehavior = BaseBehavior.extend({
      name: 'copy',
      type: 'copy',

      exportJSON: function(data) {

        var jdata;
        if (!data) {

          jdata = {};
          jdata.type = this.type;
          jdata.name = this.name;
        } else {
          jdata = data;
        }
        //console.log(jdata);
        return BaseBehavior.prototype.exportJSON.apply(this, [jdata]);
      },

      update: function(data) {
        //checks to see if we have the correct number of copies
        var numInstances = this.instances.length;
        if (numInstances < this.copyNum) {
          var newCopy = this.copyNum - numInstances;

          for (var i = 0; i < newCopy; i++) {
            var selected = this.instances[this.instances.length - 1];
            var index;
            if (!selected) {
              selected = this.instances[0];
              index = 1;
            } else {
              //console.log('selected:' + selected.index);
              index = selected.index + 1;
              //console.log('index:' + index);

            }

            // //console.log('no selected instance found, making copy from first');
            //target = child.instances[0];
            //console.log('creating instance at' + index);
            var instance = this.createInstanceAt(selected, index);
            // //console.log('creating instance'+instance);
            instance.copy = true;
            instance.rotation.angle =0;
            instance.increment({
              delta: {
                x: 10,
                y: 10
              }
            });
            instance.anchor = false;
            instance.selected = false;
          }
        } else if (numInstances > this.copyNum) {
          for (var k = 0; k < numInstances - this.copyNum; k++) {
            var removeIndex = this.instances.length > 2 ? this.instances.length - 3 : this.instances.length - 2;
            ////console.log('remove index = '+removeIndex);
            if (removeIndex >= 0) {

              this.removeInstanceAt(removeIndex);
            }
            //TODO: what happens when there are only 2 instances left?
          }
        }

        //child.instances[child.instances.length-1].anchor=true;


      },

      setCopyNum: function(data) {
        this.copyNum = data;
      },
      incrementCopyNum: function(data) {
        this.copyNum += data;
        if (this.copyNum < 2) {
          if (this.containsBehaviorType('distribution')) {
            this.copyNum = 2;
          }
          if (this.copyNum < 1) {
            this.copyNum = 1;
          }
        }
      }
    });


    return CopyBehavior;
  });