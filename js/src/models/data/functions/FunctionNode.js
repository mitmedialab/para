/*FunctionNode.js
 * Node which stores a user-defined function
 */


define([
		'underscore',
		'paper',
		'models/data/Instance',
		'models/data/properties/PConstraint',
		'views/ParametersView',

	],


	function(_, paper, Instance, PConstraint, ParametersView) {
		var svgstring = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 612 792" enable-background="new 0 0 612 792" xml:space="preserve"><g><path fill="none" stroke="#76787B" stroke-width="1.6375" stroke-miterlimit="10" d="M10,1.9c0,0-3.7,4-10,4s-10-4-10-4 s3.7-7.7,10-7.7S10,1.9,10,1.9z"/><ellipse fill="#76787B" cx="-0.3" cy="-0.9" rx="4.8" ry="5"/></g></svg>';
		var FunctionNode = Instance.extend({


			defaults: _.extend({}, Instance.prototype.defaults, {
				name: 'function',
				type: 'function',
				f_name: '',
				f_parameters: null,
				open: false,
				called: false,
				showLayers: 'visible',
			}),

			initialize: function() {
				Instance.prototype.initialize.apply(this, arguments);
				this.set('f_parameters', []);
				this.get('translationDelta').setNull(false);
				/*var rectangle = new paper.Rectangle(new paper.Point(0, 0), new paper.Size(100, 100));
				var path = new paper.Path.Rectangle(rectangle);
				path.strokeColor = this.get('primary_selection_color');
				path.fillColor = 'black';
				path.name = 'box';
				var eye = new paper.Group();
				eye.importSVG(svgstring);
				eye.position.x = 15;
				eye.position.y = 90;
				eye.name = 'eye';
				this.nameText = new paper.PointText({
					point: new paper.Point(5, 13),
					content: 'foo',
					justification: 'left',
					fontSize: 12,
					fontFamily: 'Source Sans Pro',
					fillColor: this.get('primary_selection_color')
				});*/

				/*var ui = new paper.Group();
				ui.addChild(path);
				ui.addChild(eye);
				ui.addChild(this.nameText);
				ui.visible = false;
				this.nameText.data.instance = ui.data.instance = path.data.instance = eye.data.instance = this;
				this.set('ui', ui);*/
				this.lists = [];
				this.selected = [];
				this.functions = [];
				this.layerView = new ParametersView({
					el: 'body',
					model: this,
				});
				this.pcount = 1;
				this.selectedParam = null;
			},

			isolate: function(){
				return null;
			},

			deIsolate: function(){
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
					if(this.children[i].isReturned ){
						this.children[i].show();
					}
					else{
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

			compile: function() {
				var open = this.get('open');
				var called = this.get('called');
				var params = this.get('f_parameters');
				if (!open) {
					/*for (var i = 0; i < params.length; i++) {
						params[i].set('visible', false);
					}*/
					this.children.forEach(function(child) {
						if(!child.isReturned){
							child.set('visible', false);
						}
					});

				} else if (open) {
					this.children.forEach(function(child) {

						//child.set('visible', true);
					});
				}
			},

			render: function() {
				/*var ui = this.get('ui');
				var open = this.get('open');
				if (!open) {
					ui.visible = true;
					ui.position = this.get('translationDelta').toPaperPoint();
					this.nameText.content = this.get('f_name');
					this.renderSelection(ui.children['box']);
					if (this.get('called')) {
						ui.children['eye'].visible = true;
					} else {
						ui.children['eye'].visible = false;
					}
				} else {
					ui.visible = false;
				}*/

			},

			toJSON: function() {
				// // call prototype
				// // creates params, adds list of all params toJSON
				var data = Instance.prototype.toJSON.call(this, arguments);
				var functionParams = this.get('f_parameters');
				var paramsList = [];
				_.each(functionParams, function(param) {
        			paramsList.push(param.toJSON());
      			});
      			data['params'] = paramsList;
      			return data;
			}

		});

		return FunctionNode;
	});