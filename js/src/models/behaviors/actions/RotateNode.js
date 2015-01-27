/* RotateNode.js
* procedure that controls relative rotation coordinates
*/
define([
          'models/behaviors/actions/TransformationNode',
          'utils/PPoint'

     ],

     function(TransformationNode, PPoint) {

          var RotateNode = TransformationNode.extend({
                name: 'rotate',
                type: 'transformation',

                constructor: function(){
                    this.origin = new PPoint(0,0);
                    this.relativeOrigin = true;
                    this.linkedOrigin = false;
                    TransformationNode.apply(this,arguments);
                },

               /* setOrigin
               * sets origin to new values
               */
               setOrigin: function(x,y){
                    if(this.linkedOrigin){
                         this.origin= new PPoint(x,y);
                         this.linkedOrigin = false;
                    }
                    else{
                         this.origin.setValue({x,y});
                         this.relativeOrigin = false;
                    }
               },

               /* incrementOrigin
               * increments origin value, only if not contaning a linked origin
               */
               incrementOrigin: function(x,y){
                    if(!this.linkedOrigin){
                         this.origin.add({x,y});
                         this.relativeOrigin = false;
                    }
                    else{
                        console.error("attempted to increment relative origin for translation node");
                    }

               }, 

               /*linkOrigin
               * links origin to the origin of one of the instances
               */
               linkOrigin: function(instance){
                    this.origin = instance.position;
                    this.relativeOrigin=false;

               },

               /*relativeOrigin
               *sets relative origin to true and resets origin value to 0,0
               */
               relativeOrigin: function(){
                    this.relativeOrigin= true;
                    this.linkedOrigin = false;
                    this.origin = new PPoint(0,0);
               },

                /* evaluate
                * updates the rotation of the each instance in the instance list
                * with specified origin
                */
               evaluate: function(){
                    for(var i=0;i<this.instances.length;i++){
                         var instance = this.instances[i].instance;

                         //set origin based on origin state
                         var origin;
                         if(this.relativeOrigin){
                              origin = instance.position;
                         }
                         else{
                              origin = this.origin;
                         }

                         var expression = this.instances[i].expression;
                         if(expression){
                              //special case for expression entered by user
                         }
                         else{
                             instance.update({rotation:{angle:this.delta,x:origin.x,y:origin.y}});
                         }

                    }
                    TransformationNode.prototype.evaluate.apply(this,arguments);

               }
          });

          return RotateNode;
     });


