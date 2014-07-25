/*Instance.js
 * used to store references of a shape object
 *
 */

define([
	'underscore',
	'jquery',
	'backbone',
], function(_, $,Backbone) {

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
			this.strokeColor = 'black';
			this.fillColor = 'white';
			this.strokeWidth = 0;
			//index of instance that was used to create this instance (for instances created upon render)
			this.instanceParentIndex = 0;
			this.index = null;
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
			this.instanceParentIndex = 0;
			this.index = null

			
		},

		exportJSON: function(){
			console.log(this.renderSignature);
			this.set({
				closed:this.closed,
				position:this.position,
				visible:this.visible,
				scale:this.scale,
				rotation: this.rotation,
				renderSignature:JSON.stringify(this.renderSignature),
				index: this.index,
				strokeWidth: this.strokeWidth,
				fillColor: this.fillColor,
				strokeColor: this.strokeColor

			});
			return this.toJSON();
		},


		//only called on a update function- 
		//sets instances' properties to that of the data
		update: function(data){
			//console.log("calling update on instance: "+this.index+","+this.nodeParent.name);
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
				//console.log("updating rotation");
				this.rotation=data.rotation;
			}
			if(data.strokeWidth){
				this.strokeWidth =data.strokeWidth;
			}
			if(data.strokeColor){
				this.strokeColor= data.strokeColor;
			}
			if(data.fillColor){
				this.fillColor = data.fillColor;
			}
			




		},

	

		/*only called on a render function-
		propagates the instances' properties with that of the data*/
		render: function(data) {
			//console.log("update called with data:");
			//cloconsole.log(data);
			//if(this.nodeParent){
				//console.log("calling render on instance: "+this.index+","+this.nodeParent.name);
			//}
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
			if(data.strokeWidth){
				this.strokeWidth =data.strokeWidth;
				console.log("instance stroke width="+this.strokeWidth);
			}
			if(data.strokeColor){
				this.strokeColor= data.strokeColor;
			}
			if(data.fillColor){
				this.fillColor = data.fillColor;
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
			newInstance.strokeWidth = this.strokeWidth;
			newInstance.strokeColor = this.strokeColor;
			newInstance.fillColor = this.fillColor;
			return newInstance;

		}
	});

	return Instance;



});