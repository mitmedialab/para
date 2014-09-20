/*FÏ.js
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

			type: 'behavior',

			



		});


		return BehaviorNode;

	});