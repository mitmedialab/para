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
	'utils/PString',
	'utils/PProperty',
	'utils/PConstraint',
	'utils/TrigFunc',
	'utils/ColorUtils',

], function(_, $, paper, SceneNode, InheritorCollection, PPoint, PFloat, PColor, PBool, PString, PProperty, PConstraint, TrigFunc, ColorUtils) {



	var Instance = SceneNode.extend({


		defaults: _.extend({}, SceneNode.prototype.defaults, {

			//selection defaults

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
			translationDelta: null,
			scaling_origin: null,
			scalingDelta: null,
			rotation_origin: null,
			rotationDelta: null,
			strokeColor: null,
			fillColor: null,
			strokeWidth: null,
			pathAltered: null,
			v: null,
			index: null,
			memberCount: null,
			constraintSelected: null,
			selected: null,
			zIndex: null,

			/*basic datatypes to export to JSON*/
			name: 'instance',
			type: 'instance',
			visible: true,
			open: false,
			/*==end JSON export===*/

			//map of constrainable properties
			constrain_map: {
				constraintSelected: ['v'],
				position: ['x', 'y'],
				translationDelta: ['x', 'y'],
				scaling_origin: ['x', 'y'],
				scalingDelta: ['x', 'y'],
				rotation_origin: ['v'],
				rotationDelta: ['v'],
				strokeColor: ['r', 'g', 'b', 'a'],
				fillColor: ['r', 'g', 'b', 'a'],
				strokeWidth: ['v'],
				selected: ['v'],
				memberCount: ['v'],
				pathAltered: ['v'],
				zIndex: ['v']
					//inheritors: []
			},

			dimension_num: 6,

			reset: false,
			geom: null,
			selection_clone: null,
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
			reference_selected_color: '#fc9917',
			relative_selected_color: '#9717fc',

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
			var translationDelta = new PPoint(0, 0);
			translationDelta.setNull(true);
			this.set('translationDelta', translationDelta);

			var scalingDelta = new PPoint(0, 0);
			scalingDelta.setNull(false);
			this.set('scalingDelta', scalingDelta);

			var rotationDelta = new PFloat(0);
			rotationDelta.setNull(false);
			this.set('rotationDelta', rotationDelta);

			var strokeColor = new PColor(0, 0, 0, 1);
			strokeColor.setNull(true);
			this.set('strokeColor', strokeColor);

			var fillColor = new PColor(0, 0, 0, 1);
			fillColor.setNull(true);
			this.set('fillColor', fillColor);

			var strokeWidth = new PFloat(0);
			strokeWidth.setNull(true);
			this.set('strokeWidth', strokeWidth);
			this.set('sibling_instances', []);
			this.set('inheritors', new InheritorCollection(this));
			this.get('inheritors').setNull(false);
			this.set('v', new PProperty(0));
			this.set('zIndex', new PFloat(0));


			//============private properties==============//
			this._matrix = new paper.Matrix();

			//temporary attributes
			this._fillColor = {
				r: undefined,
				g: undefined,
				b: undefined,
				a: undefined
			};
			this._strokeColor = {
				r: undefined,
				g: undefined,
				b: undefined,
				a: undefined
			};

			this._strokeWidth = undefined;
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

			var pathAltered = new PBool(false);
			pathAltered.setNull(true);
			this.set('pathAltered', pathAltered);

			var index = new PFloat(0);
			index.setNull(false);
			this.set('index', index);

			var memberCount = new PFloat(1);
			memberCount.setNull(false);

			var selected = new PBool(false);
			selected.setNull(false);
			this.set('selected', selected);

			var constraintSelected = new PString(false);
			constraintSelected.setNull(false);
			this.set('constraintSelected', constraintSelected);

			this.set('memberCount', memberCount);

			this.set('id', this.get('type') + '_' + new Date().getTime().toString());

			this.extend(PConstraint);
			SceneNode.prototype.initialize.apply(this, arguments);
			this.isReturned = false;

			var parent = this;
			var constrainMap = this.get('constrain_map');

			for (var propertyName in constrainMap) {
				if (constrainMap.hasOwnProperty(propertyName)) {
					var property = this.get(propertyName);
					if (property) {
						this.listenTo(property, 'modified', this.modified);
					}
				}
			}


		},


		/*deleteAllChildren
		 * function which deletes all children
		 */
		deleteAllChildren: function(deleted) {
			if (!deleted) {
				deleted = [];
			}
			for (var i = this.children.length - 1; i >= 0; i--) {
				if (this.children[i].get('name') !== 'point') {
					deleted.push.apply(deleted, this.children[i].deleteAllChildren());
					deleted.push(this.children[i].deleteSelf());
				}
				this.removeChildNode(this.children[i]);
			}
			return deleted;
		},

		/*deleteAllMembers
		 * placeholder for lists member deletion */
		deleteAllMembers: function() {
			return [];
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
				if (this.get('selection_clone')) {
					this.get('selection_clone').remove();
				}
				if (this.get('normal_geom')) {
					this.get('normal_geom').remove();
				}
			}
			this.clearBoundingBoxes();
			var inheritorCollection = this.get('inheritors');
			inheritorCollection.deleteSelf();

			var parent = this.getParentNode();
			if (parent) {
				parent.removeChildNode(this);
			}
			var constrainMap = this.get('constrain_map');
			for (var propertyName in constrainMap) {
				if (constrainMap.hasOwnProperty(propertyName)) {
					var property = this.get(propertyName);
					property.deleteSelf();
				}

			}

			this.stopListening();
			return this;
		},


		/*hasMember, getMember, toggleOpen, toggleClosed, addMemberToOpen
		 * evaluation and access functions to assist in managing lists
		 */

		hasMember: function(member, top, last) {
			if (member === this) {
				return last;
			}
		},

		getMember: function(member) {
			if (member === this) {
				return this;
			}
			return null;
		},

		getMemberAt: function(index) {
			if (index === 0) {
				return this;
			} else {
				console.log('ERROR, accessing member index other than zero for non list instance');
			}
		},

		/* getRange: function used to modify constraints mappings for lists*/
		getRange: function() {
			return 1;
		},

		toggleOpen: function(item) {
			return null;
		},

		toggleClosed: function(item) {
			return null;
		},

		addMemberToOpen: function(data, added_bool) {
			return false;
		},
		recRemoveMember: function(data) {
			return false;
		},
		removeAllMembers: function() {
			return [];
		},

		accessMemberGeom: function() {
			return [this.get('geom')];
		},

		getBounds: function() {
			return this.get('geom').bounds;
		},



		close: function() {
			return this.getParentNode();
		},

		closeAllMembers: function() {
			return this;
		},

		/* create
		 * Prototypal inheritance action:
		 * creates a new instance which inherits from
		 * the parent instance.
		 * TODO: add in checks to prevent diamond inheritance
		 */
		create: function() {
			var instance = new this.constructor();
			var value = this.getValue();
			instance.setValue(value);
			this.addInheritor(instance);
			return instance;
		},

		addChildNode: function(node) {
			SceneNode.prototype.addChildNode.call(this, node);
			for (var i = 0; i < this.children.length; i++) {
				this.children[i].get('zIndex').setValue(i);
			}
		},

		insertChild: function(index, child) {
			SceneNode.prototype.insertChild.call(this, index, child);
			for (var i = 0; i < this.children.length; i++) {
				this.children[i].get('zIndex').setValue(i);
			}

		},
		removeChildNode: function(node) {
			SceneNode.prototype.removeChildNode.call(this, node);
			for (var i = 0; i < this.children.length; i++) {
				this.children[i].get('zIndex').setValue(i);
			}
		},

		setChildAfter: function(child, sibling) {
			SceneNode.prototype.setChildBefore.call(this, child, sibling);
			for (var i = 0; i < this.children.length; i++) {
				this.children[i].get('zIndex').setValue(i);
			}


		},

		setChildBefore: function(child, sibling) {
			SceneNode.prototype.setChildAfter.call(this, child, sibling);
			for (var i = 0; i < this.children.length; i++) {
				this.children[i].get('zIndex').setValue(i);
			}

		},

		addInheritor: function(instance) {
			this.set('is_proto', true);
			var inheritorCollection = this.get('inheritors');
			instance.set('proto_node', this);
			inheritorCollection.addInheritor(instance);
			instance.reset();
			var g_clone = this.getShapeClone(true);
			instance.changeGeomInheritance(g_clone);
		},

		removeInheritor: function(instance) {
			var inheritorCollection = this.get('inheritors');
			return inheritorCollection.removeInheritor(instance);
		},


		setPrototype: function(prototype) {
			prototype.addInheritor(this);
			this.set('proto_node', prototype);
			var clone = prototype.getShapeClone(true);
			this.changeGeomInheritance(clone);

		},

		removePrototype: function() {
			var proto_node = this.get('proto_node');
			if (proto_node) {
				proto_node.removeInheritor(this);
				var proto_vals = proto_node.getValue();
				var constrainMap = this.get('constrain_map');
				for (var property_name in constrainMap) {
					if (constrainMap.hasOwnProperty(property_name)) {
						if (this.get(property_name).isNull()) {
							this.get(property_name).setNull(false);
							this.get(property_name).setValue(proto_vals[property_name]);
						}
					}
				}
				this.set('proto_node', null);
			}
		},

		createSelectionClone: function() {
			if (this.get('selection_clone')) {
				this.get('selection_clone').remove();
				this.set('selection_clone', null);
			}
			var selection_clone = this.getShapeClone();
			var targetLayer = paper.project.layers.filter(function(layer) {
				return layer.name === 'ui_layer';
			})[0];
			targetLayer.addChild(selection_clone);
			selection_clone.data.instance = this;
			selection_clone.fillColor = null;
			selection_clone.strokeWidth = 3;
			selection_clone.selected = false;
			this.set('selection_clone', selection_clone);
		},

		createBBox: function() {
			if (this.get('bbox')) {
				this.get('bbox').remove();
				this.set('bbox', null);
			}
			var geom = this.get('normal_geom');
			var size = new paper.Size(geom.bounds.width, geom.bounds.height);

			var bbox = new paper.Path.Rectangle(geom.bounds.topLeft, size);
			bbox.data.instance = this;
			this.set('bbox', bbox);
			var targetLayer = paper.project.layers.filter(function(layer) {
				return layer.name === 'ui_layer';
			})[0];
			targetLayer.addChild(bbox);

		},

		changeGeomInheritance: function(geom) {
			if (this.get('geom')) {
				this.get('geom').remove();
				this.set('geom', null);

			}
			if (this.get('selection_clone')) {
				this.get('selection_clone').remove();
				this.set('selection_clone', null);
			}
			if (this.get('bbox')) {
				this.get('bbox').remove();
				this.set('bbox', null);
			}
			if (this.get('normal_geom')) {
				this.get('normal_geom').remove();
				this.set('normal_geom', null);
			}

			this.set('normal_geom', geom.clone());

			var self = this;
			var setChildrenData = function(child) {
				child.data.instance = self;
				child.data.geom = true;
				child.data.nodetype = self.get('name');
				if (child.children) {
					for (var i = 0; i < child.children.length; i++) {
						setChildrenData(child.children[i]);
					}
				}
			};
			setChildrenData(geom);

			this.set('geom', geom);
			this.get('normal_geom').visible = false;
			this.createBBox();
			this.createSelectionClone();
			for (var i = 0; i < this.children.length; i++) {
				if (this.children[i].get('name') === 'point') {
					this.children[i].deleteSelf();
				} else {
					this.children[i].changeGeomInheritance(geom.clone());
				}

			}
			this.setPathAltered();
		},

		setPathAltered: function() {
			var pathAltered = this.get('pathAltered');
			pathAltered.setValue(true);
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


		},

		exportSVG: function() {
			return this.get('geom').exportSVG({
				asString: true
			});
		},

		// sets the geom visibility to false
		hide: function() {
			this.set('visible', false);
			this.get('selected').setValue(false);
			this.get('geom').visible = false; // hacky
			this.get('selection_clone').visible = false;
		},

		show: function() {
			this.set('visible', true);
			this.get('geom').visible = true;
			if (this.get('constraintSelected').getValue()) {
				this.get('selection_clone').visible = true;
			}

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
				this.get('selection_clone').bringToFront();
			}
		},

		resetProperties: function() {
			this.get('position').setValue({
				x: 0,
				y: 0
			});
			this.get('translationDelta').setValue({
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
		},


		resetStylesToPrototype: function(data, recurse) {

			if (data.fillColor) {
				this.get('fillColor').setNull(true);
			}

			if (data.strokeColor) {
				this.get('strokeColor').setNull(true);
			}

			if (data.strokeWidth) {
				this.get('strokeWidth').setNull(true);
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

			if (data.translationDelta) {
				this.get('translationDelta').setValue(instance.get('translationDelta').getValue());
			}

			if (data.rotationDelta) {
				this.get('rotationDelta').setValue(instance.get('rotationDelta').getValue());

			}
			if (data.scalingDelta) {
				this.get('scalingDelta').setValue(instance.get('scalingDelta').getValue());

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
			if (data.translationDelta) {

				var protoNode = this.get('proto_node');

				if (protoNode) {
					//this.set('position', protoNode.get('position').clone());
					//this.set('rotation_origin', protoNode.get('rotation_origin').clone());
					//this.set('scaling_origin', protoNode.get('scaling_origin').clone());
					this.get('translationDelta').setNull(true);
				}
			}

			if (data.rotationDelta) {
				this.get('rotationDelta').setNull(true);
			}
			if (data.scalingDelta) {
				this.get('scalingDelta').setNull(true);
			}
		},


		toJSON: function() {
			var data = {};
			var constrainMap = this.get('constrain_map');
			for (var propertyName in constrainMap) {
				if (constrainMap.hasOwnProperty(propertyName)) {
					data[propertyName] = this.get(propertyName).toJSON();
				}
			}
			data.name = this.get('name');
			data.type = this.get('type');
			data.id = this.get('id');
			data.visible = this.get('visible');
			data.open = this.get('open');

			data.children = [];
			for (var i = 0; i < this.children.length; i++) {
				data.children.push(this.children[i].toJSON());
			}

			return data;

		},

		parseJSON: function(data) {
			var constrainMap = this.get('constrain_map');
			for (var propertyName in constrainMap) {
				if (constrainMap.hasOwnProperty(propertyName)) {
					this.get(propertyName).setValue(data[propertyName]);
				}
			}
			this.set('name', data.name);
			this.set('type', data.type);
			this.set('id', data.id);
			this.set('visible', data.visible);
			this.set('open', data.open);

			var children = data.children;
			/*for (var i = 0; i < this.children.length; i++) {
				data.children.push(this.children[i].toJSON());
			}*/
		},


		isValid: function() {
			var constrainMap = this.get('constrain_map');
			var valid = true;
			for (var property in constrainMap) {
				if (constrainMap.hasOwnProperty(property)) {
					valid = valid ? this.isValidFor(property) : false;
				}
			}
			return valid;
		},

		invalidate: function() {
			var constrainMap = this.get('constrain_map');
			for (var property_name in constrainMap) {
				if (constrainMap.hasOwnProperty(property_name)) {
					var property = this.get(property_name);
					if (property) {
						property.invalidate();
					}
				}
			}
		},

		isValidFor: function(property_name) {
			var property = this.get(property_name);
			if (property) {
				return property.isValid();
			}
			return true;
		},


		activateProperty: function(property_name) {
			this.get(property_name).setNull(false);
			return this.get(property_name);
		},


		removeConstraint: function(prop, dimensions) {
			this.get(prop).removeConstraint(dimensions);
		},

		/*setValue
		 * modifies the properties of this instance in accordance with the
		 * data passed in
		 */
		setValue: function(data) {

			for (var prop in data) {
				if (data.hasOwnProperty(prop)) {

					var p = data[prop];
					if (typeof data[prop] !== 'object') {
						p = {
							v: data[prop]
						};
					}
					if (!p.operator) {
						p.operator = 'set';
					}
					if (p.operator === 'set') {
						if (prop === 'scalingDelta') {
							if (data[prop].x && data[prop].x === 0) {

								data[prop].x = 0.01;
							}
							if (data[prop].y && data[prop].y === 0) {

								data[prop].y = 0.01;
							}
						}
						this.get(prop).setValue(p);
					} else if (p.operator === 'add') {
						this.get(prop).add(p);
					}
				}

			}
		},



		getLiteralSubprops: function(key, subprop) {
			var property = this.get(key);
			if (property) {
				return [property[subprop]];
			}
		},

		/* getValue
		 * returns an object containing all of the values of constrainable properties
		 * TODO: Make recursive (will not work for objects with 3+ leves of heirarchy)
		 */

		getValue: function() {
			var constrainMap = this.get('constrain_map');
			var value = {};
			for (var propertyName in constrainMap) {
				if (constrainMap.hasOwnProperty(propertyName)) {
					value[propertyName] = this.get(propertyName).getValue();
				}
			}
			if (this.isSelfConstrained()) {
				var constrained_values = this.getSelfConstraint().getValue();
				var merged = TrigFunc.merge(value, constrained_values);
				return merged;
			} else {
				return value;
			}
		},



		/* getValueFor
		 * returns the actual value for a given property
		 */
		getValueFor: function(property_name) {
			var property = this.get(property_name);
			if (property) {
				return this.getValue()[property_name];
			} else {
				return null;
			}
		},


		/*calculates a new value given a dataset of values to be added */
		getAddedValueFor: function(data) {
			var addedData = {};
			for (var p in data) {
				if (data.hasOwnProperty(p)) {
					if (data[p].operator !== 'set') {
						var current_val = this.getValueFor(p);
						if (current_val) {
							addedData[p] = {};
							for (var d in data[p]) {
								if (data[p].hasOwnProperty(d)) {
									if (current_val.hasOwnProperty(d)) {
										addedData[p][d] = data[p][d] + current_val[d];
									} else if (typeof current_val === 'number' && d === 'v') {
										addedData[p][d] = data[p][d] + current_val;
									}
								}
							}
						}
					} else {
						addedData[p] = data[p];
					}
				}
			}
			return addedData;
		},

		/*isReference
		 *recursively used to check if member is a reference object in 
		 *order to allow edits to self-referencing constraints
		 */

		isReference: function(instance) {
			if (this.isSelfConstrained()) {
				var reference = this.constraintObject.get('references');
				var hasMember = reference.hasMember(instance, true, reference);
				if (hasMember) {
					return true;
				}
				return false;
			} else {
				var constrainMap = this.get('constrain_map');
				var properties = {};
				for (var propertyName in constrainMap) {
					if (constrainMap.hasOwnProperty(propertyName)) {
						properties[propertyName] = this.get(propertyName).isReference(instance);
					}

				}
				return properties;
			}
		},


		pause: function() {
			if (this.isSelfConstrained()) {
				this.constraintObject.set('paused', true);
			} else {
				var constrainMap = this.get('constrain_map');
				var properties = {};
				for (var propertyName in constrainMap) {
					if (constrainMap.hasOwnProperty(propertyName)) {
						this.get(propertyName).pause();
					}
				}
			}
		},

		resume: function() {
			if (this.isSelfConstrained()) {
				this.constraintObject.set('paused', false);

			} else {
				var constrainMap = this.get('constrain_map');
				var properties = {};
				for (var propertyName in constrainMap) {
					if (constrainMap.hasOwnProperty(propertyName)) {
						this.get(propertyName).resume();
					}
				}
			}
		},

		destroy: function() {
			var constrainMap = this.get('constrain_map');
			var properties = {};
			for (var propertyName in constrainMap) {
				if (constrainMap.hasOwnProperty(propertyName)) {
					this.get(propertyName).destroy();
				}
			}
		},



		/* getConstraint
		 * returns an object comprised of all existing constraints in one of 3 states:
		 *
		 * 1) if entire instance is constrained by a function returns {self: constraint_obj}
		 *
		 * 2) if some of the attributes of the instance are constrainted, returns an object with a
		 * list of the currently constrained attributes of this instance, with references to these
		 * constraints eg {translationDelta:{x:constraint_obj},rotationDelta:{self:constraint_obj}}
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
				return self;
			} else {
				var constraintFound = false;
				for (var propertyName in constrainMap) {
					if (constrainMap.hasOwnProperty(propertyName)) {
						var constraint = this.get(propertyName).getConstraint();
						if (constraint) {
							data[propertyName] = constraint;
						}
						constraintFound = true;
					}
				}
				if (constraintFound) {
					return data;
				}
			}


		},

		/* getConstraintValues
		 * returns an object containing all constrained properties of
		 * this instance with their values;
		 * TODO: Make recursive (will not work for objects with 3+ leves of heirarchy)
		 */

		getConstraintValues: function() {
			var constraints = this.getConstraint();
			if (constraints.getValue) {
				return constraints.getValue();
			} else {
				var value = {};
				for (var c in constraints) {
					if (constraints.hasOwnProperty(c)) {
						if (constraints[c].getValue) {
							value[c] = constraints[c].getValue();
						} else {
							value[c] = {};
							for (var v in constraints[c]) {
								if (constraints[c].hasOwnProperty(v)) {
									value[c][v] = constraints[c][v].getValue();
								}
							}
						}
					}
				}

				return value;
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



		deselect: function() {
			this.get('selected').setValue(false);
			this.setSelectionForInheritors(false);
		},

		select: function(segments) {
			this.get('selected').setValue(true);
			this.setSelectionForInheritors(true, null, null, 1);
		},

		/* setSelectionForInheritors
		 * toggles selection mode for objects which inherit
		 * from this. Optionally also toggles selection for all
		 * ancestors.
		 */
		setSelectionForInheritors: function(select, mode, modifer, recurse) {
			var inheritors = this.get('inheritors').inheritors;
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
			var value = this.getValue();
			this.compileTransformation(value);
			this.compileStyle(value);
			this.updateScreenBounds(this.get('geom'));
		},



		inverseTransformSelf: function() {
			var geom = this.get('geom');
			var bbox = this.get('bbox');
			var selection_clone = this.get('selection_clone');

			this._invertedMatrix = this._matrix.inverted();
			geom.transform(this._invertedMatrix);
			bbox.transform(this._invertedMatrix);
			selection_clone.transform(this._invertedMatrix);

			return [geom];
		},

		transformSelf: function() {
			this._matrix.reset();
			var geom = this.get('geom');
			var bbox = this.get('bbox');
			var selection_clone = this.get('selection_clone');
			var scalingDelta, rotationDelta, translationDelta;
			var value = this.getValue();
			scalingDelta = value.scalingDelta;
			rotationDelta = value.rotationDelta;
			translationDelta = value.translationDelta;

			this._matrix.translate(translationDelta.x, translationDelta.y);
			this._matrix.rotate(rotationDelta, 0, 0);
			this._matrix.scale(scalingDelta.x, scalingDelta.y, 0, 0);

			geom.transform(this._matrix);
			bbox.transform(this._matrix);
			selection_clone.transform(this._matrix);
			return [geom];
		},



		compileTransformation: function(value) {
			var geom = this.get('geom');
			if (this.nodeParent && this.nodeParent.get('name') === 'group' && !this.nodeParent.get('open')) {
				this.nodeParent.inverseTransformRecurse([]);
			} else {
				this.inverseTransformSelf();
			}

			geom.visible = true;
			if (this.nodeParent && this.nodeParent.get('name') === 'group' && !this.nodeParent.get('open')) {
				this.nodeParent.transformRecurse([]);
			} else {
				this.transformSelf();

			}

		},

		compileStyle: function(value) {
			this._fillColor = value.fillColor;
			this._strokeColor = value.strokeColor;
			this._strokeWidth = value.strokeWidth;
			this._visible = this.get('visible');
		},

		/*render
		 * draws instance on canvas
		 */
		render: function() {
			if (!this.get('rendered')) {
				if (this.get('name') != 'root') {
					var geom = this.get('geom');
					this.renderStyle(geom);
					this.renderSelection(geom);
					this.set('rendered', true);
				}
				return 'root';
			}
		},


		renderStyle: function(geom) {
			if (!this._fillColor.noColor && (this._fillColor.h > -1 && this._fillColor.s > -1 && this._fillColor.l > -1)) {
				if (!geom.fillColor) {
					geom.fillColor = new paper.Color(0, 0, 0);
				}
				if (this._fillColor.h) {
					geom.fillColor.hue = this._fillColor.h;
					geom.fillColor.saturation = this._fillColor.s;
					geom.fillColor.lightness = this._fillColor.l;
					geom.fillColor.alpha = this._fillColor.a;
				}
			} else {
				geom.fillColor = undefined;
			}
			if (!this._strokeColor.noColor && (this._strokeColor.h > -1 && this._strokeColor.s > -1 && this._strokeColor.l > -1)) {
				if (!geom.fillColor) {
					geom.strokeColor = new paper.Color(0, 0, 0);
				}
				geom.strokeColor.hue = this._strokeColor.h;
				geom.strokeColor.saturation = this._strokeColor.s;
				geom.strokeColor.lightness = this._strokeColor.l;
				geom.strokeColor.alpha = this._strokeColor.a;
				geom.strokeColor.alpha = this._strokeColor.a;
			} else {
				geom.strokeColor = undefined;
			}

			geom.strokeWidth = this._strokeWidth;
			geom.visible = this._visible;
			var zIndex = this.get('zIndex').getValue();
			if (geom.index != zIndex) {
				geom.parent.insertChild(zIndex, geom);
			}
		},



		renderSelection: function(geom) {
			var selected = this.get('selected').getValue();
			var constraint_selected = this.get('constraintSelected').getValue();
			var selection_clone = this.get('selection_clone');
			var bbox = this.get('bbox');
			if (constraint_selected) {
				selection_clone.visible = true;
				selection_clone.strokeColor = this.get(constraint_selected + '_color');

			} else {
				selection_clone.visible = false;

			}

			if (selected) {
				geom.selectedColor = this.getSelectionColor();

				bbox.selectedColor = this.getSelectionColor();
				bbox.selected = (constraint_selected) ? false : true;
				bbox.visible = (constraint_selected) ? false : true;
				geom.selected = (constraint_selected) ? false : true;
			} else {
				bbox.selected = false;
				bbox.visible = false;
				geom.selected = false;
			}
		},

		clearBoundingBoxes: function() {
			if (this.get('bbox')) {
				this.get('bbox').remove();
				this.set('bbox', null);
			}
			if (this.get('inheritor_bbox')) {
				this.get('inheritor_bbox').remove();
				this.set('inheritor_bbox', null);

			}
		},

		copyAttributes: function(clone, deep) {
			clone.get('position').setValue(this.get('position').getValue());
			clone.get('translationDelta').setValue(this.get('translationDelta').clone());
			clone.get('rotationDelta').setValue(this.get('rotationDelta').getValue());
			clone.get('scalingDelta').setValue(this.get('scalingDelta').getValue());
			clone.get('center').setValue(this.get('center').getValue());
			clone.get('scaling_origin').setValue(this.get('scaling_origin').getValue());
			clone.get('rotation_origin').setValue(this.get('rotation_origin').getValue());
			clone.set('bbox', this.get('bbox').clone());
			return clone;
		},

		/*returns a clone of the paper js shape*/
		getShapeClone: function(relative) {
			var clone = this.get('normal_geom').clone();
			return clone;
		},

		animateAlpha: function(levels, property, mode, modifier, curlevel) {
			var inheritors = this.get('inheritors').getValueFor();
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