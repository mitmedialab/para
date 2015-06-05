/*Instance.js
 * used to store references of a shape object
 *
 */

define([
	'underscore',
	'jquery',
	'paper',
	'models/data/SceneNode',
	'models/data/InheritorCollection',

	'utils/PPoint',
	'utils/PFloat',
	'utils/PColor',
	'utils/PBool',
	'utils/PProperty',
	'utils/PConstraint',
	'utils/TrigFunc',
	'utils/ColorUtils'
], function(_, $, paper, SceneNode, InheritorCollection, PPoint, PFloat, PColor, PBool, PProperty, PConstraint, TrigFunc, ColorUtils) {


	var exporting_properties = ['position', 'translation_delta', 'scaling_origin', 'scaling_delta', 'rotation_origin',
		'rotation_delta', 'stroke_color', 'fill_color', 'stroke_width', 'val', 'name', 'type', 'visible', 'closed', 'order', 'id'
	];

	var constraints = ['position', 'translation_delta', 'scaling_origin', 'scaling_delta', 'rotation_origin',
		'rotation_delta', 'stroke_color', 'fill_color', 'stroke_width', 'val'
	];

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
			path_altered: null,
			val: null,

			/*basic datatypes to export to JSON*/
			name: 'instance',
			type: 'instance',
			visible: true,
			closed: false,
			order: 0,
			/*==end JSON export===*/

			//map of constrainable properties
			constrain_map: {
				position: ['x', 'y'],
				translation_delta: ['x', 'y'],
				scaling_origin: ['x', 'y'],
				scaling_delta: ['x', 'y'],
				rotation_origin: ['val'],
				rotation_delta: ['x', 'y'],
				stroke_color: ['r', 'g', 'b', 'a'],
				fill_color: ['r', 'g', 'b', 'a'],
				stroke_width: ['val'],
				//inheritors: []
			},

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
			this.set('sibling_instances', []);
			this.set('inheritors', new InheritorCollection(this));
			this.get('inheritors').setNull(false);
			this.set('val', new PProperty(0));


			//============private properties==============//

			//inverse transformation matricies
			this._ti_matrix = undefined;
			this._si_matrix = undefined;
			this._ri_matrix = undefined;

			this._itemp_matrix = undefined;
			this._temp_matrix = new paper.Matrix();

			//temporary attributes
			this._translation_delta = new paper.Matrix();
			this._rotation_delta = new paper.Matrix();
			this._scaling_delta = new paper.Matrix();
			this._fill_color = {
				r: undefined,
				g: undefined,
				b: undefined,
				a: undefined
			};
			this._stroke_color = {
				r: undefined,
				g: undefined,
				b: undefined,
				a: undefined
			};

			this._stroke_width = undefined;
			this._rotation_origin = undefined;
			this._scaling_origin = undefined;
			this._position = undefined;
			this._visible = undefined;

			//============ end private properties==============//


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
			this.on('change:selected', this.selectionChange);
			this.isReturned = false;

			var parent = this;
			_.each(this.attributes, function(val, key) {
				if (val instanceof PConstraint) {
					parent.listenTo(val, 'modified', parent.propertyModified);
				}
			});

		},

		checkChange: function() {
			console.log('selection change', this.get('selected'));
			console.trace();
		},

		/* deleteSelf
		 * function called before instance is removed from
		 * scene graph
		 */
		deleteSelf: function() {
			this.reset();
			var geom = this.get('geom');
			if (geom) {
				geom.remove();
			}
			for (var i = 0; i < this.children.length; i++) {
				this.children[i].deleteSelf();
				//this.children[i].destroy();
			}
			var parent = this.getParentNode();
			if (parent) {
				parent.removeChildNode(this);
			}
			this.trigger('delete', this);
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

			var position = this.get('position');
			instance.get('position').setValue(position.clone().getValue());
			instance.get('rotation_origin').setValue(position.clone().getValue());
			instance.get('scaling_origin').setValue(position.clone().getValue());
			instance.get('translation_delta').setValue(this.get('translation_delta').getValue());
			this.addInheritor(instance);
			this.addChildNode(instance);
			return instance;
		},

		addInheritor: function(instance) {
			var inheritorCollection = this.get('inheritors');
			instance.set('proto_node', this);
			inheritorCollection.addInheritor(instance);
			instance.reset();
			var g_clone = this.get('geom').clone();
			g_clone.transform(this._ti_matrix);
			g_clone.transform(this._ri_matrix);
			g_clone.transform(this._si_matrix);
			instance.changeGeomInheritance(g_clone);
			this.addChildNode(instance);
		},

		changeGeomInheritance: function(geom) {
			if (this.get('geom')) {
				this.get('geom').remove();
			}
			geom.data.instance = this;
			geom.data.geom = true;
			geom.data.nodetype = this.get('name');
			this.set('geom', geom);
			for (var i = 0; i < this.children.length; i++) {
				if (this.children[i].get('name') === 'point') {
					this.children[i].deleteSelf();
				} else {
					this.children[i].changeGeomInheritance(geom.clone());
				}

			}
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

			this._ti_matrix = this._translation_delta.inverted();
			this._ri_matrix = this._rotation_delta.inverted();
			this._si_matrix = this._scaling_delta.inverted();
			this._itemp_matrix = this._temp_matrix.inverted();
			this._temp_matrix.reset();
			this._translation_delta.reset();
			this._scaling_delta.reset();
			this._rotation_delta.reset();
		},


		//triggered on change of select property, removes bbox
		selectionChange: function() {
			if (!this.get('selected')) {
				if (this.get('bbox')) {
					this.get('bbox').remove();
				}
			}
		},

		// sets the geom visibility to false
		hide: function() {
			this.set('visible', false);
			this.set('selected', false);
			this.get('geom').visible = false; // hacky
		},

		show: function() {
			this.set('visible', true);
			this.get('geom').visible = true;


		},

		hideChildren: function() {
			this.hide();

			for (var i = 0; i < this.children.length; i++) {
				this.children[i].hideChildren();
			}
		},

		showChildren: function() {
			this.set('visible', true);
			for (var i = 0; i < this.children.length; i++) {
				this.children[i].showChildren();
			}
		},

		bringToFront: function() {
			var geom = this.get('geom');
			if (geom) {
				geom.bringToFront();
			}
		},

		resetProperties: function() {
			this.clear().set(this.defaults);
			this.get('position').setValue({
				x: 0,
				y: 0
			});
			this.get('translation_delta').setValue({
				x: 0,
				y: 0
			});
			this.get('center').setValue({
				x: 0,
				y: 0
			});
			this.get('scaling_origin').setValue({
				x: 0,
				y: 0
			});
			this.get('rotation_origin').setValue({
				x: 0,
				y: 0
			});
			this.get('matrix').reset();
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
				this.get('translation_delta').setValue(instance.get('translation_delta').getValue());
			}

			if (data.rotation_delta) {
				this.get('rotation_delta').setValue(instance.get('rotation_delta').getValue());

			}
			if (data.scaling_delta) {
				this.get('scaling_delta').setValue(instance.get('scaling_delta').getValue());

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
			var target = this;
			_.each(exporting_properties, function(property) {
				if (_.contains(constraints, property)) {
					data[property] = target.get(property).toJSON();

				} else {

					data[property] = target.get(property);
				}
			});
			return data;

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
		 * should only be called by tool classes
		 */
		modifyProperty: function(data, mode, modifier) {
			var proto_incremented = false;
			var protoNode = this.get('proto_node');
			var inheritors = this.get('inheritors').accessProperty();
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

			var constrained_props = this.getValue();
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
						if (constrained_props) {
							if (_.has(constrained_props, p)) {
								var d = TrigFunc.merge(property.getValue(), constrained_props[p]);
								property.setValue(d);
							}
						}

						this.trigger('change:' + p);

					}
				}
			}
		},

		propertyModified: function(event) {
			this.trigger('modified', this);
		},

		activateProperty: function(property_name) {
			this.get(property_name).setNull(false);
			return this.get(property_name);
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

		/* accessProperty
		 * returns the actual value for a given property by first
		 *finding it in the inheritance chain and then checking the constraint
		 * to return the appropriate value
		 */
		accessProperty: function(property_name) {
			if (this.isSelfConstrained()) {
				this.getValue();
			}
			var property = this.inheritProperty(property_name);
			if (property) {
				return property.getValue();
			} else {
				return null;
			}


		},

		_modifyAfterCompile: function(property_name, value, set, origin) {
			var constraint = this.getConstraint();
			var internal_property = "_".concat(property_name);
			var attribute_constraint = constraint[property_name];
			//entire instance is constrained, no modification allowed
			if (constraint['self']) {
				return false;
			}
			//attribute is not constrained modification allowed
			else {

				if (this[internal_property] instanceof paper.Matrix) {
					return this._modifyMatrixAfterCompile(property_name, this[internal_property], attribute_constraint, value, set,origin);
				} else if (this[internal_property] instanceof Number) {
					return this._modifyValueAfterCompile(this[internal_property], attribute_constraint, value, set);
				} else if (this[internal_property] instanceof Object) {
					return this._modifyObjectAfterCompile(this[internal_property], attribute_constraint, value, set);

				}
			}
			return false;
		},

		_modifyMatrixAfterCompile: function(property_name, internal_matrix, attribute_constraint, value, set, origin) {
			//attribute is not constrained, modification allowed
			console.log('modify matrix', property_name,attribute_constraint);

			//attribute sub properties are constrained, selective modification allowed;
			
			switch (property_name) {
				case 'translation_delta':
					console.log('modify_translation', property_name, value.translation);
					if (!attribute_constraint) {
						if (set) {
							internal_matrix.tx = (value.translation) ? 0 : internal_matrix.tx;
							internal_matrix.ty = (value.translation) ? 0 : internal_matrix.ty;
						}
						if (value.translation) {
							internal_matrix.translate(value.translation.x, value.translation.y);
							return true;
						}
						return false;

					} 
					else if (attribute_constraint && attribute_constraint.x && attribute_constraint.y) {
						console.log('object is completely constrained');
						return false;
					} 
					else if (attribute_constraint.x && !attribute_constraint.y) {
						console.log('object is only x constrained');

						if (set) {
							internal_matrix.ty = (value.translation) ? 0 : internal_matrix.ty;
						}
						internal_matrix.translate(0, value.translation.y);
						return true;
					} else if (!attribute_constraint.x && attribute_constraint.y) {
						console.log('object is only y constrained');
						if (set) {
							internal_matrix.tx = (value.translation) ? 0 : internal_matrix.tx;
						}
						if (value.translation) {
							internal_matrix.translate(value.translation.x, 0);
							return true;
						}
						return false;
					}
					break;
				case 'scaling_delta':
					var s_origin = (origin) ? origin : this._scaling_origin;
					if (!attribute_constraint) {
						if (set) {
							internal_matrix.d = (value.scaling) ? 0 : internal_matrix.d;
							internal_matrix.a = (value.scaling) ? 0 : internal_matrix.a;
						}
						if (value.scaling) {
							internal_matrix.scale(value.scaling.x, value.scaling.y, s_origin);
							return true;
						}
						return false;

					}
					else if (attribute_constraint  && attribute_constraint.x && attribute_constraint.y) {
						return false;
					}  
					else if (attribute_constraint.x && !attribute_constraint.y) {
						if (set) {
							internal_matrix.d = (value.scaling) ? 0 : internal_matrix.d;
						}
						if (value.scaling) {
							internal_matrix.scale(1, value.scaling.y, s_origin);
							return true;
						}
						return false;
					} else if (!attribute_constraint.x && attribute_constraint.y) {
						if (set) {
							internal_matrix.a = (value.scaling) ? 0 : internal_matrix.a;
						}
						if (value.scaling) {
							internal_matrix.scale(value.scaling.x, 1, s_origin);
							return true;
						}
						return false;
					}
					break;
				case 'rotation_delta':
					var r_origin = (origin) ? origin : this._rotation_origin;
					console.log('r_origin', r_origin, 'origin', origin, 'rotation_origin', this._rotation_origin);
					if (attribute_constraint) {
						return false;
					} else {
						if (set) {
							internal_matrix.a = (value.rotation) ? 0 : internal_matrix.a;
							internal_matrix.b = (value.rotation) ? 0 : internal_matrix.b;
							internal_matrix.c = (value.rotation) ? 0 : internal_matrix.c;
							internal_matrix.d = (value.rotation) ? 0 : internal_matrix.d;
						}
						internal_matrix.rotate(value.rotation, r_origin);
						return true;
					}
					break;


			}

			return false;

		},

		_modifyObjectAfterCompile: function(internal_attribute, attribute_constraint, value, set) {
			//attribute is not constrained, modification allowed
			if (!attribute_constraint) {
				for (var v in value) {
					if (value.hasOwnProperty(v)) {
						internal_attribute[v] = value[v];
					}
				}
				return true;
			}
			//attribute sub properties are constrained, selective modification allowed;
			else {
				var modified = false;
				for (var _v in value) {
					if (value.hasOwnProperty(_v)) {
						if (!attribute_constraint.hasOwnProperty(_v)) {
							internal_attribute[_v] = value[_v];
							modified = true;
						}
					}
				}
				return modified;
			}
			return false;

		},

		_modifyValueAfterCompile: function(internal_attribute, value, set) {

		},


		/* getConstraint
		 * returns an object comprised of all existing constraints in one of 3 states:
		 *
		 * 1) if entire instance is constrained by a function returns {self: constraint_obj}
		 *
		 * 2) if some of the attributes of the instance are constrainted, returns an object with a
		 * list of the currently constrained attributes of this instance, with references to these
		 * constraints eg {translation_delta:{x:constraint_obj},rotation_delta:{self:constraint_obj}}
		 * note: these objects will either contain 1 property "self", meaning that the entire attribute
		 * is constrained, or several properties reflecting the sub-attribuites of the instance attribute which are constrained
		 *
		 * 3) if there are no constraints on the instance, returns an empty object
		 *
		 */
		getConstraint: function() {
			var constrainMap = this.get('constrain_map');
			var data = {};
			var self = this.getSelfConstraint();
			if (self) {
				data.self = self;
			} else {
				for (var propertyName in constrainMap) {
					if (constrainMap.hasOwnProperty(propertyName)) {
						var constraints = this.get(propertyName).getConstraint();
						if (constraints.self) {
							data[propertyName] = {
								self: constraints.self
							};
						} else {
							for (var cProp in constraints) {
								if (constraints.hasOwnProperty(cProp)) {
									if (!constraints[cProp]) {
										delete constraints[cProp];
									}
								}
							}
							if (Object.keys(constraints).length > 0) {
								data[propertyName] = constraints;
							}
						}
					}
				}
			}
			return data;

		},

		/*setValue
		 * modifies the properties of this instance in accordance with the
		 * data passed in
		 * note- in future should unifiy this with the modify property function?
		 */
		setValue: function(data) {
			for (var prop in data) {
				if (data.hasOwnProperty(prop)) {

					var p = data[prop];
					if (typeof data[prop] !== 'object') {
						p = {
							val: data[prop]
						};
					}
					p.operator = 'set';
					this.get(prop).modifyProperty(p);
				}
			}
		},


		/* getValue
		 * returns an object containing all constrained properties of
		 * this instance
		 */
		getValue: function() {
			var constrainMap = this.get('constrain_map');
			var data = {};
			var isSelfConstrained = this.isSelfConstrained();
			var constraintCalled = false;
			if (this.reference) {
				constraintCalled = this.reference.get('called');
			}
			if (isSelfConstrained && constraintCalled) {
				var constraint = this.getSelfConstraint().getValue();
				return constraint;

			} else {
				for (var i = 0; i < constrainMap.length; i++) {
					var prop = this.inheritProperty(constrainMap[i]);
					if (prop) {
						var c = prop.getConstraint();
						if (c.self) {
							data[constrainMap[i]] = c.self.getValue();
						} else {
							data[constrainMap[i]] = {};
							for (var p in c) {
								if (p !== 'self' && c[p]) {
									data[constrainMap[i]][p] = c[p].getValue();
								}
							}
							if (_.isEmpty(data[constrainMap[i]])) {
								delete(data[constrainMap[i]]);
							}
						}
					}

				}
				return data;
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
			var inheritors = this.get('inheritors').accessProperty();
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
							proto.get('alpha').setValue(alpha.getValue());
						}
					} else {
						proto.set('inheritor_selected', false);
						alpha = proto.get('alpha');
						alpha.setValue(1);
						proto.get('alpha').setValue(alpha.getValue());
					}
					proto.setSelectionForInheritors(select, 'standard', 'none', 0);
				}

			}

			for (var i = 0; i < inheritors.length; i++) {
				inheritors[i].set('proto_selected', select);
				alpha = inheritors[i].get('alpha');
				alpha.setValue(1);
				inheritors[i].get('alpha').setValue(alpha.getValue());
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
			this.compileTransformation();
			this.compileStyle();
		},

		compileTransformation: function() {
			this._rotation_origin = this.get('rotation_origin').toPaperPoint();
			this._scaling_origin = this.get('scaling_origin').toPaperPoint();
			this._position = this.get('position').toPaperPoint();

			if (this.accessProperty('scaling_delta')) {
				this._scaling_delta.scale(this.accessProperty('scaling_delta').x, this.accessProperty('scaling_delta').y, this._scaling_origin);
			}
			if (this.accessProperty('rotation_delta')) {
				this._rotation_delta.rotate(this.accessProperty('rotation_delta'), this._rotation_origin);
			}
			if (this.accessProperty('translation_delta')) {
				this._translation_delta.translate(this.accessProperty('translation_delta').x, this.accessProperty('translation_delta').y);
			}

			
			this._temp_matrix.preConcatenate(this._rotation_delta);
			this._temp_matrix.preConcatenate(this._scaling_delta);
			this._temp_matrix.preConcatenate(this._translation_delta);
			
		},

		compileStyle: function() {
			this._fill_color = this.accessProperty('fill_color');
			this._stroke_color = this.accessProperty('stroke_color');
			this._stroke_width = this.accessProperty('stroke_width');
			//TODO: consider changing visible to a constrainable property?
			this._visible = this.get('visible');
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
			geom.fillColor = ColorUtils.rgbToHex(this._fill_color);
			geom.fillColor.alpha = this._fill_color.a;
			geom.strokeColor = ColorUtils.rgbToHex(this._stroke_color);
			geom.strokeColor.alpha = this._stroke_color.a;
			geom.strokeWidth = this._stroke_width;
			geom.visible = this._visible;
		},

		renderBoundingBox: function(geom) {

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
			var inheritors = this.get('inheritors').accessProperty();
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

		clearBoundingBoxes: function() {
			if (this.get('bbox')) {
				this.get('bbox').remove();
			}
			if (this.get('inheritor_bbox')) {
				this.get('inheritor_bbox').remove();
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
			geom.bringToFront();

			var path_altered = this.get('path_altered').getValue();
			if (!path_altered) {
				//geom.transform(this._itemp_matrix);
				geom.transform(this._ti_matrix);
				geom.transform(this._si_matrix);
				geom.transform(this._ri_matrix);
				geom.selected = false;
			}


			var position = this.get('position').toPaperPoint();
			geom.position = position;
			geom.transform(this._rotation_delta);
			geom.transform(this._scaling_delta);
			geom.transform(this._translation_delta);
			//geom.transform(this._temp_matrix);

			this.updateScreenBounds(geom);
			var p_altered = this.get('path_altered');
			p_altered.setValue(false);
			this.get('path_altered').setValue(p_altered);
			geom.visible = visible;
			return geom;
		},


		copyAttributes: function(clone, deep) {
			clone.get('position').setValue(this.get('position').getValue());
			clone.get('translation_delta').setValue(this.get('translation_delta').clone());
			clone.get('rotation_delta').setValue(this.get('rotation_delta').getValue());
			clone.get('scaling_delta').setValue(this.get('scaling_delta').getValue());
			clone.get('center').setValue(this.get('center').getValue());
			clone.get('scaling_origin').setValue(this.get('scaling_origin').getValue());
			clone.get('rotation_origin').setValue(this.get('rotation_origin').getValue());
			clone.set('bbox', this.get('bbox').clone());
			return clone;
		},

		animateAlpha: function(levels, property, mode, modifier, curlevel) {
			var inheritors = this.get('inheritors').accessProperty();
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
					proto.get('alpha').setValue(alpha.getValue());
					proto.get('geom   ').fillColor.alpha = alpha.getValue();
				}
			} else {
				for (var i = 0; i < inheritors.length; i++) {
					var inheritor = inheritors[i];
					if (inheritor.get(property).isNull() || modifier != 'none') {
						inheritor.get('alpha').setValue(alpha.getValue());
						inheritor.get('geom').fillColor.alpha = alpha.getValue();
						inheritor.animateAlpha(levels, property, mode, modifier, curlevel + 1);
					}
				}
			}
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