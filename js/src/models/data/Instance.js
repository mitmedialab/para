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
	'cjs'
], function(_, $, paper, SceneNode, PPoint, cjs) {


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
			translation_deltaX: null,
			translation_deltaY: null,
			center: null,
			scaling_origin: null,
			scaling_deltaX: null,
			scaling_deltaY: null,
			rotation_origin: null,
			rotation_delta: null,

			//screen properies
			screen_position: null,
			screen_width: 0,
			screen_height: 0,

			stroke_colorR: null,
			stroke_colorG: null,
			stroke_colorB: null,
			stroke_colorA: null,
			fill_colorR: null,
			fill_colorG: null,
			fill_colorB: null,
			fill_colorA: null,
			stroke_width: null,

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

			var inheritors = this.get('inheritors');
			instance.set('proto_node', this);
			inheritors.push(instance);
			this.set('inheritors', inheritors);
			 instance.set('position', {
              operator: 'set',
              val: this.get('position').val.clone()
            });
            instance.set('rotation_origin', {
              operator: 'set',
              val: this.get('position').val.clone()
            });
            instance.set('scaling_origin', {
              operator: 'set',
              val: this.get('position').val.clone()
            });
            instance.set('translation_deltaX', {
              operator: 'add',
              val: cjs({
                _var: 0
              })
            });
            instance.set('translation_deltaY', {
              operator: 'add',
              val: cjs({
                _var: 0
              })
            });
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

		setConstraint: function(property_name, func) {
			/*	var property = this.get(property_name);

				var rot_var = instance.get('rotation_constraint');
				if (!rot_var) {
					rot_var = cjs(instance.get('rotation_delta').get());
				} //cjs(instance.get('rotation_delta').get());
				var rotation_delta = cjs(function() {
					return rot_var.get();
				});
				this.set('rotation_delta', rotation_delta);
				this.set('rotation_constraint', rot_var);
				instance.set('rotation_constraint', rot_var);
				instance.set('rotation_delta', rotation_delta);*/

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
		_setPropertiesToInstance: function(data, instance) {
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
		_setPropertiesToPrototype: function(data) {
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
			data.rotation_delta = {
				operator: 'add',
				val: cjs({_var:matrix.rotation})
			};
			data.scaling_deltaX = {
				operator: 'add',
				val: cjs({_var:matrix.scaling.x})
			};
			data.scaling_deltaY = {
				operator: 'add',
				val: cjs({_var:matrix.scaling.y})
			};
			data.translation_deltaX = {
				operator: 'add',
				val: cjs({_var:0})
			};
			data.translation_deltaY = {
				operator: 'add',
				val: cjs({_var:0})
			};
			//data.translation_delta = new PPoint(matrix.translation.x, matrix.translation.y);
			data.position = {
				operator: 'set',
				val: new PPoint(matrix.translation.x, matrix.translation.y)
			};
			data.rotation_origin = {
				operator: 'set',
				val: new PPoint(matrix.translation.x, matrix.translation.y)
			};
			data.scaling_origin = {
				operator: 'set',
				val: new PPoint(matrix.translation.x, matrix.translation.y)
			};
			data.fill_colorR = {
				operator: 'set',
				val: cjs({_var:path.fillColor.red})
			};
			data.fill_colorG = {
				operator: 'set',
				val: cjs({_var:path.fillColor.green})
			};
			data.fill_colorB = {
				operator: 'set',
				val: cjs({_var:path.fillColor.blue})
			};
			data.fill_colorA = {
				operator: 'set',
				val: cjs({_var:path.fillColor.alpha})
			};
			data.stroke_colorR = {
				operator: 'set',
				val: cjs({_var:path.strokeColor.red})
			};
			data.stroke_colorG = {
				operator: 'set',
				val: cjs({_var:path.strokeColor.green})
			};
			data.stroke_colorB = {
				operator: 'set',
				val: cjs({_var:path.strokeColor.blue})
			};
			data.stroke_colorA = {
				operator: 'set',
				val: cjs({_var:path.strokeColor.alpha})
			};
			data.stroke_width = {
				operator: 'set',
				val: cjs({_var:path.strokeWidth})
			};
			data.width = {
				operator: 'add',
				val: cjs({_var:path.bounds.width})
			};
			data.height = {
				operator: 'add',
				val: cjs({_var:path.bounds.height})
			};
			var imatrix = matrix.inverted();
			path.transform(imatrix);
			path.visible = false;
			path.selected = false;
			path.data.nodetype = this.get('name');
			var pathJSON = path.toJSON();
			this.set('master_path', {
				operator: 'add',
				val: pathJSON
			});
			var path_deltas = [];
			for (var i = 0; i < path.segments.length; i++) {
				path_deltas.push(new PPoint(0, 0));
			}
			this.set('path_deltas', path_deltas);
			path.remove();
			return data;
		},


		modifyProperty: function(data, mode, modifier) {
			var matrix = this.get('matrix');
			var proto_incremented = false;
			var protoNode = this.get('proto_node');
			var inheritors = this.get('inheritors');
			if (mode === 'proxy') {
				if (protoNode) {
					if (modifier === 'override') {
						protoNode._setPropertiesToInstance(data, this);
					}
					protoNode.modifyProperty(data, 'standard', 'none');
					proto_incremented = true;
				}
			} else if (mode === 'standard') {
				if (modifier === 'override') {
					for (var j = 0; j < inheritors.length; j++) {
						inheritors[j]._setPropertiesToPrototype(data);
					}
				} else if (modifier === 'relative') {
					for (var i = 0; i < inheritors.length; i++) {
						inheritors[i].modifyProperty(data, 'standard', 'none');
					}

				}
			}
			for (var p in data) {
				if (data.hasOwnProperty(p)) {
					var data_property = data[p];
					var property;
					if (this.has(p)) {
						property = this.get(p);
					} else {
						property = {
							val: cjs({
								'_var': 0
							}),
							operator: data_property.operator
						};
					}
					if (data_property.operator === 'set') {
						property.val.put('_var' , data_property.val);
					} else if (data_property.operator === 'add') {
						var cValue = property.val.get('_var');
						property.val.put('_var', cValue + data_property.val);
					}
					this.set(p,property);
				}

			}


		},

		/*inheritProperty
		 * checks first to see if there is a scaling prototype
		 * moves up the prototype chain to find the
		 * relevant scaling for this node and applies it to the matrix
		 */
		inheritProperty: function(property) {
			if (this.get(property)) {
				var property_constraint = this.get(property).val;
				if (!property_constraint.get) {
					return property_constraint;
				} else {
					if (property_constraint.get('_constraint')) {
						return property_constraint.get('_constraint');
					} else {
						return property_constraint.get('_var');
					}
				}
			} else {
				if (this.has('proto_node')) {
					return this.get('proto_node').inheritProperty(property);
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



		/* setSelectionForInheritors
		 * toggles selection mode for objects which inherit
		 * from this. Optionally also toggles selection for all
		 * ancestors.
		 */
		setSelectionForInheritors: function(select, mode, modifer, recurse) {
			var inheritors = this.get('inheritors');

			var proto = this.get('proto_node');
			if (proto) {
				if (!select) {
					proto.set('inheritor_selected', false);
					proto.setSelectionForInheritors(false);
				} else {
					if (recurse > 0) {
						if (mode === 'proxy') {
							proto.set('inheritor_selected', 'proxy');
							console.log('set inheritor selected to proxy');

						} else {
							proto.set('inheritor_selected', 'standard');
							proto.set('alpha', 1);
							console.log('set alpha to 1 for proto');
						}
					} else {
						proto.set('inheritor_selected', false);
						proto.set('alpha', 1);
					}
					proto.setSelectionForInheritors(select, 'standard', 'none', 0);
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

					var fill_color = new paper.Color(this.inheritProperty('fill_colorR'), this.inheritProperty('fill_colorG'), this.inheritProperty('fill_colorB'));
					var stroke_color = new paper.Color(this.inheritProperty('stroke_colorR'), this.inheritProperty('stroke_colorG'), this.inheritProperty('stroke_colorB'));
					var stroke_width = this.inheritProperty('stroke_width');
					var protoNode = this.get('proto_node');

					var rmatrix = this.get('rmatrix');
					var smatrix = this.get('smatrix');
					var tmatrix = this.get('tmatrix');

					var position = this.get('position').val.toPaperPoint();
					var rotation_origin = this.get('rotation_origin').val.toPaperPoint();
					var scaling_origin = this.get('scaling_origin').val.toPaperPoint();


					var scaling_deltaX = this.inheritProperty('scaling_deltaX');
					var scaling_deltaY = this.inheritProperty('scaling_deltaY');
					var rotation_delta = this.inheritProperty('rotation_delta');
					var translation_deltaX = this.inheritProperty('translation_deltaX');
					var translation_deltaY = this.inheritProperty('translation_deltaY');


					if (rotation_delta) {
						rmatrix.rotate(rotation_delta, rotation_origin);
					}
					if (scaling_deltaX) {
						smatrix.scale(scaling_deltaX, scaling_deltaY, scaling_origin);
					}
					if (translation_deltaX) {
						tmatrix.translate(new paper.Point(translation_deltaX, translation_deltaY));
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
						geom.transform(smatrix);
						geom.transform(rmatrix);
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
								if (inheritor_selected === 'proxy') {
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
					if (!inheritor.get(property) || modifier != 'none') {
						inheritor.set('alpha', alpha);
						inheritor.get('geom').fillColor.alpha = alpha;
						inheritor.animateAlpha(levels, property, mode, modifier, curlevel + 1);
					}
				}
			}
			this.set('mod', mod);
			this.set('alpha', alpha);
		}

	});

	return Instance;



});