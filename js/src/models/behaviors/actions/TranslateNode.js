/* TranslateNode.js
* procedure that controls relative translation of x,y coordinates
*/
define([
		'models/behaviors/actions/TransformationNode',

	],

	function(TransformationNode) {

		var TranslateNode = TransformationNode.extend({
			 name: 'translate',
     		 type: 'transformation',

     		 /* evaluate
     		 * updates the delta of the each instance in the instance list
     		 */
     		evaluate: function(data){
     			for(var i=0;i<this.instances.length;i++){
     				var instance = this.instances[i].instance;
     				var expression = this.instances[i].expression;
     				if(expression){

       				}
     				else{
     				    instance.update({delta:this.delta});
     				}

     			}
     		TransformationNode.prototype.evaluate.apply(this,arguments);
     	}
     	});

     	return TranslateNode;
     });


