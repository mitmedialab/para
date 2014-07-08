/*Instance.js
 * used to store references of a shape object
 *
 */

define([
	'underscore',
	'models/data/GeometryNode',
	'models/PaperManager'
], function(_, GeometryNode, PaperManager) {
	var dataCopies = [];

	var Instance = GeometryNode.extend({
		visible: true,
		scaleVal: 1,
		position: 0,
		rotation: 0,
		anchor: false,
		nodeParent: null,
		myData: null,
		//initialize function- if no path object is passed, a new one is created
		initialize: function(nodeParent) {
			this.nodeParent =nodeParent;
			
			//add mouse event listener for changes on path object
		
			GeometryNode.prototype.initialize.call(this);
		},

		//updates the path data to correspond to the prototype
		update: function(data) {
			this.position = this.position.add(data.position);
			this.scaleVal*data.scaleVal;
			this.rotation+=data.rotation;
			this.visible = data.visible;
			/*this.position = this.data.position;
			console.log('rotation before =' + this.rotation);
			this.data.detach('mouseup');
			this.data.remove();
			this.data = null;
			this.data = _data;
			//console.log('rotation of new =' + this.data.rotation);
			this.data.instanceParent = this;
			this.data.on('mouseup', function() {
				this.instanceParent.trigger('change:updateInstances', this);
			});
			//this.data.rotate(this.rotation);
			//console.log('rotation of final=' + this.data.rotation);
			//this.data.position = this.position;

			//GeometryNode.prototype.update.apply(this, arguments);*/

		},

		copyParameters: function(instance){
			this.visible  = instance.visible;
			this.scaleVal = instance.scaleVal;
			this.position = instance.position;
			this.rotation = instance.rotation;
		},

		draw: function(data){
			var myData = data.clone();
			dataCopies.push(myData);
			myData.setPosition(this.position);
			myData.rotate(this.rotation);
			myData.scale(this.scaleVal);
			myData.data.instanceParent = this;
			myData.data.nodeParent = this.nodeParent;
			myData.on('mouseup', function() {
				this.data.instanceParent.trigger('change:mouseUpInstance', this.data.instanceParent);
			});

			/*if (!obj.data) {
				var paper = PaperManager.getPaperInstance('path');
				this.data = new paper.Path();
				this.data.selected = true;
				this.data.strokeColor = this.get('strokeColor');
			} else {
				this.data = obj.data;
			}
			this.data.selectedColor = 'blue';

			//reflexive definition
			this.data.instanceParent = this;*/

		},

		clear: function() {
			for(var i=0;i<dataCopies.size;i++){
				var myData = dataCopies[i];
				myData.detach('mouseup');
				myData.remove();
				myData.data.instanceParent = null;
				myData = null;
			}
		
		},

		checkIntersections: function(instances) {

			for (var i = 0; i < instances.length; i++) {
				var intersections = this.data.getIntersections(instances[i].data);
				if (intersections.length > 0) {
					return intersections;
				}
			}
			return null;

		},

		setPosition: function(position) {
			this.position = position;

			//console.log(position);
		},

		//rotate
		rotate: function(theta) {
			this.rotation = this.rotation + theta;

		},

		//resets rotation to 0
		resetRotation: function() {
			this.rotation = 0;
		},

		//scale 
		scale: function(s) {
			this.scaleVal = s;
		},

		//resets scale to 1
		resetScale: function() {
			this.scaleVal = 1;
		},

		resetStrokeColor: function() {
			this.data.strokeColor = 'black';
		},


		isAnchor: function(toggle) {
			if (toggle) {
				this.anchor = true;
				this.data.selected = true;
				this.data.selectedColor = 'red';
				//this.data.strokeColor = 'red';
				//this.data.strokeWidth = 2;

			} else {
				this.anchor = false;
				this.data.selected = false;
				this.data.selectedColor = 'blue';
				//this.data.strokeColor = 'black';
				//this.data.strokeWidth = 1;

			}

			this.trigger('change:anchorInit', this);
		}



	});

	return Instance;



});