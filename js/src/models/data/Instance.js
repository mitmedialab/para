/*Instance.js
 * used to store references of a shape object
 *
 */

define([
	'underscore',
	'jquery',
	'models/data/SceneNode',
	'models/PaperManager',
	'utils/PPoint'
], function(_, $, SceneNode, PaperManager, PPoint) {
	var paper = PaperManager.getPaperInstance();

	var Instance = SceneNode.extend({
		name: 'instance',
		type: 'geometry',

		defaults: {
			visible: true,
			selected: false,
			closed: false,
			width: 0,
			height: 0,
			order: 0,

			//point attributes
			position: null,
			translation_delta: null,
			center: null,
			scaling_origin: null,
			scaling_delta: 1,
			rotation_origin: null,
			rotation_delta: 0,

			//screen properies
			screen_position: null,
			screen_width: 0,
			screen_height: 0,

			stroke_color: null,
			stroke_width: 1,
			fill_color: 0,

			matrix: null,
			reset: false,
			geom: null,
			bbox: null,
			reset_matrix: true,

			totalRotationDelta:0

		},



		initialize: function() {
			this.set('position', new PPoint(0, 0));
			this.set('translation_delta', new PPoint(0, 0));
			this.set('center', new PPoint(0, 0));
			this.set('scaling_origin', new PPoint(0, 0));
			this.set('rotation_origin', new PPoint(0, 0));
			this.set('matrix', new paper.Matrix());
			var bounds = new paper.Rectangle(0, 0, 1, 1);
			this.set('bbox', new paper.Path.Rectangle(bounds));
			SceneNode.prototype.initialize.apply(this, arguments);

		},

		reset: function() {
			this.clear().set(this.defaults);
			this.set('position', new PPoint(0, 0));
			this.set('translation_delta', new PPoint(0, 0));
			this.set('center', new PPoint(0, 0));
			this.set('scaling_origin', new PPoint(0, 0));
			this.set('rotation_origin', new PPoint(0, 0));
			this.set('matrix', new paper.Matrix());
		},

		exportJSON: function() {
			return this.toJSON();
		},

		parseJSON: function(data) {
			this.set(data.toJSON);
		},


		//only called on a update function- 
		//sets instances' properties to that of the data
		update: function(data) {
			//console.log('updating instance',data);
			this.set(data);
			//console.log("translation_delta",this.get('translation_delta'));

		},



		incrementDelta: function(data) {
			if (data.translation_delta) {
				var translation_delta = this.get('translation_delta');
				//console.log("translation_delta",this.get('translation_delta'));
				translation_delta.add(data.translation_delta);
				console.log("translation_delta", translation_delta);

				this.set('translation_delta', translation_delta);
			}
			if (data.rotation_delta) {
				var rotation_delta = this.get('rotation_delta');
				rotation_delta += data.rotation_delta;
				this.set('rotation_delta', rotation_delta);
			}

		},

		getCenter: function() {
			return {
				x: this.get('position').x + this.get('delta').x,
				y: this.get('position').y + this.get('delta').y
			};
		},

		getUpperLeft: function() {
			return {
				x: this.get('position').x + this.get('delta').x - this.get('width') / 2,
				y: this.get('position').y + this.get('delta').y - this.get('height') / 2,
			};
		},

		getLowerRight: function() {
			return {
				x: this.get('position').x + this.get('delta').x + this.get('width') / 2,
				y: this.get('position').y + this.get('delta').y + this.get('height') / 2,
			};
		},


		concatMatrix: function(data) {
			var matrix = this.get('matrix');
			var reset_matrix = this.get('reset_matrix');

			if (reset_matrix) {
				this.set('reset_matrix', false);
				this.set('totalRotationDelta',0);
				matrix.reset();
			}
			if (data.rotation_delta) {
				var crotation_delta = this.get('totalRotationDelta');
				this.set('totalRotationDelta',crotation_delta+data.rotation_delta);

			}
			this.set('matrix',matrix);

		},

		/*only called on a render function-
		propagates the instances' properties with that of the data*/
		render: function(data) {
			//console.log("rendering instance");
			var matrix = this.get('matrix');
			var selected = this.get('selected');
			var translation_delta = this.get('translation_delta').toPaperPoint();
			var rotation_origin = this.get('rotation_origin').toPaperPoint;
			var rotation_delta = this.get('rotation_delta')+this.get('totalRotationDelta');
			var scaling_origin = this.get('scaling_origin').toPaperPoint;
			var scaling_delta = this.get('scaling_delta');

			//console.log('translation_delta for render', translation_delta);

			if (data) {

				if (data.matrix) {
					matrix.concatenate(data.matrix);


				}
				if (data.selected) {
					selected = data.selected;
				}
			}


			matrix.translate(translation_delta);
			matrix.rotate(rotation_delta, rotation_origin);
			matrix.scale(scaling_delta, scaling_origin);

			if (this.has('protoNode')) {
				var proto = this.get('protoNode');
				var geom = proto.run();
				var path = geom.path;
				path.data.instance = this;
				path.transform(matrix);
				var screen_bounds = path.bounds;
				var bbox = this.get('bbox');
				bbox.selected = selected;
				path.selected = selected;
				//screen_bounds.selected = selected;
				this.set({
					screen_position: screen_bounds.topLeft,
					screen_width: screen_bounds.width,
					screen_height: screen_bounds.height,
				});
				//console.log('screen_position',this.get('screen_position'));
				this.set('geom', path);
			}
			this.set('reset_matrix', true);
		},

		getLinkedDimensions: function(data) {
			var top = data.top;
			var dimensions = {};
			var position = this.get('screen_position');
			var width = this.get('screen_width');
			var height = this.get('screen_height');
			if (data.dimensions) {
				var pdimensions = data.dimensions;

				var leftX = position.x < pdimensions.leftX ? position.x : pdimensions.leftX;
				var topY = position.y < pdimensions.topY ? position.y : pdimensions.topY;
				var rightX = position.x + width > pdimensions.rightX ? position.x + width : pdimensions.rightX;
				var bottomY = position.y + height > pdimensions.bottomY ? position.y + height : pdimensions.bottomY;

				data.dimensions = {
					leftX: leftX,
					topY: topY,
					rightX: rightX,
					bottomY: bottomY,
				};
			} else {
				data.dimensions = {
					leftX: position.x,
					topY: position.y,
					rightX: position.x + width,
					bottomY: position.y + height,
				};
			}
			console.log("dimensions", data.dimensions);
			console.log("getting dimensions for children", this.children.length);
			data.top = false;
			for (var i = 0; i < this.children.length; i++) {

				data = this.children[i].getLinkedDimensions(data);
			}
			console.log("post_dimensions", data.dimensions);
			//TODO: recycle bounding box rather than re-initializing it.
			if (top) {
				var bx = data.dimensions.leftX;
				var by = data.dimensions.topY;
				var bwidth = data.dimensions.rightX - bx;
				var bheight = data.dimensions.bottomY - by;
				var rectangle = new paper.Rectangle(bx, by, bwidth, bheight);
				data.bbox = this.get('bbox');

				data.bbox.position = rectangle.center;

				var scaleX = rectangle.width / data.bbox.bounds.width;
				var scaleY = rectangle.height / data.bbox.bounds.height;
				data.bbox.scale(scaleX, scaleY);

				data.bbox.selectedColor = 'red';
				data.bbox.visible = true;
				data.bbox.selected = true;
				data.bbox.instance = this;
				this.set('bbox', data.bbox);
			}

			return data;
		},

		cloneInstance: function() {
			var clone = this.clone();
			clone.set('position', this.get('position').clone());
			clone.set('translation_delta', this.get('translation_delta').clone());
			clone.set('center', this.get('center').clone());
			clone.set('scaling_origin', this.get('scaling_origin').clone());
			clone.set('rotation_origin', this.get('rotation_origin').clone());
			clone.set('matrix', this.get('matrix').clone());
			clone.set('bbox', this.get('bbox').clone());
			return clone;
		}
	});

	return Instance;



});