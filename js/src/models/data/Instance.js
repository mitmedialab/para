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
			if(data.position){
				this.position.x+=data.position.x;
				this.position.y+=data.position.y;
				console.log("instance position");
				console.log(this.position);
			}
			if(data.scale){
				this.scale*=data.scale;
			
			}
			if(data.rotation){
				this.rotation+=data.rotation;
			}


		}
	});

	return Instance;



});