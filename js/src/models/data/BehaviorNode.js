/*BehaviorNode.js
* node that manages procedural behaviors and 
renders children according to these behaviors



* default properties: *
anchors : array that keeps track of which objects are refences for the behavior
behaviors: behavior actions that are dynamically added by the user and are distributed to the child nodes
scaffold objects: literal path art that enables user to graphically manipulate the behavior (should be a 1-1 relationship between behaviors and scaffold objects)

*/

define([
		'underscore',
		'jquery',
		'models/data/GeometryNode',
		'models/behaviors/DistributeBehavior'

	],

	function(_, $, GeometryNode, DistributeBehavior) {

		var BehaviorNode = GeometryNode.extend({
			scaffold: [],
			type: 'behavior',

			//registers overriding function for update methods- determined by parent node
			extendBehavior: function(from, methodName) {
				this.behaviors.push(from);
				// if the method is defined on from ...
				// we add those methods which exists on `from` but not on `to` to the latter
				_.defaults(this, from);
				// … and we do the same for events
				_.defaults(this.events, from.events);
				// console.log(this);
				// console.log(from);

				if (!_.isUndefined(from[methodName])) {
					// console.log('setting methods');
					var old = this[methodName];

					// ... we create a new function on to
					this[methodName] = function() {

						// and then call the method on `from`
						from[methodName].apply(this, arguments);

						// wherein we first call the method which exists on `to`
						var oldReturn = old.apply(this, arguments);

						// and then return the expected result,
						// i.e. what the method on `to` returns
						return oldReturn;

					};
				}

			},

			clearScaffolds: function(){
      			for (var j = 0; j < this.scaffold.length; j++) {
       				 this.scaffold[j].remove();

      		}
      			this.scaffold = [];

			},

			
			

		

		


		});


		return BehaviorNode;

	});