/*GroupNode.js
 * path object
 * extends GeometryNode
 * node with actual path in it
 */


define([
	'underscore',
	'models/data/geometry/GeometryNode'


], function(_,GeometryNode) {
	var GrouphNode = GeometryNode.extend({

		defaults: _.extend({}, GeometryNode.prototype.defaults, {

			name: 'group',
			type: 'geometry',
			points: null,
		}),

		initialize: function() {

		},

	});
	return GroupNode;
});