/*TransformationNode.js
 * base class for all transformation procedure nodes
 */

define([
		'underscore',
		'models/behaviors/actions/BaseNode',
		'utils/PPoint'
	],

	function(_,BaseNode, PPoint) {

		var TransformationNode = BaseNode.extend({
			name: 'transformation',
			type: 'transformation',

			constructor: function() {
				/*delta controls relative change for each instance 
				 * that is subject to this transformation
				 */
				this.delta = new PPoint(0, 0);
				this.instances = [];
				BaseNode.apply(this, arguments);

			},

			/* linkInstance
			* Adds an instance to the transformation
			*/
			linkInstance: function(instance,expression){
				this.instances.push({instance:instance,expression:expression});
			},

			/* unlinkInstance
			* removes instance from instances array, preventing it
			* from being effected by the transformation
			*/
			unlinkInstance: function(instance){
				var revisedInstances = _.filter(this.instances, function(instance) {
       				return this.instances.instance !== instance;
     			 });

				this.instances= revisedInstances;
			},

			/* setDelta
			* sets delta to new values
			*/
			setDelta: function(point){
				this.delta.set(x,y);
			},

			/* incrementDelta
			* increments delta value
			*/
			incrementDelta: function(point){
				this.delta.add(x,y);
			},

			evaluate: function() {
				BaseNode.prototype.evaluate.apply(this, arguments);

			}
		});

		return TransformationNode;
	});