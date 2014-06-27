/*Behavior.js
root class for all behaviors */

define([
	'toolbox'
	
  ],

	function(Toolbox) {

  var BaseBehavior = Toolbox.Base.extend({
  	conditions: [],

/*adds a condition string. Strings should be formatted as code:
* instance.position.x < 100 & instance.position.y <100;
*
*/
	initialize: function(condition){
		if(condition){
			this.conditions.push(condition);
		}
	},

   	setCondition: function(condition_string){
   		this.conditions.push(condition_string);
   	},

   	checkConditions: function(instance){
   		console.log("total num of conditions="+this.conditions.length);
   		for(var i=0;i<this.conditions.length;i++){
   			if(!this.checkCondition(this.conditions[i],instance)){
   				return false;
   			}
   		}
   		return true;
   	},

   	checkCondition: function(condition, instance){
   		console.log("condition="+condition);
   		console.log("evaluating=");
   		console.log(eval(condition));
   		var result = eval(condition);
   		return result;
   	}

  });

  return BaseBehavior;
});