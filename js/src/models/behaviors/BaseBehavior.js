/*BaseBehavior.js
base class for all behaviors */

define([
		'toolbox',
		'models/data/Condition'
	],

	function(Toolbox, Condition) {

		var BaseBehavior = Toolbox.Base.extend({
			conditions: [],
			name: 'base',
			type: 'none',


			events: {

			},

			/*adds a condition string. Strings should be formatted as code:
			 * instance.position.x < 100 & instance.position.y <100;
			 *
			 */

			addConstraint: function(constraint){

			}, 

			addCondition: function(propA,operator,targetB,propB) {
				var condition = new Condition(propA,operator,targetB,propB);
				this.conditions.push(condition);
				console.log(condition);
			},

			checkConditions: function(instance) {
				//console.log('total num of conditions=' + this.conditions.length);
				for (var i = 0; i < this.conditions.length; i++) {
					 if(!this.conditions[i].evaluate(instance)) {
						return false;
					}
				}
				return true;
			},

			checkConstraints: function(constraint, instance){

			},

			render: function(){
				console.log("behavior_render");
				//console.log("behavior data="+ data);
				//console.log("behavior node="+ currentNode);
				/* if (this.nodeParent == currentNode) {
				 	for(var i=0;i<this.scaffolds.length;i++){
				 		this.scaffolds[i].render(data[0]);
				 }
			}*/
		}

		});

		return BaseBehavior;
	});