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
	'utils/PFloat',
	'utils/PColor',
	'utils/PBool',
	'utils/PConstraint',
	'utils/TrigFunc'
], function(_, $, paper, SceneNode, PPoint, PFloat, PColor, PBool, PConstraint, TrigFunc) {



	var Instance = SceneNode.extend({


		defaults: _.extend({}, SceneNode.prototype.defaults, {

			//selection defaults
			selected: false,
			proto_selected: false,
			inheritor_selected: false,
			ancestor_selected: false,
			selected_indexes: null,

			//bounding box defaults
			bbox: null,
			i_bbox: null,
			inheritorbbox: null,
			width: 0,
			height: 0,
			//screen properies
			screen_position: null,
			screen_width: 0,
			screen_height: 0,

			/*==begin JSON export===*/
			/*constrainable properties to export to JSON*/
			position: null,
			translation_delta: null,
			scaling_origin: null,
			scaling_delta: null,
			rotation_origin: null,
			rotation_delta: null,
			stroke_color: null,
			fill_color: null,
			stroke_width: null,
			master_path: null,
			path_altered: null,

			/*basic datatypes to export to JSON*/
			name: 'instance',
			type: 'instance',
			visible: true,
			closed: false,
			order: 0,

			/*==end JSON export===*/

			//map of constrainable properties
			constrain_map: ['position',
				'translation_delta',
				'scaling_origin',
				'scaling_delta',
				'rotation_origin',
				'rotation_delta',
				'stroke_color',
				'fill_color',
				'stroke_width',
			],

			center: null,
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
			mod: -0.01,
			inheritance_selection_color: '#0D7C1F',
			proxy_selection_color: '#10B0FF',
			primary_selection_color: '#A5FF00',

			// EXPERIMENTAL
			selection_palette: ['#A5FF00', '#0D7C1F', '#FF4D4D', '#33D6FF', '#E698D2'],
			sel_palette_index: 0,

			//no JSON Export required
			matrix_map: {
				translation_delta: {
					name: 'tmatrix',
					properties: {
						x: ['tx'],
						y: ['ty']
					}
				},
				scaling_delta: {
					name: 'smatrix',
					properties: {
						x: ['a'],
						y: ['d']
					}
				},
				rotation_delta: {
					name: 'rmatrix',
					properties: {
						val: ['a', 'b', 'c', 'd']
					}
				}
			}
		}),

		initialize: function() {

			this.set('position', new PPoint(0, 0));
			this.set('center', new PPoint(0, 0));
			this.set('screen_top_left', new PPoint(0, 0));
			this.set('screen_top_right', new PPoint(0, 0));
			this.set('screen_height', new PFloat(0));
			this.set('screen_width', new PFloat(0));
			this.set('screen_bottom_right', new PPoint(0, 0));
			this.set('screen_bottom_left', new PPoint(0, 0));
			this.set('screen_bottom_left', new PPoint(0, 0));
			this.set('screen_left_center', new PPoint(0, 0));
			this.set('screen_right_center', new PPoint(0, 0));
			this.set('screen_top_center', new PPoint(0, 0));
			this.set('screen_bottom_center', new PPoint(0, 0));
			this.set('area', new PFloat(0));
			this.set('scaling_origin', new PPoint(0, 0));
			this.set('rotation_origin', new PPoint(0, 0));
			this.set('alpha', new PFloat(1));
			var translation_delta = new PPoint(0, 0);
			translation_delta.setNull(true);
			this.set('translation_delta', translation_delta);

			var scaling_delta = new PPoint(0, 0);
			scaling_delta.setNull(true);
			this.set('scaling_delta', scaling_delta);

			var rotation_delta = new PFloat(0);
			rotation_delta.setNull(true);
			this.set('rotation_delta', rotation_delta);

			var stroke_color = new PColor(0, 0, 0);
			stroke_color.setNull(true);
			this.set('stroke_color', stroke_color);

			var fill_color = new PColor(0, 0, 0);
			fill_color.setNull(true);
			this.set('fill_color', fill_color);

			var stroke_width = new PFloat(0);
			stroke_width.setNull(true);
			this.set('stroke_width', stroke_width);

			var master_path = new PFloat(0);
			master_path.setNull(true);
			this.set('master_path', master_path);

			this.set('tmatrix', new paper.Matrix());
			this.set('smatrix', new paper.Matrix());
			this.set('inheritors', []);
			this.set('sibling_instances', []);
			this.set('rmatrix', new paper.Matrix());

			var bounds = new paper.Rectangle(0, 0, 1, 1);
			this.set('i_bbox', {
				topLeft: null,
				bottomRight: null,
			});

			var path_altered = new PBool(false);
			path_altered.setNull(true);
			this.set('path_altered', path_altered);

			this.set('id', new Date().getTime().toString());

			this.extend(PConstraint);
			SceneNode.prototype.initialize.apply(this, arguments);
			console.log('to_json:', this.toJSON());
		},


		/* deleteSelf
		 * function called before instance is removed from
		 * scene graph
		 */
		deleteSelf: function() {
			var geom = this.get('geom');
			if (geom) {
				geom.remove();
			}
			for (var i = 0; i < this.children.length; i++) {
				this.children[i].deleteSelf();
				//this.children[i].destroy();
			}
		},

		/*hasMember, getMember, toggleOpen, toggleClosed, addMemberToOpen
		 * evaluation and access functions to assist in managing lists
		 */

		hasMember: function(member) {
			if (member === this) {
				return true;
			}
			return false;
		},

		getMember: function(member) {
			if (member === this) {
				return this;
			}
			return null;
		},

		toggleOpen: function(item) {
			return null;
		},

		toggleClosed: function(item) {
			return null;
		},

		addMemberToOpen: function(data, added_bool) {
			return [];
		},
		recRemoveMember: function(data) {
			return false;
		},

		/* getIndex 
		 * dummy return to prevent error in constraint tool
		 */
		getIndex: function() {
			return 0;
		},

		/*close
		 * used mainly for closing functions
		 */
		close: function() {
			return this.getParentNode();
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
			var position = this.get('position');
			instance.set('position', position.clone());
			instance.set('rotation_origin', position.clone());
			instance.set('scaling_origin', position.clone());
			instance.set('translation_delta', this.get('translation_delta').clone());
			return instance;
		},

		reset: function() {
			this.set('rendered', false);
			this.set('visited', false);

			this.set('i_bbox', {
				topLeft: null,
				bottomRight: null,
			});
			if (this.get('inheritor_bbox')) {
				this.get('inheritor_bbox').remove();
			}

			if (this.get('bbox')) {
				this.get('bbox').remove();
			}

			var rmatrix = this.get('rmatrix');
			var smatrix = this.get('smatrix');
			var tmatrix = this.get('tmatrix');
			this.set('ti_matrix', tmatrix.inverted());
			this.set('ri_matrix', rmatrix.inverted());
			this.set('si_matrix', smatrix.inverted());
			rmatrix.reset();
			smatrix.reset();
			tmatrix.reset();

			this.set('rmatrix', rmatrix);
			this.set('smatrix', smatrix);
			this.set('tmatrix', tmatrix);
		},

		// sets the geom visibility to false
		hide: function() {
			var geom = this.get('geom');
			if (geom) {
				geom.visible = false;
				geom.selected = false;
			}
		},

		show: function() {
			var geom = this.get('geom');
			if (geom) {
				geom.visible = true;
			}
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
				this.get('fill_color').setNull(true);
			}

			if (data.stroke_color) {
				this.get('stroke_color').setNull(true);
			}

			if (data.stroke_width) {
				this.get('stroke_width').setNull(true);
			}
			if (recurse) {
				var inheritors = this.get('inheritors');
				for (var i = 0; i < inheritors.length; i++) {
					inheritors[i].resetStylesToPrototype(data, recurse);
				}
			}
		},


		/*_setPropertiesToInstance
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

		//placeholder function
		deselectSegments: function() {

		},


		/*_setPropertiesToPrototype
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
					this.get('translation_delta').setNull(true);
				}
			}

			if (data.rotation_delta) {
				this.get('rotation_delta').setNull(true);
			}
			if (data.scaling_delta) {
				this.get('scaling_delta').setNull(true);
			}
		},


		toJSON: function() {
			var data = {};

			//loop through defaults to export and call toJSON
			/*for defaults:
				data[default[k]]:default[k].toJSON();
			}*/

		},

		parseJSON: function(data) {
			this.set(data.toJSON);
		},


		/*modifyProperty
		 * called to update the property of an instance
		 * data: defines the property to be modifed, along with the
		 * new values
		 * mode: proxy or standard: determines what is being updated (prototype or object)
		 * modifer: overide or relative: determines how the updates should be implemented
		 */
		modifyProperty: function(data, mode, modifier) {
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
					if (this.has(p)) {

						var property = this.get(p);
						property.setNull(false);
						property.modifyProperty(data_property);
						//check to make sure rotation is between 0 and 360
						if (p == 'rotation_delta') {
							if (property.getValue() > 360 || property.getValue() < 0) {
								property.setValue(TrigFunc.wrap(property.getValue(), 0, 360));
							}
						}
						this.set(p, property);
						this.trigger('change:' + p);
					}
				}
			}
		},

		/*inheritProperty
		 * moves up the prototype chain to find the
		 * appropriate property reference and returns it
		 * note: returns a reference, not ACTUAL VALUE.
		 * To access property value call accessProperty (below)
		 */

		inheritProperty: function(property_name) {
			if (!this.get(property_name).isNull()) {
				var property = this.get(property_name);
				return property;
			} else {
				if (this.has('proto_node')) {
					if (property_name === 'path_altered') {}
					return this.get('proto_node').inheritProperty(property_name);
				}
			}
			return null;
		},

		activateProperty: function(property_name) {
			this.get(property_name).setNull(false);
			return this.get(property_name);
		},


		/* accessProperty
		 * returns the actual value for a given property by first
		 *finding it in the inheritance chain and then checking the constraint
		 * to return the appropriate value
		 */
		accessProperty: function(property_name) {

			var property = this.inheritProperty(property_name);
			if (property) {
				return property.getValue();
			} else {
				return null;
			}


		},


		/* isConstrained
		 * returns object with booleans for each property based on constraint status
		 */
		isConstrained: function() {
			var constrainMap = this.get('constrainMap');
			var data = {};
			data.self = this.isSelfConstrained();
			for (var i = 0; i < constrainMap.length; i++) {
				data[constrainMap[i]] = this.get(constrainMap[i]).isConstrained();
			}
			return data;
		},

		/* getConstraint
		 * returns true if constraint exists
		 * false if not
		 */
		getConstraint: function() {
			var constrainMap = this.get('constrain_map');
			var data = {};
			data.self = this.getSelfConstraint();
			for (var i = 0; i < constrainMap.length; i++) {
				data[constrainMap[i]] = this.get(constrainMap[i]).getConstraint();
			}
			return data;
		},


		setValue: function(data) {
			for (var prop in data) {
				if (data.hasOwnProperty(prop)) {
					this.get(prop).modifyProperty(data[prop]);
				}
			}
		},

		getValue: function() {
			console.log('getting value for',this.get('type'),this.get('name'));
			var constrainMap = this.get('constrain_map');
			var data = {};
			if (!this.isSelfConstrained()) {
				for (var i = 0; i < constrainMap.length; i++) {
					var prop = this.inheritProperty(constrainMap[i]);
					var c = prop.getConstraint();
					if (c.self) {
						data[constrainMap[i]] = c.self.getValue();
					} else {
						for (var p in c) {
							if (p !== 'self' && c[p]) {
								data[constrainMap[i]][p] = c[p];
							}
						}
					}

				}
			} else {
				return this.getSelfConstraint.getValue();

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
			var alpha;
			var proto = this.get('proto_node');
			if (proto) {
				if (!select) {
					proto.set('inheritor_selected', false);
					proto.setSelectionForInheritors(false);
				} else {
					if (recurse > 0) {
						if (mode === 'proxy') {
							proto.set('inheritor_selected', 'proxy');

						} else {
							proto.set('inheritor_selected', 'standard');
							alpha = proto.get('alpha');
							alpha.setValue(1);
							proto.set('alpha', alpha);
						}
					} else {
						proto.set('inheritor_selected', false);
						alpha = proto.get('alpha');
						alpha.setValue(1);
						proto.set('alpha', alpha);
					}
					proto.setSelectionForInheritors(select, 'standard', 'none', 0);
				}

			}

			for (var i = 0; i < inheritors.length; i++) {
				inheritors[i].set('proto_selected', select);
				alpha = inheritors[i].get('alpha');
				alpha.setValue(1);
				inheritors[i].set('alpha', alpha);
			}
		},

		updateBoundingBox: function(instance) {
			if (instance.get('screen_top_left') && instance.get('screen_bottom_right')) {
				var i_bbox = this.get('i_bbox');
				var i_topLeft = instance.get('screen_top_left').getValue();
				var i_bottomRight = instance.get('screen_bottom_right').getValue();

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

		getSelectionColor: function() {
			var color_palette = this.get('selection_palette');
			var color_ind = this.get('sel_palette_index');
			return color_palette[color_ind];
		},


		/* compile
		computes the current properties of the instance given current 
		constraints and inheritance */
		compile: function() {
			this.getValue();
			this.compileTransforms();
		},

		compileTransforms: function() {
			var rmatrix = this.get('rmatrix');
			var smatrix = this.get('smatrix');
			var tmatrix = this.get('tmatrix');

			var rotation_origin = this.get('rotation_origin').toPaperPoint();
			var scaling_origin = this.get('scaling_origin').toPaperPoint();


			var scaling_delta = this.accessProperty('scaling_delta');
			var rotation_delta = this.accessProperty('rotation_delta');
			var translation_delta = this.inheritProperty('translation_delta');

			if (rotation_delta) {
				rmatrix.rotate(rotation_delta, rotation_origin);
			}
			if (scaling_delta) {
				smatrix.scale(scaling_delta.x, scaling_delta.y, scaling_origin);
			}
			if (translation_delta) {
				tmatrix.translate(translation_delta.toPaperPoint());
			}

		},

		/*render
		 * draws instance on canvas
		 */
		render: function() {
			if (!this.get('rendered')) {
				if (this.get('name') != 'root') {
					var geom = this.renderGeom();
					if (geom) {
						this.renderStyle(geom);
						this.renderSelection(geom);
					}

					this.set('rendered', true);

				}
				return 'root';
			}
		},


		renderStyle: function(geom) {
			var fill_color = this.inheritProperty('fill_color').toPaperColor();
			var stroke_color = this.inheritProperty('stroke_color').toPaperColor();
			var stroke_width = this.accessProperty('stroke_width');
			geom.fillColor = fill_color;
			geom.strokeColor = stroke_color;
			geom.strokeWidth = stroke_width;
			geom.visible = true;
		},

		renderBoundingBox: function(geom) {
			if (this.get('bbox')) {
				this.get('bbox').remove();
			}
			var size = new paper.Size(geom.bounds.width, geom.bounds.height);
			var bbox = new paper.Path.Rectangle(geom.bounds.topLeft, size);
			bbox.data.instance = this;
			this.set('bbox', bbox);
			bbox.sendToBack();
			return bbox;
		},

		renderInheritorBoundingBox: function(geom) {
			if (this.get('inheritor_bbox')) {
				this.get('inheritor_bbox').remove();
			}
			var inheritors = this.get('inheritors');
			for (var k = 0; k < inheritors.length; k++) {
				this.updateBoundingBox(inheritors[k]);
			}
			var i_bbox = this.get('i_bbox');
			if (i_bbox.bottomRight) {
				var width = i_bbox.bottomRight.x - i_bbox.topLeft.x;
				var height = i_bbox.bottomRight.y - i_bbox.topLeft.y;
				var inheritor_bbox = new paper.Path.Rectangle(i_bbox.topLeft, new paper.Size(width, height));
				this.set('inheritor_bbox', inheritor_bbox);
				return inheritor_bbox;
			}
		},

		renderSelection: function(geom) {
			var selected = this.get('selected');
			var proto_selected = this.get('proto_selected');
			var inheritor_selected = this.get('inheritor_selected');
			var bbox, inheritor_bbox;
			//if (selected_indexes.length === 0) {
			geom.selected = selected;

			if (selected) {
				// EXPERIMENTAL
				// geom.selectedColor = this.get('primary_selection_color');
				geom.selectedColor = this.getSelectionColor();

				// g_bbox.selectedColor = this.get('primary_selection_color');
				bbox = this.renderBoundingBox(geom);
				bbox.selectedColor = this.getSelectionColor();
				bbox.selected = true;


				inheritor_bbox = this.renderInheritorBoundingBox();
				if (inheritor_bbox) {
					inheritor_bbox.selectedColor = this.get('inheritance_selection_color');
					inheritor_bbox.selected = true;
				}

			} else if (proto_selected) {
				geom.selectedColor = this.get('inheritance_selection_color');
				geom.selected = proto_selected;
			}
			if (inheritor_selected) {
				geom.selectedColor = this.get('proxy_selection_color');
				geom.selected = inheritor_selected;
				bbox = this.renderBoundingBox(geom);
				bbox.selectedColor = this.get('proxy_selection_color');
				bbox.selected = true;
				if (inheritor_selected === 'proxy') {
					if (!inheritor_bbox) {
						inheritor_bbox = this.renderInheritorBoundingBox();
					}
					if (inheritor_bbox) {
						inheritor_bbox.selectedColor = this.get('inheritance_selection_color');
						inheritor_bbox.selected = true;
					}
				}

			}
			/*}else {
				for (var i = 0; i < selected_indexes.length; i++) {
					geom.segments[selected_indexes[i]].selected = true;
				}
			}*/


		},


		renderGeom: function() {
			var visible = this.get('visible');
			var geom = this.get('geom');


			var rmatrix = this.get('rmatrix');
			var smatrix = this.get('smatrix');
			var tmatrix = this.get('tmatrix');

			var path_altered = this.get('path_altered').getValue();
			if (!path_altered && geom) {
				geom.transform(this.get('ti_matrix'));
				geom.transform(this.get('ri_matrix'));
				geom.transform(this.get('si_matrix'));
				geom.selected = false;
			} else {
				if (!geom) {
					geom = new paper.Path();
				}
				geom.importJSON(this.accessProperty('master_path'));
			}
			geom.data.instance = this;


			var position = this.get('position').toPaperPoint();
			geom.position = position;
			geom.transform(smatrix);
			geom.transform(rmatrix);
			geom.transform(tmatrix);

			this.updateScreenBounds(geom);
			this.set('geom', geom);
			var p_altered = this.get('path_altered');
			p_altered.setValue(false);
			this.set('path_altered', p_altered);
			geom.visible = visible;
			return geom;

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

		animateAlpha: function(levels, property, mode, modifier, curlevel) {
			var inheritors = this.get('inheritors');
			var alpha = this.get('alpha');
			var mod = this.get('mod');
			if (alpha.getValue() < 0.65) {
				mod = 0.01;
			} else if (alpha.getValue() >= 1) {
				mod = -0.01;
			}

			alpha.add(mod);

			if (mode === 'proxy') {
				var proto = this.get('proto_node');
				if (proto) {
					proto.set('alpha', alpha.clone());
					proto.get('geom').fillColor.alpha = alpha.getValue();
				}
			} else {
				for (var i = 0; i < inheritors.length; i++) {
					var inheritor = inheritors[i];
					if (inheritor.get(property).isNull() || modifier != 'none') {
						inheritor.set('alpha', alpha.clone());
						inheritor.get('geom').fillColor.alpha = alpha.getValue();
						inheritor.animateAlpha(levels, property, mode, modifier, curlevel + 1);
					}
				}
			}
			this.set('mod', mod);
			this.set('alpha', alpha);
		},

		updateScreenBounds: function(targetGeom) {
			var screen_bounds = targetGeom.bounds;
			var center = this.get('center');
			center.setValue(screen_bounds.center);
			this.get('screen_top_left').setValue(screen_bounds.topLeft);
			this.get('screen_top_right').setValue(screen_bounds.topRight);
			this.get('screen_bottom_right').setValue(screen_bounds.bottomRight);
			this.get('screen_bottom_left').setValue(screen_bounds.bottomLeft);
			this.get('screen_left_center').setValue(screen_bounds.leftCenter);
			this.get('screen_right_center').setValue(screen_bounds.rightCenter);
			this.get('screen_bottom_center').setValue(screen_bounds.bottomCenter);
			this.get('screen_top_center').setValue(screen_bounds.topCenter);
			this.get('area').setValue(screen_bounds.area);
			this.get('screen_width').setValue(screen_bounds.width);
			this.get('screen_height').setValue(screen_bounds.height);
		}

	});

	return Instance;



});