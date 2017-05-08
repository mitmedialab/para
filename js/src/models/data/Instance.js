// FIXME: 'rendered' can probably be removed completely now
/*Instance.js
 * used to store references of a shape object
 *
 */

define([
	'underscore',
	'jquery',
	'paper',
	'models/data/SceneNode',
	'models/data/collections/InheritorCollection',

	'models/data/properties/PPoint',
	'models/data/properties/PFloat',
	'models/data/properties/PVal',
	'models/data/properties/PColor',
	'models/data/properties/PBool',
	'models/data/properties/PString',
	'models/data/properties/PProperty',
	'models/data/properties/PConstraint',
	'utils/TrigFunc',
	'utils/ColorUtils',

], function(_, $, paper, SceneNode, InheritorCollection, PPoint, PFloat, PVal, PColor, PBool, PString, PProperty, PConstraint, TrigFunc, ColorUtils) {



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
			v: null,
			index: null,
			memberCount: null,
			constraintSelected: null,
			selected: null,
			zIndex: null,
			blend_mode: null,

			/*basic datatypes to export to JSON*/
			name: 'instance',
			type: 'instance',
			visible: true,
			open: false,
			inFocus: true,
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
				zIndex: ['v'],
				blendMode: ['v'],
				//inheritors: []
			},

			blendMode_map: ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard- light', 'color-dodge', 'color-burn', 'darken', 'lighten', 'difference', 'exclusion', 'hue', 'saturation', 'luminosity', 'color', 'add', 'subtract', 'average', 'pin-light', 'negation', 'source-over', 'source-in', 'source-out', 'source-atop', 'destination-over', 'destination-in', 'destination-out', 'destination-atop', 'lighter', 'darker', 'copy', 'xor'],

			dimension_num: 6,

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
			reference_selected_color: '#fc9917',
			relative_selected_color: '#9717fc',

			// EXPERIMENTAL
			selection_palette: ['#A5FF00', '#0D7C1F', '#FF4D4D', '#33D6FF', '#E698D2'],
			sel_palette_index: 0,
			isChanging: false,
			rendered: false,
			undo_limit: 10,
			user_name: "instance",


		}),

		initialize: function() {

			this.deleted = false;
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
			translationDelta.setNull(false);
			this.set('translationDelta', translationDelta);

			var scalingDelta = new PPoint(0, 0);
			scalingDelta.setNull(false);
			this.set('scalingDelta', scalingDelta);

			var rotationDelta = new PVal(0);
			rotationDelta.setNull(false);
			this.set('rotationDelta', rotationDelta);

			var strokeColor = new PColor(0, 0, 0, 1);
			strokeColor.setNull(true);
			this.set('strokeColor', strokeColor);

			var fillColor = new PColor(0, 0, 0, 1);
			fillColor.setNull(false);
			this.set('fillColor', fillColor);

			var strokeWidth = new PVal(0);
			strokeWidth.setNull(true);
			this.set('strokeWidth', strokeWidth);
			this.set('sibling_instances', []);
			this.set('inheritors', new InheritorCollection(this));
			this.get('inheritors').setNull(false);
			this.set('v', new PProperty(0));
			this.set('zIndex', new PFloat(0));

			var blendMode = new PVal(0);
			blendMode.setNull(false);
			this.set('blendMode', blendMode);
			//============private properties==============//
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

			this.renderQueue = [];

			//undo redo variables
			this.previousStates = [];
			this.futureStates = [];
			this.stateStored = false;

			this.set('user_name', this.get('name'));
			/*this.originUI = new paper.Path.Circle(new paper.Point(0, 0), 5);
			this.originUI.fillColor = 'yellow';

			this.centroidUI = new paper.Path.Circle(new paper.Point(0, 0), 10);
			this.centroidUI.fillColor = 'blue';
			
			/*this.rotationUI = new paper.Path(new paper.Point(0, 0), new paper.Point(100, 0));
			this.rotationUI.strokeColor = 'red';
			this.rotationUI.strokeWidth = 2;*/

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
			this.stopListening();
			var geom = this.get('geom');
			if (geom) {
				geom.remove();
				geom.data = null;
				this.set('geom', null);

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
			this.deleted = true;
			return this;
		},


		getById: function(id) {
			if (this.get('id') == id) {
				return this;
			}
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


		getMemberById: function(id) {
			if (id == this.get('id')) {
				return this;
			}
		},

		//used for finding internal lists in duplicators
		getInternalList: function(id) {
			return false;
		},

		//used for finding duplicator parent of internal list
		getInternalListOwner: function(id) {
			return null;
		},

		hasChild: function(child, top, last) {
			if (child === this) {
				return last;
			}
		},

		getChild: function(child) {
			if (child === this) {
				return this;
			}
			return null;
		},

		getChildAt: function(index) {
			if (index === 0) {
				return this;
			} else {
				console.log('ERROR, accessing child index other than zero for non group instance');
			}
		},

		/* getRange: function used to modify constraints mappings for lists*/
		getRange: function() {
			return 1;
		},

		toggleOpen: function() {
			return false;
		},

		toggleClosed: function() {
			return false;
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

		getBounds: function() {
			return this.get('geom').bounds;
		},

		//placeholder for addAsReference duplicator function.
		addAsReference: function() {

		},



		close: function() {
			return this.getParentNode();
		},

		closeAllMembers: function() {
			return this;
		},

		getInstanceMembers: function() {
			return [this];
		},

		getInstanceChildren: function() {
			return [this];
		},


		/*placeholder functions to prevent errors */
		modifyPoints: function(data, mode, modifier, exclude) {

		},

		modifyPointsByIndex: function(initial_delta, indicies, exclude) {},

		filterSelection: function() {
			if (this.nodeParent.get('open')) {
				return this;
			} else {
				return this.nodeParent.filterSelection();
			}
		},

		createProxy: function() {
			var proxy = this.create();
			proxy.get('geom').remove();
			this.proxy = proxy;
			proxy.slave = this;
			return proxy;
		},

		/* create
		 * Prototypal inheritance action:
		 * creates a new instance which inherits from
		 * the parent instance.
		 * TODO: add in checks to prevent diamond inheritance
		 */
		create: function(noInheritor) {
			var instance = new this.constructor();
			var value = this.getValue();
			instance.setValue(value);


			if (!noInheritor) {
				this.addInheritor(instance);
			}
			var g_clone = this.getShapeClone();
			instance.changeGeomInheritance(g_clone);

			instance.set('rendered', true);
			return instance;
		},

		/*returns a clone of the paper js shape*/
		getShapeClone: function() {
			this.get('geom').data.instance = null;
			var clone = this.get('geom').clone();
			this.get('geom').data.instance = this;
			return clone;
		},

		addChildNode: function(node, registerUndo) {
			this.insertChild(this.children.length, node, registerUndo);
		},

		addMultipleChildren: function(nodes, registerUndo) {
			if (registerUndo) {
				this.addToUndoStack();
			}
			for (var i = 0; i < nodes.length; i++) {
				this.addChildNode(nodes[i]);
			}
		},

		insertChild: function(index, child, registerUndo) {
			if (registerUndo) {
				this.addToUndoStack();
			}

			if (child.nodeParent) {
				child.nodeParent.stopListening(child);
			}

			if (!child.get('geom').parent) {
				paper.project.activeLayer.insertChild(index, child.get('geom'));
			}
			SceneNode.prototype.insertChild.call(this, index, child);
			for (var i = 0; i < this.children.length; i++) {
				if (this.children[i].get('zIndex').getValue() != i) {
					this.children[i].get('zIndex').setValue(i);
				}
			}

			this.stopListening(child);
			this.listenTo(child, 'modified', this.childModified);

		},

		reorderGeom: function() {
			for (var i = 0; i < this.children.length; i++) {
				if (this.children[i].get('zIndex').getValue() != i) {
					this.children[i].get('zIndex').setValue(i);
				}
				this.get('geom').appendTop(this.children[i].get('geom'));
			}

		},

		removeChildNode: function(node, registerUndo) {
			if (registerUndo) {
				this.addToUndoStack();

			}
			var rI = this.renderQueue.indexOf(node);
			if (rI > -1) {
				this.renderQueue.splice(rI, 1);
			}
			this.removeInheritor(node);
			var removed = SceneNode.prototype.removeChildNode.call(this, node);
			if (removed) {
				for (var i = 0; i < this.children.length; i++) {
					if (this.children[i].get('zIndex').getValue() != i) {
						this.children[i].get('zIndex').setValue(i);
					}
				}
				this.stopListening(removed);
				return removed;
			}

		},

		setChildAfter: function(child, sibling) {
			SceneNode.prototype.setChildAfter.call(this, child, sibling);
			for (var i = 0; i < this.children.length; i++) {
				this.children[i].get('zIndex').setValue(i);
			}
			child.get('geom').moveBelow(sibling.get('geom'));

		},

		setChildBefore: function(child, sibling) {
			SceneNode.prototype.setChildBefore.call(this, child, sibling);
			for (var i = 0; i < this.children.length; i++) {
				this.children[i].get('zIndex').setValue(i);
			}
			child.get('geom').moveAbove(sibling.get('geom'));

		},

		addInheritor: function(instance) {
			this.set('is_proto', true);
			var inheritorCollection = this.get('inheritors');
			instance.set('proto_node', this);
			inheritorCollection.addInheritor(instance);

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


		createBBox: function() {
			if (this.get('bbox')) {
				this.get('bbox').remove();
				this.set('bbox', null);
			}
			var geom = this.get('geom');
			var size = new paper.Size(geom.bounds.width, geom.bounds.height);

			var bbox = new paper.Path.Rectangle(geom.bounds.topLeft, size);
			bbox.applyMatrix = false;
			bbox.data.instance = this;
			this.set('bbox', bbox);
			var targetLayer = paper.project.layers.filter(function(layer) {
				return layer.name === 'ui_layer';
			})[0];
			targetLayer.addChild(bbox);
			this.bboxInvalid = false;

		},

		changeGeomInheritance: function(geom) {


			if (this.get('geom')) {
				var ok = (geom && geom.insertBelow(this.get('geom')));
				if (ok) {

					this.get('geom').remove();
				}
				this.get('geom').data = null;
				this.set('geom', null);

			}


			this.set('geom', geom);
			this.set('width', geom.bounds.width);
			this.set('height', geom.bounds.height);
			this.get('strokeColor').setNull(false);
			this.get('fillColor').setNull(false);

			geom.applyMatrix = false;
			geom.data.instance = this;
			geom.data.geom = true;
			geom.data.nodetype = this.get('name');
			geom.applyMatrix = false;
			this.createBBox();

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

		},

		show: function() {
			this.set('visible', true);
			this.get('geom').visible = true;
			if (this.get('constraintSelected').getValue()) {

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


		toJSON: function(noUndoCache) {
			var data = {};
			var constrainMap = this.get('constrain_map');
			for (var propertyName in constrainMap) {
				if (constrainMap.hasOwnProperty(propertyName)) {
					data[propertyName] = this.get(propertyName).toJSON();
				}
			}
			data.name = this.get('name');
			data.user_name = this.get('user_name');
			data.type = this.get('type');
			data.id = this.get('id');
			data.visible = this.get('visible');
			data.open = this.get('open');
			data.inheritors = this.get('inheritors').toJSON();
			data.children = [];
			data.rendered = this.get('rendered');
			if (!noUndoCache) {
				data.stateStored = this.stateStored;
				data.previousStates = this.previousStates.slice(0, this.previousStates.length);
				data.futureStates = this.futureStates.slice(0, this.futureStates.length);
				this.previousProperties = this.properties;

			} else {
				data.stateStored = false;
				data.previousStates = [];
				data.futureStates = [];
				data.previousProperties = {};
			}
			this.properties = data;

			return data;

		},

		parseJSON: function(data, manager) {

			var constrainMap = this.get('constrain_map');
			for (var propertyName in constrainMap) {
				if (constrainMap.hasOwnProperty(propertyName) && data[propertyName]) {
					this.get(propertyName).setValue(data[propertyName]);
				}
			}
			this.set('name', data.name);
			this.set('user_name', data.user_name);
			this.set('type', data.type);
			this.set('id', data.id);
			this.set('visible', data.visible);
			this.set('open', data.open);
			this.set('rendered', data.rendered);
			this.set('rendered', true);

			if (this.get('name') == 'root') {
				this.set('open', true);
			}
			return {
				toRemove: [],
				toAdd: []
			};
		},

		parseInheritorJSON: function(data, manager) {
			this.get('inheritors').parseJSON(data.inheritors, this, manager);

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


		//callback triggered when a subproperty is modified externally 
		modified: function() {
			PConstraint.prototype.modified.apply(this, arguments);
		},


		clearUndoCache: function() {
			this.previousStates = [];
			this.futureStates = [];
			this.stateStored = false;
		},

		//undo to last state
		undo: function() {

			if (this.previousStates.length > 0) {
				var toRemove = [];
				var toAdd = [];

				var state = this.previousStates.pop();
				var currentState = this.toJSON();
				this.futureStates.push(currentState);
				var changed = this.parseJSON(state);

				toRemove.push.apply(toRemove, changed.toRemove);
				toAdd.push.apply(toAdd, changed.toAdd);
				return {
					toRemove: toRemove,
					toAdd: toAdd
				};
			}
		},

		trimUndoStack: function() {
			this.previousStates.shift();
		},

		trimRedoStack: function() {
			this.futureStates.shift();
		},

		redo: function() {
			if (this.futureStates.length > 0) {
				var toRemove = [];
				var toAdd = [];
				var state = this.futureStates.pop();
				var currentState = this.toJSON();
				this.previousStates.push(currentState);
				var changed = this.parseJSON(state);

				toRemove.push.apply(toRemove, changed.toRemove);
				toAdd.push.apply(toAdd, changed.toAdd);
				return {
					toRemove: toRemove,
					toAdd: toAdd
				};
			}

		},

		addToUndoStack: function() {
			if (!this.stateStored) {
				this.previousStates.push(this.toJSON());
				this.stateStored = true;
				this.futureStates = [];
			}
		},
		/*setValue
		 * modifies the properties of this instance in accordance with the
		 * data passed in
		 * @data: data that contains updated values
		 * @registerUndo: boolean that determines if setting is stored as an undo.
		 */
		setValue: function(data, registerUndo) {
			if (this.proxy) {
				this.proxy.setValue(data);
			}
			console.log('setting value', data);
			if (registerUndo) {
				this.addToUndoStack();
			}

			var dataClone = null;

			if (data.translationDelta && this.nodeParent) {
				data = dataClone || (dataClone = _.clone(data));

				var tdelta = data.translationDelta;
				var ndelta = this.nodeParent.inverseTransformPoint(tdelta);
				data.translationDelta.x = ndelta.x;
				data.translationDelta.y = ndelta.y;
			}

			if (data.hasOwnProperty('scalingDelta') && data.scalingDelta.operator == 'set') {
				data = dataClone || (dataClone = _.clone(data));

				var xScalingSign = (data.scalingDelta.x < 0.0) ? -1.0 : +1.0;
				var yScalingSign = (data.scalingDelta.y < 0.0) ? -1.0 : +1.0;
				data.scalingDelta.x = Math.max(1e-2, Math.min(1e+3, Math.abs(data.scalingDelta.x))) * xScalingSign;
				data.scalingDelta.y = Math.max(1e-2, Math.min(1e+3, Math.abs(data.scalingDelta.y))) * yScalingSign;
			}

			for (var prop in data) {
				if (data.hasOwnProperty(prop)) {
					console.log('has own prop');
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
						console.log('setting value conditional');
						this.get(prop).setValue(p);
					} else if (p.operator === 'add') {
						this.get(prop).add(p);
					}
				}

			}
		},

		//sets all transformation values to 0
		resetValue: function() {
			this.get('translationDelta').setValue({
				x: 0,
				y: 0
			});
			this.get('rotationDelta').setValue(0);
			this.get('scalingDelta').setValue({
				x: 1,
				y: 1
			});
		},

		/*setValueEnded
		 * called when a manual adujstment is ended
		 * such as on a mouse up event
		 * sets stateStored to false, enabling the next
		 * state of an object to be saved
		 */
		setValueEnded: function() {
			this.stateStored = false;
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
				if (reference) {
					var hasMember = reference.hasMember(instance, true, reference);
					if (hasMember) {
						return true;
					}
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
				for (var propertyName in constrainMap) {
					if (constrainMap.hasOwnProperty(propertyName)) {
						var constraint = this.get(propertyName).getConstraint();
						if (constraint) {
							data[propertyName] = constraint;
						}
					}
				}

				return data;

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

		getAbsoluteOrigin: function() {
			var td = this.get('translationDelta').getValue();
			if (!this.nodeParent) {
				return td;
			}
			var pdt = this.nodeParent.getAbsoluteOrigin();
			return TrigFunc.add(td, pdt);
		},


		transformAbsoluteCoordinates: function(origin) {
			var absolute = this.get('geom').position;
			var nX = absolute.x - origin.x;
			var nY = absolute.y - origin.y;
			this.get('translationDelta').setValue({
				x: nX,
				y: nY
			});
		},

		setRelativeOrigin: function(offset) {

			var relative = this.get('translationDelta').getValue();
			var nX = relative.x - offset.x;
			var nY = relative.y - offset.y;
			this.get('translationDelta').setValue({
				x: nX,
				y: nY
			});
		},

		calculateCentroid: function() {
			var geom = this.get('geom');
			var pointList = geom.segments.map(function(seg) {
				return seg.point;
			});
			var centroid = TrigFunc.add(TrigFunc.centroid(pointList), this.get('translationDelta').getValue());
			return centroid;
		},


		inverseTransformPoint: function(delta) {
			var value = this.getValue();
			var scalingDelta, rotationDelta;
			scalingDelta = value.scalingDelta;
			rotationDelta = value.rotationDelta;
			var geomPosition = this.get('geom').position;
			var pVector = new paper.Point(delta.x, delta.y);
			pVector = pVector.rotate(-rotationDelta, new paper.Point(0, 0));

			pVector = pVector.multiply(new paper.Point(1 / scalingDelta.x, 1 / scalingDelta.y));
			if (this.nodeParent) {
				return this.nodeParent.inverseTransformPoint(pVector);
			} else {
				return pVector;
			}
		},


		transformPoint: function(delta) {
			var value = this.getValue();
			var scalingDelta, rotationDelta;
			scalingDelta = value.scalingDelta;
			rotationDelta = value.rotationDelta;
			var geomPosition = this.get('geom').position;
			var pVector = new paper.Point(delta.x, delta.y);
			pVector = pVector.rotate(rotationDelta, new paper.Point(0, 0));
			pVector = pVector.multiply(new paper.Point(scalingDelta.x, scalingDelta.y));
			/*if(this.nodeParent){
				return this.nodeParent.inverseTransformPoint(pVector);
			}
			else{*/
			return pVector;
			//}
		},


		childModified: function(child) {
			if (!_.contains(this.renderQueue, child)) {
				this.renderQueue.push(child);
				this.childrenModified = true;
				this.bboxInvalid = true;
			}
		},

		clearRenderQueue: function() {
			for (var i = 0; i < this.children.length; i++) {
				this.children[i].clearRenderQueue();
			}
			this.renderChildren();
		},

		renderChildren: function() {
			for (var i = 0; i < this.renderQueue.length; i++) {
				if (this.renderQueue[i] && !this.renderQueue[i].deleted) {
					this.renderQueue[i].render();
				}

			}

			//this.centroidUI.position = this.get('geom').position;
			this.renderQueue = [];
		},


		/*render
		 * draws instance on canvas
		 */
		render: function() {
			var geom = this.get('geom');
			this.transformSelf();
			this.updateScreenBounds(geom);

			this.renderStyle(geom);
			this.renderSelection(geom);
		},

		transformSelf: function() {
			var scalingDelta, rotationDelta, translationDelta;
			var value = this.getValue();
			var geom = this.get('geom');

			scalingDelta = value.scalingDelta;
			rotationDelta = value.rotationDelta;
			translationDelta = value.translationDelta;

			//this.originUI.position = geom.position;

			// for paperjs groups, setting the transform
			// matrix to identity still allows us to use
			// getPosition() to get the centroid, which is
			// the point around which we want to
			// scale+rotate.

			geom.setMatrix(new paper.Matrix(1,0,0,1,0,0));


			geom.scale(scalingDelta.x, scalingDelta.y, geom.getPosition());
			geom.rotate(rotationDelta, geom.getPosition());
			geom.translate(translationDelta.x, translationDelta.y);

			/*this.rotationUI.position = geom.position;
			this.rotationUI.position.x += this.rotationUI.bounds.width / 2;
			this.rotationUI.rotate(rotationDelta, this.rotationUI.firstSegment.point);
			*/
		},


		renderStyle: function(geom) {
			var value = this.getValue();
			this._fillColor = value.fillColor;
			this._strokeColor = value.strokeColor;
			this._strokeWidth = value.strokeWidth;
			this._visible = this.get('visible');
			if (!this._fillColor.noColor) {
				if (!geom.fillColor) {
					geom.fillColor = new paper.Color(0, 0, 0);
				}

				geom.fillColor.hue = this._fillColor.h;
				console.log("hue for", this.get('name'), value.fillColor);
				geom.fillColor.saturation = this._fillColor.s;
				geom.fillColor.lightness = this._fillColor.l;
				geom.fillColor.alpha = this._fillColor.a;

			} else {
				geom.fillColor = undefined;
			}
			if (!this._strokeColor.noColor) {
				if (!geom.strokeColor) {
					geom.strokeColor = new paper.Color(0, 0, 0);
				}
				geom.strokeColor.hue = TrigFunc.wrap(this._strokeColor.h, 0, 360);
				geom.strokeColor.saturation = this._strokeColor.s;
				geom.strokeColor.lightness = this._strokeColor.l;
				geom.strokeColor.alpha = this._strokeColor.a;
				geom.strokeColor.alpha = this._strokeColor.a;
			} else {
				geom.strokeColor = undefined;
			}

			geom.strokeWidth = this._strokeWidth;
			geom.visible = this._visible;
			if (!this.get('inFocus')) {
				geom.opacity = 0.5;
			} else {
				geom.opacity = 1;
			}
			geom.blendMode = this.get('blendMode_map')[this.get('blendMode').getValue()];

		},



		renderSelection: function(geom) {

			if (this.bboxInvalid) {
				this.createBBox();

			}
			var selected = this.get('selected').getValue();
			var constraint_selected = this.get('constraintSelected').getValue();
			var bbox = this.get('bbox');


			if (selected || constraint_selected) {
				bbox.transform(bbox.matrix.inverted());
				bbox.position = new paper.Point(0, 0);
				bbox.transform(geom.globalMatrix);
				bbox.position = geom.parent.localToGlobal(geom.position);

				geom.selectedColor = this.getSelectionColor();

				bbox.selectedColor = (constraint_selected) ? this.get(constraint_selected + '_color') : this.getSelectionColor();
				bbox.selected = true;
				bbox.visible = true;
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
				this.get('bbox').data = null;
				this.set('bbox', null);
			}
			if (this.get('inheritor_bbox')) {
				this.get('inheritor_bbox').remove();
				this.get('inheritor_bbox').data = null;
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