/*Instance.js
 * used to store references of a shape object
 *
 */

define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var Instance = Backbone.Model.extend({
		visible: true,
		scale: 1,
		rotation: 0,
		anchor: false,
		selected: false,
		 constructor: function() {
			this.position={x: 0,y: 0};
			Backbone.Model.apply(this, arguments);
		 },
		reset: function() {
			this.visible= true;
			this.scale= 1;
			this.position= {
				x: 0,
				y: 0
			};
			this.rotation= 0;
			this.anchor= false;
			this.selected= false;
		},
		update: function(data) {
			//this.position.x = (data.positon ? data.position.x : this.position.x);
			//this.position.y = (data.positon ? data.position.y : this.position.y);


		}
	});

	return Instance;



});