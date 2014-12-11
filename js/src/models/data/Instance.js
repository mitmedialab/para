/*Instance.js
 * used to store references of a shape object
 *
 */

define([
	'underscore',
	'jquery',
	'paper',
	'models/data/SceneNode',
	'utils/PPoint',
], function(_, $, paper, SceneNode, PPoint) {
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

			rmatrix: null,
			tmatrix: null,
			smatrix: null,
			reset: false,
			geom: null,
			bbox: null,
			inheritors: null,
			sibling_instances: null,
			isProto: false,
			id: null,
			show: false,

		},

		initialize: function() {
			this.set('position', new PPoint(0, 0));
			this.set('translation_delta', new PPoint(0, 0));
			this.set('center', new PPoint(0, 0));
			this.set('scaling_origin', new PPoint(0, 0));
			this.set('rotation_origin', new PPoint(0, 0));
			this.set('tmatrix', new paper.Matrix());
			this.set('smatrix', new paper.Matrix());
			this.set('inheritors', []);
			this.set('sibling_instances', []);

			this.set('rmatrix', new paper.Matrix());
			var bounds = new paper.Rectangle(0, 0, 1, 1);
			this.set('bbox', new paper.Path.Rectangle(bounds));
			this.set('id', new Date().getTime().toString());
			SceneNode.prototype.initialize.apply(this, arguments);


		},

		reset: function() {
			this.set('rendered', false);
			this.set('visited', false);
			var rmatrix = this.get('rmatrix');
			var smatrix = this.get('smatrix');
			var tmatrix = this.get('tmatrix');

			rmatrix.reset();
			smatrix.reset();
			tmatrix.reset();

			this.set('rmatrix', rmatrix);
			this.set('smatrix', smatrix);
			this.set('tmatrix', tmatrix);
		},

		resetProperties: function() {
			this.clear().set(this.defaults);
			this.set('position', new PPoint(0, 0));
			this.set('translation_delta', new PPoint(0, 0));
			this.set('center', new PPoint(0, 0));
			this.set('scaling_origin', new PPoint(0, 0));
			this.set('rotation_origin', new PPoint(0, 0));
			this.set('matrix', new paper.Matrix());
		},

		resetToPrototype: function(data) {
			console.log('reset to prototype');
			var protoNode;
			if (data.translation_delta) {

				protoNode = this.get('translation_node');
				if (!protoNode) {
					protoNode = this.get('proto_node');
				}
				if (protoNode) {
					this.set('position',protoNode.get('position').clone());
					this.set('rotation_origin',protoNode.get('rotation_origin').clone());
					this.set('scaling_origin',protoNode.get('scaling_origin').clone());
					this.set('translation_delta',new PPoint(0,0));
				}
			}

			if (data.rotation_delta) {

				protoNode = this.get('rotation_node');
				if (!protoNode) {
					protoNode = this.get('proto_node');
				}
				if (protoNode) {
					this.set('rotation_delta',0);
				}
			}
		},

			resetToLastDelta: function() {
			this.set('translation_delta', this.get('translation_delta_last'));

		},

		exportJSON: function() {
			return this.toJSON();
		},

		parseJSON: function(data) {
			this.set(data.toJSON);
		},

		//sets instances' properties to that of the data
		update: function(data) {
			this.set(data);
		},

		incrementDelta: function(data, override) {
			var matrix = this.get('matrix');
			var position = this.get('rotation_origin').toPaperPoint();
			var proto_incremented = false;
			var protoNode;
			if (data.translation_delta) {
				if (override) {
					protoNode = this.get('translation_node');
					if (!protoNode) {
						protoNode = this.get('proto_node');
					}
					if (protoNode) {
						protoNode.incrementDelta(data);
						proto_incremented = true;

					}

				} else {
					var translation_delta = this.get('translation_delta');
					translation_delta.add(data.translation_delta);
					this.set('translation_delta', translation_delta);
				}
			}

			if (data.rotation_delta) {
				if (override) {
					protoNode = this.get('rotation_node');
					if (!protoNode) {
						protoNode = this.get('proto_node');
					}
					if (protoNode) {
						protoNode.incrementDelta(data);
						proto_incremented = true;
					}


				} else {
					var rotation_delta = this.get('rotation_delta');
					rotation_delta += data.rotation_delta;
					this.set('rotation_delta', rotation_delta);
				}
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

		/*getRelevantPrototypes
		 * returns a list of relevant prototypes based on
		 * transformation properties
		 */
		getRelevantPrototypes: function(data) {
			var prototypes = [];
			var contains_proto = false;
			if (data.rotation_delta) {
				if (this.get('rotation_node')) {
					prototypes.push(this.get('rotation_node'));
				} else if (this.get('proto_node')) {
					prototypes.push(this.get('proto_node'));
					contains_proto = true;
				}
			}
			if (data.translation_delta) {
				if (this.get('translation_node')) {
					prototypes.push(this.get('translation_node'));
				} else if (this.get('proto_node') && !contains_proto) {
					prototypes.push(this.get('proto_node'));
					contains_proto = true;
				}
			}
			if (data.rotation_delta) {
				if (this.get('scaling_node')) {
					prototypes.push(this.get('scaling_node'));
				} else if (this.get('proto_node') && !contains_proto) {
					prototypes.push(this.get('proto_node'));
					contains_proto = true;
				}
			}
			return prototypes;

		},

		/*inheritGeom
		 * moves up the prototype chain to find the
		 * relevant geometry for this node and return it
		 */
		inheritGeom: function() {
			if (this.has('proto_node')) {
				var protoNode = this.get('proto_node');
				if (!protoNode.get('rendered')) {
					protoNode.render();
				}
				return protoNode.inheritGeom();
			}
		},


		/*inheritTranslation
		 * checks first to see if there is a translation prototype
		 * moves up the prototype chain to find the
		 * relevant translation for this node and applies it to the matrix
		 */
		inheritTranslation: function(tmatrix, target_origin) {
			var protoNode;
			if (this.has('translation_node')) {
				protoNode = this.get('translation_node');

			} else if (this.has('proto_node')) {
				protoNode = this.get('proto_node');
			}
			if (protoNode) {
				if (!protoNode.get('rendered')) {
					protoNode.render();
				}
				tmatrix = protoNode.inheritTranslation(tmatrix, target_origin);

			}
			var translation_delta = this.get('translation_delta');
			tmatrix.translate(translation_delta);

			return tmatrix;
		},

		/*inheritRotation
		 * checks first to see if there is a rotation prototype
		 * moves up the prototype chain to find the
		 * relevant rotation setting for this node and applies it to the matrix
		 */
		inheritRotation: function(rmatrix, target_rotation_origin) {
			var protoNode;
			if (this.has('rotation_node')) {
				protoNode = this.get('rotation_node');
			} else if (this.has('proto_node')) {
				protoNode = this.get('proto_node');
			}
			if (protoNode) {
				if (!protoNode.get('rendered')) {
					protoNode.render();
				}
				rmatrix = protoNode.inheritRotation(rmatrix, target_rotation_origin);
			}
			var rotation_delta = this.get('rotation_delta');
			rmatrix.rotate(rotation_delta, target_rotation_origin);

			return rmatrix;
		},

		/*inheritScaling
		 * checks first to see if there is a scaling prototype
		 * moves up the prototype chain to find the
		 * relevant scaling for this node and applies it to the matrix
		 */
		inheritScaling: function(smatrix, target_scaling_origin) {
			var protoNode;
			if (this.has('scaling_node')) {
				protoNode = this.get('scaling_node');
			} else if (this.has('proto_node')) {
				protoNode = this.get('proto_node');
			}
			if (protoNode) {
				if (!protoNode.get('rendered')) {
					protoNode.render();
				}
				smatrix = protoNode.inheritScaling(smatrix, target_scaling_origin);
			}

			var scaling_delta = this.get('scaling_delta');
			smatrix.scale(scaling_delta, target_scaling_origin);

			return smatrix;
		},

		/*getPrototypeFor
		 * check to see if object has a prototype attached to a specific property
		 */
		getPrototypeFor: function(type) {
			if (this.has(type)) {
				return (this.get(type));
			} else {
				if (this.has('proto_node')) {
					var protoNode = this.get('proto_node');
					return protoNode.getPrototypeFor(type);
				} else {
					return null;
				}
			}
		},

		/*updateGeom
		 * moves up the prototype chain to find the
		 * relevant geometry to increment points
		 * when user selects and moves points of an instance
		 */
		updateGeom: function(segment_index, data, rmatrix, smatrix, tmatrix) {

			if (this.has('proto_node')) {
				var proto = this.get('proto_node');


				proto.updateGeom(segment_index, data, rmatrix, smatrix, tmatrix);
			}
		},

		/*only called on a render function-
		propagates the instances' properties with that of the data*/
		render: function() {
			var isProto = this.get('isProto');
			var view;
			if (isProto) {
				view = paper.View._viewsById['sub-canvas'];
			} else {
				view = paper.View._viewsById['canvas'];

			}
			view._project.activate();


			var rmatrix = this.get('rmatrix');
			var smatrix = this.get('smatrix');
			var tmatrix = this.get('tmatrix');
			var selected = this.get('selected');
			var position = this.get('position').toPaperPoint();
			var translation_delta = this.get('translation_delta').toPaperPoint();
			var rotation_origin = this.get('rotation_origin').toPaperPoint();
			var rotation_delta = this.get('rotation_delta');
			var scaling_origin = this.get('scaling_origin').toPaperPoint();
			var scaling_delta = this.get('scaling_delta');


			rmatrix.rotate(rotation_delta, rotation_origin);
			smatrix.scale(scaling_delta, scaling_origin);
			tmatrix.translate(translation_delta);

			var protoNode = this.get('proto_node');
			var translation_node = this.get('translation_node');
			var rotation_node = this.get('rotation_node');
			var scaling_node = this.get('scaling_node');
			if (translation_node) {
				tmatrix = translation_node.inheritTranslation(tmatrix, position);


			} else if (protoNode) {
				tmatrix = protoNode.inheritTranslation(tmatrix, position);
			}


			if (scaling_node) {
				smatrix = scaling_node.inheritScaling(smatrix, scaling_origin);
			} else if (protoNode) {
				smatrix = protoNode.inheritScaling(smatrix, scaling_origin);
			}

			if (rotation_node) {
				rmatrix = rotation_node.inheritRotation(rmatrix, rotation_origin);
			} else if (protoNode) {
				rmatrix = protoNode.inheritRotation(rmatrix, rotation_origin);
			}



			var geom = new paper.Path();
			geom.importJSON(this.inheritGeom());

			if (geom) {
				geom.data.instance = this;
				geom.visible = true;
				geom.position = position;
				geom.transform(rmatrix);
				geom.transform(smatrix);
				geom.transform(tmatrix);
				var screen_bounds = geom.bounds;
				var bbox = this.get('bbox');
				bbox.selected = selected;
				geom.selected = selected;
				//screen_bounds.selected = selected;
				this.set({
					screen_position: screen_bounds.topLeft,
					screen_width: screen_bounds.width,
					screen_height: screen_bounds.height,
				});
				//if shape is prototype, do not render it on the screen
				if (isProto && !this.get('show')) {
					geom.visible = false;

				} else if (isProto) {}



				this.set('geom', geom);

			}
			this.set('rendered', true);
		},



		//TODO: implement deep copy and cloning correctly. right now it is effed
		clone: function() {
			var clone = new Instance(); //SceneNode.prototype.clone.apply(this, arguments);
			this.copyAttributes(clone);
			return clone;
		},

		copyAttributes: function(clone, deep) {
			clone.set('position', this.get('position').clone());
			clone.set('translation_delta', this.get('translation_delta').clone());
			clone.set('rotation_delta', this.get('rotation_delta'));
			clone.set('scaling_delta', this.get('scaling_delta').clone());
			clone.set('center', this.get('center').clone());
			clone.set('scaling_origin', this.get('scaling_origin').clone());
			clone.set('rotation_origin', this.get('rotation_origin').clone());
			clone.set('rmatrix', this.get('rmatrix').clone());
			clone.set('smatrix', this.get('smatrix').clone());
			clone.set('tmatrix', this.get('tmatrix').clone());
			clone.set('bbox', this.get('bbox').clone());
			return clone;
		},

		removeProto: function() {


		}

	});

	return Instance;



});