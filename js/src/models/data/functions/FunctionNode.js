/*FunctionNode.js
 * Node which stores a user-defined function
 */


define([
		'underscore',
		'paper',
		'models/data/Instance',
		'models/data/geometry/Group',
		'models/data/geometry/GeometryNode',
		'models/data/properties/PConstraint',
		'views/ParametersView',

	],


	function(_, paper, Instance, Group, GeometryNode, PConstraint, ParametersView) {
		var svgstring = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 612 792" enable-background="new 0 0 612 792" xml:space="preserve"><g><path fill="none" stroke="#76787B" stroke-width="1.6375" stroke-miterlimit="10" d="M10,1.9c0,0-3.7,4-10,4s-10-4-10-4 s3.7-7.7,10-7.7S10,1.9,10,1.9z"/><ellipse fill="#76787B" cx="-0.3" cy="-0.9" rx="4.8" ry="5"/></g></svg>';
		var FunctionNode = Group.extend({


			defaults: _.extend({}, Group.prototype.defaults, {
				name: 'function',
				type: 'function',
				f_name: '',
				f_parameters: null,
				open: false,
				called: false,
				showLayers: 'visible',
			}),

			initialize: function(attributes, options) {
				Group.prototype.initialize.apply(this, arguments);
				this.set('f_parameters', []);
				this.get('translationDelta').setNull(false);

				this.lists = [];
				this.selected = [];
				this.functions = [];
				this.layerView = new ParametersView({
					el: 'body',
					model: this,
				});
				this.pcount = 1;
				 //.centerUI.fillColor = 'green';

				this.selectedParam = null;
			},

			deleteAll: function() {
				this.clearUndoCache();
				var data = {};
				data.name = this.get('name');
				data.type = this.get('type');
				data.id = this.get('id');
				data.visible = this.get('visible');
				data.open = this.get('open');
				data.children = [];
				data.rendered = this.get('rendered');
				data._matrix = this._matrix.values;
				return this.parseJSON(data);
			},


			isolate: function() {
				return null;
			},

			deIsolate: function() {
				return null;
			},

			addParameter: function(param) {
				param.setName('param_' + this.pcount);
				this.pcount++;
				this.get('f_parameters').push(param);
				this.listenTo(param, 'delete', this.removeParameter);
				if (this.children.indexOf(param) === -1) {
					this.addChildNode(param);
				}
				this.trigger('change:f_parameters');
			},

			insertChild: function(index, child, registerUndo) {
				Group.prototype.insertChild.call(this, index, child, registerUndo);

				this.listenTo(child, 'modified', this.modified);
				this.trigger('modified', this);
			},


			removeChildNode: function(node, registerUndo) {
				var removed = GeometryNode.prototype.removeChildNode.call(this, node, registerUndo);
				if (removed) {

					this.stopListening(removed);

					this.trigger('modified', this);
					return removed;
				}
			},

			removeParameter: function(param) {
				var params = this.get('f_parameters');
				var index = $.inArray(param, params);
				if (index === -1) {
					return false;
				} else {
					params.splice(index, 1);
					this.stopListening(param);
				}
				this.trigger('change:f_parameters');
			},

			/* requestArgument
			 * called when argument icon is clicked, triggers
			 * the functionManager to send this function
			 * a list of currently selected shapes
			 */
			requestArgument: function(id) {
				this.selectedParam = this.getParamById(id);
				this.trigger('request_selected', this);
			},

			/* setArgument
			 * sets the argument of the currently selected
			 * parameter
			 */
			setArgument: function(instance) {

				if (this.selectedParam) {
					this.selectedParam.setArgument(instance);
					this.trigger('change:f_parameters');
				}
			},

			getParamById: function(id) {
				var params = this.get('f_parameters');
				var param = params.filter(function(item) {
					return item.get('id') === id;
				})[0];
				return param;
			},

			open: function() {
				this.set('open', true);
				this.set('showLayers', 'hidden');

				for (var i = 0; i < this.children.length; i++) {
					this.children[i].show();
				}
				this.trigger('change:showLayers');

				return this.children;
			},

			close: function() {
				this.set('open', false);
				this.set('showLayers', 'visible');

				for (var i = 0; i < this.children.length; i++) {
					this.children[i].close();
					this.children[i].hide();
				}
				this.trigger('change:showLayers');

				return this.getParentNode();
			},

			call: function() {
				this.set('called', true);
				for (var i = 0; i < this.children.length; i++) {
					if (this.children[i].isReturned) {
						this.children[i].show();
					} else {
						this.children[i].hide();
					}
				}
				var params = this.get('f_parameters');
				for (var j = 0; j < params.length; j++) {
					params[j].setCalled(true);
				}
			},

			uncall: function() {
				this.set('called', false);
				for (var i = 0; i < this.children.length; i++) {
					this.children[i].hide();
				}
				var params = this.get('f_parameters');
				for (var j = 0; j < params.length; j++) {
					params[j].setCalled(false);
				}
			},


			childModified: function(child) {
				GeometryNode.prototype.childModified.call(this, child);
			},
			
			reset: function() {
				for (var i = 0; i < this.renderQueue.length; i++) {

					if (this.renderQueue[i] && !this.renderQueue[i].deleted) {
						this.renderQueue[i].reset();
					}
				}
			},

 
			render: function() {

				for (var i = 0; i < this.renderQueue.length; i++) {
					if (this.renderQueue[i] && !this.renderQueue[i].deleted) {
						this.renderQueue[i].render();
					}
				}
				this.renderQueue = [];

			},

			toJSON: function(noUndoCache) {
				// // call prototype
				// // creates params, adds list of all params toJSON
				var data = Group.prototype.toJSON.call(this, noUndoCache);
				/*var functionParams = this.get('f_parameters');
				var paramsList = [];
				_.each(functionParams, function(param) {
					paramsList.push(param.toJSON(noUndoCache));
				});
				data['params'] = paramsList;*/
				return data;
			}

		});

		return FunctionNode;
	});