/*BaseBehavior.js
base class for all behaviors */

define([
		'jquery',
		'underscore',
		'backbone',
		'models/data/Condition',
		'utils/TrigFunc'

	],

	function($, _, Backbone, Condition, TrigFunc) {

		var BaseBehavior = Backbone.Model.extend({
			name: 'base',
			type: 'none',


			constructor: function() {
				this.excludes = [];
				this.conditions = [];
				this.constraints = [];

			},

			initialize: function() {},


			exportJSON: function(data) {
				var jdata;
				if (!data) {

					jdata = {};
					jdata.type = this.type;
					jdata.name = this.name;
				} else {
					jdata = data;
				}

				
				return jdata;
			},

			undoRedo: function(data){

			},


			addConstraint: function(constraint) {

			},

			addCondition: function(propA, operator, targetB, propB) {
				var condition = new Condition(propA, operator, targetB, propB);
				this.conditions.push(condition);
			},

			checkConditions: function(instance) {
				for (var i = 0; i < this.conditions.length; i++) {
					if (!this.conditions[i].evaluate(instance)) {
						return false;
					}
				}
				return true;
			},

			checkConstraints: function(constraint, instance) {

			},
			//adds indexes of children to exclude from behavior
			exclude: function(excludeIndex) {
				this.excludes.push(excludeIndex);
			},
			//includes a child  that was previously excluded from behavior
			include: function(excludeIndex) {
				for (var i = this.excludes.length - 1; i > -1; i--) {
					if (this.excludes[i] === excludeIndex) {
						this.excludes.splice(i, 1);
					}
				}
			},

			//checks to see if index is in the excluded array
			isExcluded: function(index) {
				for (var i = 0; i < this.excludes.length; i++) {
					if (this.excludes[i] === index) {
						return true;
					}
				}
				return false;
			},

			render: function() {
				
				/* if (this.nodeParent == currentNode) {
				 	for(var i=0;i<this.scaffolds.length;i++){
				 		this.scaffolds[i].render(data[0]);
				 }
			}*/
			},


			distributionReset: function() {

				for (var i = 0; i < this.instances.length; i++) {
					this.instances[i].rotation.angle = 0;
					//console.log("resetting distribuiton at" + i);

				}

			},

			checkDistanceIncrement: function(start, selected, tDist) {

				var dist = TrigFunc.distance(start.delta, selected.delta);
				//console.log('num copies=' + this.copyNum);
				if (dist < tDist + 20) {
					this.copyNum++;
					//console.log('incrementing copy');
				}
				/*else if(dist>tDist+20){
             this.copyNum--;
             //console.log('decrementing copy');
          }*/

				//console.log('selected Distance =' + dist);
				//console.log('target Distance =' + tDist);


			},

			checkDistanceDecrement: function(start, selected, tDist) {
				//console.log("check distance decrement");
				var dist = TrigFunc.distance(start.delta, selected.delta);
				//console.log('num copies=' + this.copyNum);
				if (dist > tDist + 20) {
					this.copyNum--;
					//console.log('decrementing copy');

				}
				//console.log('selected Distance =' + dist);
				//console.log('target Distance =' + tDist);


			},

		});

		return BaseBehavior;
	});