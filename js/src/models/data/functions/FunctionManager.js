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
				console.log('reference constraint value', v);
				relative.setValue(v);
				return v;
			};
			instance.setConstraint(this.cf, reference);
		},

		propertyModified: function() {
			console.log('triggering param modified');
			this.trigger('modified', this);
			if (this.cf && this.get('called')) {
				this.cf.call(this);
			}
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
				childList[i].set('selected', false);
				var center = childList[i].accessProperty('center');
				centers.x += center.x;
				centers.y += center.y;
				switch (childList[i].get('type')) {

					case 'collection':
						console.log('adding list to function');
						f.lists.push(childList[i]);
						var members = childList[i].getInstanceMembers();
						console.log('list members', members);
						members.forEach(function(item) {
							console.log('adding list child to function');
							f.addChildNode(item);
							item.hide();
						});
						break;
					case 'function':
						console.log('adding function to function');
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
				translation_delta: centers
			};
			f.modifyProperty(data);
			this.functions.push(f);
			this.listenTo(f, 'request_selected', this.sendSelectedInstances);
		},

		callFunction: function(func) {
			console.log('checking function called', func.get('called'));
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
				console.log('setting current to parent');
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
			console.log('converting instance');

			console.log('parameterNode', ParameterNode);
			for (var k in ParameterNode) {
				if (ParameterNode.hasOwnProperty(k)) {
					console.log('converting property', k);
					instance[k] = ParameterNode[k];
				}
			}
			console.log(instance.propertyModified);
			var parent = instance;
			_.each(instance.attributes, function(val, key) {
				if (val instanceof PConstraint) {
					instance.stopListening(val);
					instance.listenTo(val, 'modified', instance.propertyModified);
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