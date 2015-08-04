/* FunctionManager.js
 * class for managing function creation, storage and lookup
 */

define([
	'underscore',
	'backbone',
	'models/data/functions/FunctionNode',
	'utils/PConstraint',
	'utils/Utils',
	'models/data/Instance'

], function(_, Backbone, FunctionNode, PConstraint, Utils, Instance) {
	//datastructure to store path functions

	var functioncount = 0;
	var ParameterNode = {

		setName: function(name) {
			this.set('param_name', name);
		},

		setCalled: function(called) {
			this.set('called', called);
			if (called) {
				if (this.cf) {
					this.cf.call(this);
				}
			}
		},

		renderStyle: function(geom) {
			geom.fillColor = 'black';
			geom.fillColor.alpha = 0.25;
			geom.dashArray = [6, 8];
			geom.strokeColor = '#989898';
			geom.strokeWidth = 2.5;
			geom.visible = this.get('visible');
		},


		//sets the argument for this parameter
		setArgument: function(instance) {
			var currentArgument = this.get('f_argument');
			if (currentArgument) {
				currentArgument.removeConstraint();
			}
			this.set('f_argument', instance);
			var relative = instance;
			var reference = this;
			this.cf = function() {
				var v = reference.getValue();
				relative.setValue(v);
				return v;
			};
			instance.setConstraint(this.cf, reference);
		},

	
		toJSON: function() {
			// adds argument property id
			var data = Instance.prototype.toJSON.call(this, arguments);
			// data.argument = this.get('f_argument').get('id');
			data.param_name = this.get('param_name');
			return data;
		}

	};


	var FunctionManager = Backbone.Model.extend({
		defaults: {},


		initialize: function() {
			this.rootFunctions = [];
			this.functions = this.rootFunctions;

		},

		createFunction: function(name, childList) {
			var f = new FunctionNode();
			f.set('f_name', 'function:' + functioncount);
			functioncount++;
			var centers = {
				x: 0,
				y: 0
			};
			for (var i = 0; i < childList.length; i++) {
				//this.convert(paramList[i]);
				//f.addParameter(paramList[i]);
				childList[i].hide();
				childList[i].get('selected').setValue(false);
				var center = childList[i].getValueFor('center');
				centers.x += center.x;
				centers.y += center.y;
				switch (childList[i].get('type')) {

					case 'collection':
						f.lists.push(childList[i]);
						var members = childList[i].getInstanceMembers();
						members.forEach(function(item) {
							f.addChildNode(item);
							item.hide();
						});
						break;
					case 'function':
						f.functions.push(childList[i]);
						break;
					default:
						f.addChildNode(childList[i]);


						break;
				}
			}
			centers.x /= childList.length;
			centers.y /= childList.length;
			var data = {
				translationDelta: centers
			};
			f.setValue(data);
			this.functions.push(f);
			this.listenTo(f, 'request_selected', this.sendSelectedInstances);
		},

		callFunction: function(func) {
			if (!func.get('called')) {
				func.call();

			} else {
				func.uncall();

			}
		},

		toggleOpenFunctions: function(currentNode, func) {
			currentNode.close();
			var children = func.open();
			this.functions = func.functions;
			return {
				toSelect: children,
				currentNode: func,
				lists: func.lists
			};
		},

		toggleClosedFunctions: function(currentNode, rootNode) {
			var nCurrent;
			var parent = currentNode.close();
			var toSelect = currentNode;
			if (parent) {
				nCurrent = parent;
				this.functions = parent.functions;
			} else {
				nCurrent = rootNode;
				this.functions = this.rootFunctions;
			}
			nCurrent.open();
			return {
				currentNode: nCurrent,
				toSelect: toSelect
			};

		},

		closeAllFunctions: function() {
			for (var i = 0; i < this.functions.length; i++) {
				this.functions[i].close();
			}
		},

		convert: function(instance) {

			for (var k in ParameterNode) {
				if (ParameterNode.hasOwnProperty(k)) {
					instance[k] = ParameterNode[k];
				}
			}
			var parent = instance;
			_.each(instance.attributes, function(val, key) {
				if (val instanceof PConstraint) {
					instance.stopListening(val);
				}
			});
		},

		addParamToFunction: function(func, instance) {
			if (func.get('name') !== 'root') {
				this.convert(instance);
				func.addParameter(instance);
			}
		},

		sendSelectedInstances: function(func) {
			func.setArgument(this.selected);
		}


	});
	return FunctionManager;
});