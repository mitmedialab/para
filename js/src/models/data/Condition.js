/*Condition.js
 * used to store condition logic
 *
 */

define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var Condition = Backbone.Model.extend({

		 constructor: function() {
		 	//used to evaluate relationship between propA and propB
			this.operator = null;
			//first part of conditional
			this.propA = null;
			//second part of conditional
			this.propB = null;
			this.target = null;
		
			Backbone.Model.apply(this, arguments);
		 },

		 initialize: function(propA,operator,targetB,propB){
		 	this.operator = operator;
			//first part of conditional
			this.propA = propA;
			//second part of conditional
			this.propB = propB;
			this.target = targetB;
		
		 },
		

		evaluate: function(instance){
			var instanceVal = eval('instance.'+this.propA);
			/*if(!this.propB){
				return instanceVal;

			}*/

		
				var targetVal;
				if(this.propB){
					targetVal = eval('target.'+this.propB);
				}
				else{
					targetVal = this.target;
				}
				var result = false;
				switch (this.operator){

					case '=':
						result = instanceVal===targetVal;
					break;
					case '<':
						result =instanceVal<targetVal;
					break;
					case '<=':
						result =instanceVal<=targetVal;
					break;
					case '>':
						result =instanceVal>targetVal;
					break;
					case '>=':
						result =instanceVal>=targetVal;
					break;
					case '!=':
						result =instanceVal!=targetVal;
					break;
					case 'leftOf':
						result = targetVal.instanceSide(instance)===1;
					break;
					case 'rightOf':
						result = targetVal.instanceSide(instance)===-1;
					break;

				}

				return result;
			

		}
	});

	return Condition;



});