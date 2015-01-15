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
			proto_selected: false,
			inheritor_selected: false,
			ancestor_selected: false,
			selected_indexes: null,
			bbox: null,
			i_bbox: null,
			inheritorbbox: null,
			closed: false,
			width: 0,
			height: 0,
			order: 0,

			//point attributes
			position: null,
			translation_delta: null,
			center: null,
			scaling_origin: null,
			scaling_delta: null,
			rotation_origin: null,
			rotation_delta: null,

			//screen properies
			screen_position: null,
			screen_width: 0,
			screen_height: 0,

			stroke_color: null,
			stroke_width: null,
			fill_color: null,

			rmatrix: null,
			tmatrix: null,
			smatrix: null,
			reset: false,
			geom: null,
			inheritors: null,
			sibling_instances: null,
			is_proto: false,
			id: null,
			show: false,

			//path properties
			master_path: null,
			alpha: 1,
			mod: -0.01,
			inheritance_selection_color: '#0D7C1F',
			proxy_selection_color: '#10B0FF',
			primary_selection_color: '#A5FF00'
				//path_deltas: null,

		},

		initialize: function() {
			this.set('position', new PPoint(0, 0));
			this.set('center', new PPoint(0, 0));
			this.set('scaling_origin', new PPoint(0, 0));
			this.set('rotation_origin', new PPoint(0, 0));
			this.set('tmatrix', new paper.Matrix());
			this.set('smatrix', new paper.Matrix());
			this.set('inheritors', []);
			this.set('sibling_instances', []);
			this.set('rmatrix', new paper.Matrix());

			this.set('selected_indexes', []);
			var bounds = new paper.Rectangle(0, 0, 1, 1);
			this.set('bbox', new paper.Path.Rectangle(bounds));
			this.set('i_bbox', {
				topLeft: null,
				bottomRight: null,
			});
			this.set('id', new Date().getTime().toString());
			SceneNode.prototype.initialize.apply(this, arguments);
		},

		/* create
		 * Prototypal inheritance action:
		 * creates a new instance which inherits from
		 * the parent instance.
		 * TODO: add in checks to prevent diamond inheritance
		 */
		create: function() {
			var instance = new this.constructor();
			this.set('is_proto', true);

			console.log('instance', instance);
			var inheritors = this.get('inheritors');
			instance.set('proto_node', this);
			inheritors.push(instance);
			this.set('inheritors', inheritors);
			return instance;
		},

		reset: function() {
			this.set('rendered', false);
			this.set('visited', false);

			this.set('i_bbox', {
				topLeft: null,
				bottomRight: null,
			});
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


		resetStylesToPrototype: function(data, recurse) {

			if (data.fill_color) {
				this.set('fill_color', null);
			}

			if (data.stroke_color) {
				this.set('stroke_color', null);
			}

			if (data.stroke_width) {
				this.set('stroke_width', null);
			}
			if (recurse) {
				var inheritors = this.get('inheritors');
				for (var i = 0; i < inheritors.length; i++) {
					inheritors[i].resetStylesToPrototype(data, recurse);
				}
			}
		},


		/*setDeltasToInstance
		 * sets delta to match properties of a given instance, depending on the properties of the
		 * data that is passed in
		 */
		setDeltasToInstance: function(data, instance) {
			if (data.translation_delta) {
				this.set('translation_delta', instance.get('translation_delta').clone());
			}

			if (data.rotation_delta) {
				this.set('rotation_delta', instance.get('rotation_delta'));

			}
			if (data.scaling_delta) {
				this.set('scaling_delta', instance.get('scaling_delta'));

			}
		},


		/*resetDeltasToPrototype
		 * removes property of instance so that it is overriden by prototype,
		 * if property exists in the data
		 */
		resetDeltasToPrototype: function(data) {
			if (data.translation_delta) {

				var protoNode = this.get('proto_node');

				if (protoNode) {
					//this.set('position', protoNode.get('position').clone());
					//this.set('rotation_origin', protoNode.get('rotation_origin').clone());
					//this.set('scaling_origin', protoNode.get('scaling_origin').clone());
					this.set('translation_delta', null);
				}
			}

			if (data.rotation_delta) {
				this.set('rotation_delta', null);

			}
			if (data.scaling_delta) {
				this.set('scaling_delta', null);
			}
		},


		resetPathDeltas: function() {
			var geom = new paper.Path();
			geom.importJSON(this.get('master_path'));
			var path_deltas = [];
			for (var i = 0; i < geom.segments.length; i++) {
				path_deltas.push(new PPoint(0, 0));
			}
			this.set('path_deltas', path_deltas);
			geom.remove();
			geom = null;
		},

		exportJSON: function() {
			return this.toJSON();
		},

		parseJSON: function(data) {
			this.set(data.toJSON);
		},



		/* modifyPoints
		 * called when segment in geometry is modified
		 */
		modifyPoints: function(segment_index, data, handle, mode, modifier) {
			var proto_node = this.get('proto_node');
			if (mode === 'proxy' && proto_node) {
				proto_node.modifyPoints(segment_index, data, handle, 'none');
			}

			var master_pathJSON = this.inheritProperty('master_path');
			var master_path = new paper.Path();
			master_path.importJSON(master_pathJSON);
			if (data.translation_delta) {
				var tmatrix = this.get('tmatrix');
				var rmatrix = this.get('rmatrix');
				var smatrix = this.get('smatrix');
				master_path.transform(rmatrix);
				master_path.transform(smatrix);
				master_path.transform(tmatrix);
				var delta = data.translation_delta.toPaperPoint();
				if (!handle) {
					master_path.segments[segment_index].point = master_path.segments[segment_index].point.add(delta);
				} else {
					if (handle === 'handle-in') {
						master_path.segments[segment_index].handleIn = master_path.segments[segment_index].handleIn.add(delta);
						master_path.segments[segment_index].handleOut = master_path.segments[segment_index].handleOut.subtract(delta);

					} else {
						master_path.segments[segment_index].handleOut = master_path.segments[segment_index].handleOut.add(delta);
						master_path.segments[segment_index].handleIn = master_path.segments[segment_index].handleIn.subtract(delta);

					}
				}
				var rinverted = rmatrix.inverted();
				var sinverted = smatrix.inverted();
				var tinverted = tmatrix.inverted();

				master_path.transform(tinverted);
				master_path.transform(sinverted);
				master_path.transform(rinverted);
				/*var newPoint = master_path.segments[segment_index].point.clone();
				var diff = newPoint.subtract(origPoint);
				var path_deltas = this.get('path_deltas');
				path_deltas[segment_index].add(new PPoint(diff.x, diff.y));
				this.set('path_deltas', path_deltas);*/
			}

			this.set('master_path', master_path.toJSON());
			master_path.remove();
		},

		/*normalizePath
		 * generates a set of transformation data based on the matrix
		 * then inverts the matrix and normalizes the path based on these values
		 * returns the transformation data
		 */
		normalizePath: function(path, matrix) {
			var data = {};
			data.rotation_delta = matrix.rotation;
			data.scaling_delta = new PPoint(matrix.scaling.x, matrix.scaling.y);
			//data.translation_delta = new PPoint(matrix.translation.x, matrix.translation.y);
			data.position = new PPoint(matrix.translation.x, matrix.translation.y);
			data.rotation_origin = new PPoint(matrix.translation.x, matrix.translation.y);
			data.scaling_origin = new PPoint(matrix.translation.x, matrix.translation.y);
			data.fill_color = path.fillColor;
			data.stroke_color = path.strokeColor;
			data.stroke_width = path.strokeWidth;
			data.width = path.bounds.width;
			data.height = path.bounds.height;
			var imatrix = matrix.inverted();
			path.transform(imatrix);
			path.visible = false;
			path.selected = false;
			path.data.nodetype = this.get('name');
			var pathJSON = path.toJSON();
			this.set('master_path', pathJSON);
			var path_deltas = [];
			for (var i = 0; i < path.segments.length; i++) {
				path_deltas.push(new PPoint(0, 0));
			}
			this.set('path_deltas', path_deltas);
			path.remove();
			return data;
		},


		modifyStyle: function(data, mode, modifier) {
			var inheritors = this.get('inheritors');

			if (mode === 'proxy') {
				var proto_node = this.get('proto_node');
				if (proto_node) {
					proto_node.modifyStyle(data, 'none');
				}
			} else if (mode === 'match') {
				for (var j = 0; j < inheritors.length; j++) {
					inheritors[i].resetStylesToPrototype(data, true);

				}
			} else if (mode === 'relative') {
				for (var i = 0; i < inheritors.length; i++) {
					inheritors[i].modifyStyle(data, 'none');
				}
			}
			if (mode !== 'proxy') {
				if (data.fill_color) {
					this.set('fill_color', data.fill_color);

				}

				if (data.stroke_color) {
					this.set('stroke_color', data.stroke_color);
				}

				if (data.stroke_width) {
					this.set('stroke_width', data.stroke_width);
				}
			}
		},

		modifyDelta: function(data, mode, modifier) {
			var matrix = this.get('matrix');
			var position = this.get('rotation_origin').toPaperPoint();
			var proto_incremented = false;
			var protoNode = this.get('proto_node');
			var inheritors = this.get('inheritors');
			if (mode === 'proxy') {
				if (protoNode) {
					if (modifier === 'override') {
						protoNode.setDeltasToInstance(data, this);
					}
					protoNode.modifyDelta(data, 'standard', 'none');
					proto_incremented = true;
				}
			} else if (mode === 'standard') {
				if (modifier === 'override') {
					for (var j = 0; j < inheritors.length; j++) {
						inheritors[j].resetDeltasToPrototype(data);
					}
				} else if (modifier === 'relative') {
					for (var i = 0; i < inheritors.length; i++) {
						inheritors[i].modifyDelta(data, 'standard', 'none');
					}

				}
			}
			if (data.translation_delta) {

				var translation_delta = this.get('translation_delta');
				if (!translation_delta) {
					translation_delta = new PPoint(0, 0);
				}
				if (data.set) {
					translation_delta = data.translation_delta;
				} else {
					translation_delta.add(data.translation_delta);
				}
				this.set('translation_delta', translation_delta);

			}

			if (data.rotation_delta) {
				var rotation_delta = this.get('rotation_delta');
				if (!rotation_delta) {
					rotation_delta = 0;
				}
				if (data.set) {
					rotation_delta = data.rotation_delta;
				} else {
					rotation_delta += data.rotation_delta;
				}
				this.set('rotation_delta', rotation_delta);

			}

			if (data.scaling_delta) {

				var scaling_delta = this.get('scaling_delta');
				if (!scaling_delta) {
					scaling_delta = 0;
				}
				if (data.set) {
					scaling_delta = data.scaling_delta;
				} else {
					scaling_delta.add(data.scaling_delta);
				}
				this.set('scaling_delta', scaling_delta);
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

		/*inheritProperty
		 * checks first to see if there is a scaling prototype
		 * moves up the prototype chain to find the
		 * relevant scaling for this node and applies it to the matrix
		 */
		inheritProperty: function(property) {
			if (this.get(property)) {
				return this.get(property);
			} else {
				if (this.has('proto_node')) {
					return this.get('proto_node').inheritProperty(property);
				}
			}
		},


		/* setSelectionForInheritors
		 * toggles selection mode for objects which inherit
		 * from this. Optionally also toggles selection for all
		 * ancestors.
		 */
		setSelectionForInheritors: function(select, mode, modifer,recurse) {
			var inheritors = this.get('inheritors');
			
			var proto = this.get('proto_node');
			if (proto) {
				if (!select) {
					proto.set('inheritor_selected', false);
					proto.setSelectionForInheritors(false);
				} else {
					if(recurse>0){
					if (mode === 'proxy') {
						proto.set('inheritor_selected', 'proxy');
						console.log('set inheritor selected to proxy');

					} else {
						proto.set('inheritor_selected', 'standard');
						proto.set('alpha', 1);
						console.log('set alpha to 1 for proto');
					}
					}
					else{
						proto.set('inheritor_selected', false);
						proto.set('alpha', 1);
					}
					proto.setSelectionForInheritors(select, 'standard', 'none',0);
				}

				}
			
			for (var i = 0; i < inheritors.length; i++) {
				inheritors[i].set('proto_selected', select);
				inheritors[i].set('alpha', 1);
			}
		},

		updateBoundingBox: function(instance) {
			var i_bbox = this.get('i_bbox');
			var i_geom = instance.get('geom');
			if (i_geom) {
				var i_topLeft = i_geom.bounds.topLeft;
				var i_width = i_geom.bounds.width;
				var i_height = i_geom.bounds.height;
				var i_bottomRight = i_geom.bounds.bottomRight;

				if (!i_bbox.topLeft) {
					i_bbox.topLeft = i_topLeft;
				} else {
					if (i_topLeft.x < i_bbox.topLeft.x) {
						i_bbox.topLeft.x = i_topLeft.x;
					}
					if (i_topLeft.y < i_bbox.topLeft.y) {
						i_bbox.topLeft.y = i_topLeft.y;
					}
				}

				if (!i_bbox.bottomRight) {
					i_bbox.bottomRight = i_bottomRight;
				} else {
					if (i_bottomRight.x > i_bbox.bottomRight.x) {
						i_bbox.bottomRight.x = i_bottomRight.x;
					}
					if (i_bottomRight.y > i_bbox.bottomRight.y) {
						i_bbox.bottomRight.y = i_bottomRight.y;
					}
				}
			}
		},


		/*only called on a render function-
		propagates the instances' properties with that of the data*/
		render: function() {
			if (!this.get('rendered')) {
				if (this.get('name') != 'root') {
					var is_proto = this.get('is_proto');

					var selected = this.get('selected');
					var selected_indexes = this.get('selected_indexes');
					var proto_selected = this.get('proto_selected');
					var inheritor_selected = this.get('inheritor_selected');

					var fill_color = this.inheritProperty('fill_color');
					var stroke_color = this.inheritProperty('stroke_color');
					var stroke_width = this.inheritProperty('stroke_width');
					var protoNode = this.get('proto_node');

					var rmatrix = this.get('rmatrix');
					var smatrix = this.get('smatrix');
					var tmatrix = this.get('tmatrix');

					var position = this.get('position').toPaperPoint();
					var rotation_origin = this.get('rotation_origin').toPaperPoint();
					var scaling_origin = this.get('scaling_origin').toPaperPoint();


					var scaling_delta = this.inheritProperty('scaling_delta');
					var rotation_delta = this.inheritProperty('rotation_delta');
					var translation_delta = this.inheritProperty('translation_delta');
					if (scaling_delta) {
						smatrix.scale(scaling_delta.x, scaling_delta.y, scaling_origin);
					}
					if (rotation_delta) {
						rmatrix.rotate(rotation_delta, rotation_origin);
					}
					if (translation_delta) {
						tmatrix.translate(translation_delta.toPaperPoint());
					}

					var geom = new paper.Path();

					geom.importJSON(this.inheritProperty('master_path'));


					if (geom) {
						geom.data.instance = this;
						geom.fillColor = fill_color;
						geom.strokeColor = stroke_color;
						geom.strokeWidth = stroke_width;
						geom.visible = true;
						geom.position = position;
						geom.transform(rmatrix);
						geom.transform(smatrix);
						geom.transform(tmatrix);
						var screen_bounds = geom.bounds;
						if (selected_indexes.length === 0) {
							var g_bbox = new paper.Path.Rectangle(geom.bounds.topLeft, new paper.Size(geom.bounds.width, geom.bounds.height));
							g_bbox.data.instance = this;
							var inheritors = this.get('inheritors');
							for (var k = 0; k < inheritors.length; k++) {
								this.updateBoundingBox(inheritors[k]);
							}
							var i_bbox = this.get('i_bbox');
							var gi_bbox;
							if (i_bbox.bottomRight) {
								var width = i_bbox.bottomRight.x - i_bbox.topLeft.x;
								var height = i_bbox.bottomRight.y - i_bbox.topLeft.y;
								gi_bbox = new paper.Path.Rectangle(i_bbox.topLeft, new paper.Size(width, height));
							}



							if (selected) {



								geom.selectedColor = this.get('primary_selection_color');
								geom.selected = selected;

								g_bbox.selectedColor = this.get('primary_selection_color');
								g_bbox.selected = true;
								//draw in bounding box for inheritors
								if (gi_bbox) {
									gi_bbox.selectedColor = this.get('inheritance_selection_color');
									gi_bbox.selected = true;
								}

							} else if (proto_selected) {
								geom.selectedColor = this.get('inheritance_selection_color');
								geom.selected = proto_selected;
							}
							if (inheritor_selected) {
								geom.selectedColor = this.get('proxy_selection_color');
								geom.selected = inheritor_selected;
								g_bbox.selectedColor = this.get('proxy_selection_color');
								g_bbox.selected = true;
								console.log('inheritor_selected for',this.get('id'));
								if (inheritor_selected === 'proxy') {
									console.log('inheritor proxy');
									if (gi_bbox) {
										gi_bbox.selectedColor = this.get('inheritance_selection_color');
										gi_bbox.selected = true;
									}
								}

							}
						} else {
							for (var i = 0; i < selected_indexes.length; i++) {
								geom.segments[selected_indexes[i]].selected = true;
							}
						}
						//screen_bounds.selected = selected;
						this.set({
							screen_position: screen_bounds.topLeft,
							screen_width: screen_bounds.width,
							screen_height: screen_bounds.height,
						});

						this.set('geom', geom);
					}
				}
				this.set('rendered', true);
			}
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


		},

		animateAlpha: function(levels, property, mode, modifier, curlevel) {
			var inheritors = this.get('inheritors');
			var alpha = this.get('alpha');
			var mod = this.get('mod');
			if (alpha < 0.65) {
				mod = 0.01;
			} else if (alpha >= 1) {
				mod = -0.01;
			}
			alpha += mod;
			if (mode === 'proxy') {
				var proto = this.get('proto_node');
				if (proto) {
					proto.set('alpha', alpha);
					proto.get('geom').fillColor.alpha = alpha;
				}
			} else {
				for (var i = 0; i < inheritors.length; i++) {
					var inheritor = inheritors[i];
					if (!inheritor.get(property) || modifier=='override') {
						inheritor.set('alpha', alpha);
						inheritor.get('geom').fillColor.alpha = alpha;
						inheritor.animateAlpha(levels,property,mode,modifier, curlevel+1);
					}
				}
			}
			this.set('mod', mod);
			this.set('alpha', alpha);
		}

	});

	return Instance;



});