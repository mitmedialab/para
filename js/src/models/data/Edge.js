/*Edge.js
 * edge object
 * stores information about x and y of edge
 */


define([
		'underscore',
		'backbone'
	],

	function(_, Backbone) {



		var Edge = Backbone.Model.extend({
			type: 'edge',
			name: 'edge',
			defaults: {
				//x and y values of edge

				x: null,
				y: null,


				scaling: false,
				rotation: false,
				translation: false,
				fillColor: false,
				strokeColor: false,
				strokeWidth: false,

			},


			/* contains
			 * checks to see if transformation exists in edge
			 */
			contains: function(transformation) {
				return this.get(transformation);
			},

			/*add
			 * adds transformation to edge
			 */
			add: function(transformation) {
				this.set(transformation, true);
			},

			/*remove
			 * removes transformation from edge
			 */
			remove: function(transformation) {
				this.set(transformation, false);
			},

			/*addAll
			 * adds all transformations to edge
			 */
			addAll: function() {
				this.set({
					scaling: true,
					rotation: true,
					translation: true,
					fillColor: true,
					strokeColor: true,
					strokeWidth: true
				});
				console.log("set all",this.attributes);
			}


		});
		return Edge;

	});