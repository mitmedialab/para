/*Instance.js
 * used to store references of a shape object
 *
 */

define([
	'underscore',
	'models/data/GeometryNode',
	'models/PaperManager'
], function(_, GeometryNode, PaperManager) {

	var Instance = GeometryNode.extend({
		data: null,
		rotation: 0,
		position: 0,

		//initialize function- if no path object is passed, a new one is created
		initialize: function(path_data) {

			if (!path_data) {
				var paper = PaperManager.getPaperInstance('path');
				this.data = new paper.Path();
				this.data.selected = true;
				this.data.strokeColor = this.get('strokeColor');
			} else {
				this.data = path_data;
			}

			//reflexive definition
			this.data.instanceParent = this;

			//add mouse event listener for changes on path object
			this.data.on('mouseup', function() {
				this.instanceParent.trigger('change:updateInstances', this);
			});

			GeometryNode.prototype.initialize.call(this);
		},

		//updates the path data to correspond to the prototype
		update: function(_data) {
			this.position = this.data.position;
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
			this.data.rotate(this.rotation);
			console.log('rotation of final=' + this.data.rotation);
			this.data.position = this.position;

			GeometryNode.prototype.update.apply(this, arguments);

		},

		clear: function() {
			this.data.detach('mouseup');
			this.data.remove();
			this.data.nodeParent = null;
			this.next = null;
			this.position = null;
			this.rotation = null;
		},

		checkIntersections: function(instances) {

			for (var i = 0; i < instances.length; i++) {
				var intersections = this.data.getIntersections(instances[i].data);
				if (intersections.length > 0) {
					return intersections;
				}
			}
			return null;

		}



	});

	return Instance;



});