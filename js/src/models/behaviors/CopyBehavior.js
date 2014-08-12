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

      update: function(data) {
        // console.log('copy behavior update called'  );
        //checks to see if we have the correct number of copies


        if (this.children.length > 0) {
          for (var z = 0; z < this.children.length; z++) {
            if (this.children[z] !== null && !this.isExcluded(z)) {
              var child = this.children[z];

              var numInstances = child.instances.length;
              if (numInstances < this.copyNum) {
                var newCopy = this.copyNum-numInstances;
               // console.log('creating copy of type, number:'+child.type+','+newCopy);

                for (var i = 0; i < newCopy; i++) {
                  var instanceSelect = child.getFirstSelectedInstance();
                  var target, index;
                   if(!instanceSelect){
                    target = child.instances[0];
                    index = 1;
                   }
                   else{
                    target= instanceSelect.instance;
                    index = instanceSelect.index+1;
                  }
                
                   // console.log('no selected instance found, making copy from first');
                    //target = child.instances[0];
                  
                  var instance = child.createInstanceAt(target,index);
                 // console.log('creating instance'+instance);
                  instance.copy=true;
                  instance.anchor=false;
                  instance.selected= false;
                }
              } else if (numInstances > this.copyNum) {
                for (var k = 0; k < numInstances - this.copyNum; k++) {
                  var removeIndex = child.instances.length-3;
                  //console.log('remove index = '+removeIndex);
                  if(removeIndex>=0){

                    child.removeInstanceAt(removeIndex);
                  }
                  //TODO: what happens when there are only 2 instances left?
                }
              }
              child.instances[0].anchor=true;
              //child.instances[child.instances.length-1].anchor=true;
            }
          }
        }
      },

      setCopyNum: function(data) {
        this.copyNum = data;
      },

       

      exclude: function(excludeIndex){
        var child = this.children[excludeIndex];
        if(child!==null){
         for(var i=child.instances.length-1;i>0;i--){
              child.removeInstanceAt(i);
         }
         child.instances[0].anchor=false;
        }
        this.excludes.push(excludeIndex);
      }


    });

    return CopyBehavior;
  });