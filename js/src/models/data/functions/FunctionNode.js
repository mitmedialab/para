/*FunctionNode.js
 * Node which stores a user-defined function
 */


define([
		'underscore',
		'paper',
		'models/data/Instance',
		'utils/PConstraint',
	],


	function(_, paper, Instance, PConstraint) {

		var FunctionNode = Instance.extend({
		

			defaults: _.extend({}, Instance.prototype.defaults, {
				name: 'function',
				type: 'function',
				f_name: '',
				f_parameters: null,
				open: false,
			}),

			initialize: function() {
				Instance.prototype.initialize.apply(this, arguments);
				this.set('f_parameters', []);
				this.get('translation_delta').setNull(false);
				var rectangle = new paper.Rectangle(new paper.Point(0, 0), new paper.Size(100, 100));
				var path = new paper.Path.Rectangle(rectangle);
				path.strokeColor = this.get('primary_selection_color');
				path.fillColor = 'black';
				path.name = 'box';

				this.nameText = new paper.PointText({
					point: new paper.Point(5, 13),
					content: 'foo',
					justification: 'left',
					fontSize: 12,
					fontFamily: 'Source Sans Pro',
					fillColor: this.get('primary_selection_color')
				});

				var geom = new paper.Group();
				geom.addChild(path);
				geom.addChild(this.nameText);
				this.nameText.data.instance = geom.data.instance = path.data.instance = this;
				this.set('geom',geom);
				this.lists = [];
			},


			addParameter: function(param){
				this.get('f_parameters').push(param);
				this.addChildNode(param);
			},

			open:function(){
				this.set('open',true);
				for(var i=0;i<this.children.length;i++){
					this.children[i].show();
				}
				return this.children;
			},

			close: function(){
				this.set('open',false);
				for(var i=0;i<this.children.length;i++){
					this.children[i].close();
					this.children[i].hide();
				}
				return this.getParentNode();
			},

			compile: function() {
			},

			render: function() {
				 var geom = this.get('geom');
				 var open = this.get('open');
				if (!open) {
					geom.visible = true;
					geom.position = this.get('translation_delta').toPaperPoint();
					this.nameText.content = this.get('f_name');
					this.renderSelection(geom.children['box']);
				}
				else{
					geom.visible = false;
				}

			}

		});

		return FunctionNode;
	});