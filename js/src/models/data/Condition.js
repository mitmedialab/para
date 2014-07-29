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
					case 'color':
						console.log(instance);
						console.log(targetVal.type);
						var color = targetVal.instances[0].strokeColor;
						if(color === '#000000'){
							result = true;
						}
						else{
						var r= this.hexToR(color);
						var g = this.hexToG(color);
						if(r>g){
							result = targetVal.instanceSide(instance)===1;	
						}
						else{
							result = targetVal.instanceSide(instance)===-1;

						}
					}

				}

				return result;
			

		},

		hexToR: function (h) {return parseInt((this.cutHex(h)).substring(0,2),16);},
		hexToG: function (h) {return parseInt((this.cutHex(h)).substring(2,4),16);},
		hexToB: function (h) {return parseInt((this.cutHex(h)).substring(4,6),16);},

		cutHex:function (h) {return (h.charAt(0)=='#') ? h.substring(1,7):h;}
	});

	return Condition;



});