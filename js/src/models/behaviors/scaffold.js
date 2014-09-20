/*Scaffold.js
 * used to store the scaffold geometry
 *
 */

define([
	'underscore',
	'backbone',
	'models/data/Instance'
], function(_, Backbone, Instance) {

	var Scaffold = Backbone.Model.extend({

		 constructor: function(path) {
		 	
			this.instance_literal = null;
			this.instance = null;
		 	this.instance = new Instance();
     		this.instance.position.x = path.position.x;
      		this.instance.position.y = path.position.y;
      		this.instance.closed = path.closed;  
      		path.nodeParent = this;
      		path.visible = false;
      		this.instance_literal = path;
			Backbone.Model.apply(this, arguments);
		 },

		
		reset: function() {
		

			
		},


		//only called on a update function- 
		//sets instances' properties to that of the data
		update: function(data){
			



		},

		clear: function(data){
			
			this.instance_literal.remove();
			
			this.instance_literal = null;
			this.instance= null;
		},

		/*only called on a render function-
		propagates the instances' properties with that of the data*/
		render: function(data) {
			
			this.instance_literal.position.x = this.instance.position.x + data.position.x;
           this.instance_literal.position.y = this.instance.position.y + data.position.y;
            this.instance_literal.scale(this.instance.scale* data.scale);
            this.instance_literal.visible= true;

		},

		clone: function(){
		}
			
	});

	return Scaffold;



});