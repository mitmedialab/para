/*Instance.js
 * used to store references of a shape object
 *
 */

define([
	'underscore',
	'backbone',
], function(_, Backbone) {

	var Instance = Backbone.Model.extend({

		 constructor: function() {
			this.visible= true;
			this.scale= 1;
			this.closed = false;
			this.position= {
				x: 0,
				y: 0
			};
			this.rotation= 0;
			this.anchor= false;
			this.drawAnchor=false;
			this.selected= false;
			this.copy= false;
			this.hidden = false;
			//array that contains the path of inheritance from a render;
			this.renderSignature = [];
			Backbone.Model.apply(this, arguments);
		 },
		reset: function() {
			//console.log("reset instance");
			this.visible= true;
			this.scale= 1;
			this.position= {
				x: 0,
				y: 0
			};
			this.rotation= 0;
			this.anchor= false;
			this.selected= false;
			this.closed = false;
			this.hidden=false;
		},


		//only called on a update function- 
		//sets instances' properties to that of the data
		update: function(data){
			if(data.position){
				//console.log('prior position =');
				//console.log(this.position);

				this.position.x=data.position.x;
				this.position.y=data.position.y;
				//console.log('updated position=');
				//console.log(this.position);
			}
			if(data.scale){
				this.scale=data.scale;
			
			}
			if(data.rotation){
				this.rotation=data.rotation;
			}



		},

	

		/*only called on a render function-
		propagates the instances' properties with that of the data*/
		render: function(data) {
			//console.log("update called with data:");
			//cloconsole.log(data);
			if(data.position){
				//console.log('prior position =');
				//console.log(this.position);

				this.position.x+=data.position.x;
				this.position.y+=data.position.y;
				//console.log('updated position=');
				//console.log(this.position);
			}
			if(data.scale){
				this.scale*=data.scale;
			
			}
			if(data.rotation){
				this.rotation+=data.rotation;
			}
			if(data.selected){
				this.selected = data.selected;
			}


		},

		clone: function(){
			var newInstance = new Instance();
			newInstance.position = {x:0,y:0};
			newInstance.position.x = this.position.x;
			newInstance.position.y = this.position.y;
			newInstance.scale = this.scale;
			newInstance.rotation = this.rotation;
			newInstance.anchor = this.anchor;
			newInstance.selected = this.selected;
			newInstance.visible = true;
			return newInstance;

		}
	});

	return Instance;



});