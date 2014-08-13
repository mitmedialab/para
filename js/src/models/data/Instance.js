/*Instance.js
 * used to store references of a shape object
 *
 */

define([
	'underscore',
	'jquery',
	'backbone',
	'models/PaperManager'
], function(_, $,Backbone, PaperManager) {
 var paper = PaperManager.getPaperInstance();

	var Instance = Backbone.Model.extend({

		 constructor: function() {
			this.visible= true;
			this.scale= 1;
			this.closed = false;
			this.width = 0;
			this.height = 0;
			this.position= {
				x: 0,
				y: 0
			};

			this.delta ={
				x:0,
				y:0
			};
			this.midpoint = {
				x: 0,
				y: 0
			};
			this.rotation = {
				angle:0,x:0,y:0
			};
			this.anchor= false;
			this.drawAnchor=false;
			this.selected= false;
			this.copy= false;
			this.strokeColor = 'black';
			this.fillColor = 'white';
			this.strokeWidth = 1;
			//index of instance that was used to create this instance (for instances created upon render)
			this.instanceParentIndex = 0;
			this.index = null;
			//array that contains the path of inheritance from a render;
			this.renderSignature = [];
			Backbone.Model.apply(this, arguments);
			this.matrix = new paper.Matrix();
					 },
		reset: function() {
			//console.log("reset instance");
			this.visible= true;
			this.scale= 1;
			this.position= {
				x: 0,
				y: 0
			};
			this.rotation= {
				angle:0,x:0,y:0
			};
			this.midpoint = {
				x: 0,
				y: 0
			};
			this.width = 0;
			this.height = 0;
			this.anchor= false;
			this.selected= false;
			this.closed = false;
			this.instanceParentIndex = 0;
			this.index = null;

			
		},

		exportJSON: function(){
			console.log(this.renderSignature);
			this.set({
				closed:this.closed,
				position:this.position,
				delta: this.delta,
				midpoint: this.midpoint,
				width: this.width,
				height: this.height,
				anchor: this.anchor,
				visible:this.visible,
				scale:this.scale,
				rotation: this.rotation,
				strokeWidth: this.strokeWidth,
				fillColor: this.fillColor,
				strokeColor: this.strokeColor

			});
			return this.toJSON();
		},

		parseJSON: function(data){
			this.closed = data.closed;
			this.position = data.position;
			this.delta = data.delta;
			this.midpoint = data.midpoint;
			this.width = data.width;
			this.height= data.height;
			this.anchor =  data.anchor;
			this.visible = data.visible;
			this.scale = data.scale;
			this.rotation = data.rotation;
			this.strokeWidth = data.strokeWidth;
			this.fillColor = data.fillColor;
			this.strokeColor = data.strokeColor;
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

			if(data.delta){
				//console.log('prior position =');
				//console.log(this.position);

				this.delta.x=data.delta.x;
				this.delta.y=data.delta.y;
				//console.log('updated position=');
				//console.log(this.position);
			}
			if(data.width){
				this.width=data.width;
			}
			if(data.height){
				this.height = data.height;
			}
			if(data.scale){
				this.scale=data.scale;
			
			}
			if(data.rotation){
				//console.log("updating rotation");
				this.rotation.angle=data.rotation.angle;
				if(data.rotation.x){
					this.rotation.x = data.rotation.x;
				}
				else{
					this.rotation.x = this.midpoint.x;
	
				}
				if(data.rotation.y){
					this.rotation.y = data.rotation.y;
				}
				else{
					this.rotation.y = this.midpoint.y;
	
				}
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
			if(data.closed){
				this.closed = data.closed;
			}
			this.midpoint.x = this.position.x+this.width/2;
			this.midpoint.y = this.position.y+this.height/2;
			




		},

		increment: function(data){
			//console.log("calling update on instance: "+this.index+","+this.nodeParent.name);
			if(data.delta){
				//console.log('prior position =');
				//console.log(this.position);

				this.delta.x+=data.delta.x;
				this.delta.y+=data.delta.y;
				//console.log('updated position=');
				//console.log(this.position);
			}
			if(data.scale){
				this.scale*=data.scale;
			
			}
			if(data.rotation){
				//console.log("updating rotation");
				this.rotation+=data.rotation.angle;
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
			this.midpoint.x = this.position.x+this.width/2;
			this.midpoint.y = this.position.y+this.height/2;




		},

		getRelativePos: function(){
			return {x:this.position.x+this.delta.x,y:this.position.y+this.delta.y};
		},

	

		/*only called on a render function-
		propagates the instances' properties with that of the data*/
		render: function(data) {
			//cloconsole.log(data);
			//if(this.nodeParent){
				//console.log("calling render on instance: "+this.index+","+this.nodeParent.name);
			//}
			this.matrix.reset();
 				
			
			if(data.matrix){
				this.matrix.concatenate(data.matrix);			


			}
			/*if(data.position){
				//console.log('prior position =');
				//console.log(this.position);

			
				
				this.matrix = this.matrix.translate(new paper.Point(this.position.x+data.position.x,this.position.y+data.position.y));

				//console.log('updated position=');
				//console.log(this.position);
			}
			else{*/
			
				this.matrix = this.matrix.translate(new paper.Point(this.delta.x,this.delta.y));
				this.matrix = this.matrix.scale(this.scale);

				this.matrix = this.matrix.rotate(this.rotation.angle,this.position.x,this.position.y);
				/*var uLP = new paper.Path.Circle(this.position.x,this.position.y,5);
			if(this.nodeParent.type!=='root'){
				 uLP.fillColor = 'green';
				 if(this.nodeParent.type==='behavior'){
				 	 uLP.fillColor = 'red';
				 }
				 var mP = new paper.Path.Circle(this.position.x+this.width/2,this.position.y+this.height/2,3);
				
				 mP.fillColor='purple';
				 this.nodeParent.addScaffold(uLP);
				 this.nodeParent.addScaffold(mP);
				uLP.transform(this.matrix);
				mP.transform(this.matrix);
			}*/
				
			//}

			if(data.scale){
				this.scale*=data.scale;
			
			}
			
			if(data.selected){
				this.selected = data.selected;
			}
			/*if(data.strokeWidth){
				this.strokeWidth =data.strokeWidth;
			}
			if(data.strokeColor){
				this.strokeColor= data.strokeColor;
			}
			if(data.fillColor){
				this.fillColor = data.fillColor;
			}*/



		},

		clone: function(){
			var newInstance = new Instance();
			newInstance.position = {x:0,y:0};
			newInstance.delta = {x:0,y:0};
			newInstance.delta.x= this.delta.x;
			newInstance.delta.y= this.delta.y;
			newInstance.position.x = this.position.x;
			newInstance.position.y = this.position.y;
			newInstance.scale = this.scale;
			newInstance.rotation.angle = this.rotation.angle;
			newInstance.rotation.x = this.rotation.x;
			newInstance.rotation.x = this.rotation.y;
			newInstance.midpoint.x = this.midpoint.x;
			newInstance.midpoint.y = this.midpoint.y;
			newInstance.width = this.width;
			newInstance.height = this.height;
			newInstance.anchor = this.anchor;
			newInstance.selected = this.selected;
			newInstance.visible = true;
			newInstance.nodeParent = this.nodeParent;
			newInstance.strokeWidth = this.strokeWidth;
			newInstance.strokeColor = this.strokeColor;
			newInstance.fillColor = this.fillColor;
			newInstance.matrix = this.matrix.clone();
			return newInstance;

		}
	});

	return Instance;



});