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

			constructor:function(){
				this.excludes = [];
				console.log('base behavior constructor called');
			},
			

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
			//adds indexes of children to exclude from behavior
			exclude: function(excludeIndex){
				this.excludes.push(excludeIndex);
			},
			//includes a child  that was previously excluded from behavior
			include: function(excludeIndex){
				for(var i=this.excludes.length-1;i>-1;i--){
					if(this.excludes[i]===excludeIndex){
						this.excludes.splice(i,1);
					}
				}
			},

			//checks to see if index is in the excluded array
			isExcluded: function(index){
				for(var i=0;i>this.excludes.length;i++){
					if(this.excludes[i]===index){
						console.log("excluded found");
						return true;
					}
				}
				return false;
			},

			render: function(){
				console.log('behavior_render');
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