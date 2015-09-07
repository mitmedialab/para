/* LayersView.js
 * controls updates to the layers menu
 */

define([
	'jquery',
	'underscore',
	'paper',
	'backbone',
	'handlebars',
	'fancytree',
	"text!html/layers_ui.html"

], function($, _, paper, Backbone, Handlebars, fancytree, ui) {
	var shapeTree, listTree, constraintTree, shapeRoot, listRoot, constraintRoot, source, template, relIcon, refIcon, connector;
	var currentRef, currentRel;

	var LayersView = Backbone.View.extend({

		events: {
			'mousedown.filled': 'argumentClicked',
			'click #delete': 'deleteActive'
		},

		initialize: function() {
			this.$el.append(ui);

			//source = $('#constraint_template').html();
			//template = Handlebars.default.compile(source);
			var view = this;
			this.$('#shapes').fancytree({
				source: [],
				extensions: ["dnd", "edit"],
				collapse: this.treeCollapsed,
				dnd: {
					autoExpandMS: 400,
					focusOnClick: true,
					preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
					preventRecursiveMoves: true, // Prevent dropping nodes on own descendants
					dragStart: function(node, data) {
						return true;
					},
					dragEnter: function(node, data) {
						return true;
					},
					dragDrop: function(node, data) {
						data.otherNode.moveTo(node, data.hitMode);
						view.dropCompleted(data.otherNode, node, data.hitMode);
					}
				}
			});
			this.$('#lists').fancytree({
				source: [],
				extensions: ["dnd", "edit"],
				expand: this.treeExpanded,
				collapse: this.treeCollapsed,
				dnd: {
					autoExpandMS: 400,
					focusOnClick: true,
					preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
					preventRecursiveMoves: true, // Prevent dropping nodes on own descendants
					dragStart: function(node, data) {
						return true;
					},
					dragEnter: function(node, data) {
						return true;
					},
					dragDrop: function(node, data) {
						data.otherNode.moveTo(node, data.hitMode);
						view.dropCompleted(data.otherNode, node, data.hitMode);
					}
				}
			});

			this.$('#constraints').fancytree({
				source: [],
				extensions: ["dnd", "edit"],
				expand: this.treeExpanded,
				collapse: this.treeCollapsed,
				dnd: {
					autoExpandMS: 400,
					focusOnClick: true,
					preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
					preventRecursiveMoves: true, // Prevent dropping nodes on own descendants
					dragStart: function(node, data) {
						return true;
					},
					dragEnter: function(node, data) {
						return true;
					},
					dragDrop: function(node, data) {
						data.otherNode.moveTo(node, data.hitMode);
						view.dropCompleted(data.otherNode, node, data.hitMode);
					}
				}
			});

			shapeTree = $("#shapes").fancytree("getTree");
			listTree = $("#lists").fancytree("getTree");
			constraintTree = $("#constraints").fancytree("getTree");
			$("#shapes").bind('fancytreeexpand', {
				view: this
			}, this.treeExpanded);

			$("#shapes").bind("fancytreecollapse", {
				view: this
			}, this.treeCollapsed);
			$("#lists").bind('fancytreeexpand', {
				view: this
			}, this.treeExpanded);
			$("#lists").bind("fancytreecollapse", {
				view: this
			}, this.treeCollapsed);

			$("#shapes").bind("click", {
				view: this
			}, this.shapeClicked);
			$("#lists").bind("click", {
				view: this
			}, this.listClicked);

			$("#constraints").bind("click", {
				view: this
			}, this.constraintClicked);


			var self = this;
			$('html').keyup(function(e) {
				if (e.keyCode == 46 || e.keyCode == 8) {
					//self.deleteActive();
				}
			});

			shapeRoot = $("#shapes").fancytree("getRootNode");
			listRoot = $("#lists").fancytree("getRootNode");
			constraintRoot = $("#constraints").fancytree("getRootNode");

			$('#constraint_list').bind("click", {
				view: this
			}, this.P);
			relIcon = $('#constraint_rel');
			refIcon = $('#constraint_ref');

			connector = $('#connector_line');


			this.$('#layers').bind('scroll', function() {
				self.positionConstraintIcons();
			});
			this.hideConstraintIcons();
			this.resetConstraintHeight();
		},

		hideConstraintIcons: function() {
			relIcon.css({
				visibility: 'hidden'
			});
			refIcon.css({
				visibility: 'hidden'
			});
			connector.css({
				visibility: 'hidden'
			});
		},

		positionConstraintIcons: function(checkVisible) {
			this.toggleConstraintsForAllNodes();
			if (currentRef && currentRel) {
				var ref = shapeTree.getNodeByKey(currentRef);
				var rel = shapeTree.getNodeByKey(currentRel);

				if (!ref) {
					ref = listTree.getNodeByKey(currentRef);
				}
				if (!rel) {
					rel = listTree.getNodeByKey(currentRel);
				}
				ref.setSelected();
				rel.setSelected();
				if (!rel.isVisible() && !checkVisible) {
					var view = this;
					rel.makeVisible().done(function() {
						view.positionRef(rel, ref);
					});
				} else {
					if (checkVisible) {
						this.hideConstraintIcons();

					} else {
						this.positionRef(rel, ref, checkVisible);
					}
				}
			} else {
				this.hideConstraintIcons();
			}
		},

		positionRef: function(rel, ref, checkVisible) {
			if (!ref.isVisible() && !checkVisible) {
				var view = this;
				ref.makeVisible().done(function() {
					view.styleIcons(rel, ref);
				});
			} else {
				if (checkVisible) {
					this.hideConstraintIcons();

				} else {
					this.styleIcons(rel, ref);
				}
			}
		},

		styleIcons: function(rel, ref) {
			var p1 = $(rel.span).offset();
			var p2 = $(ref.span).offset();
			var bc1 = $(rel.span).css('backgroundColor');
			var bc2 = $(ref.span).css('backgroundColor');
			var bp = p1.top < p2.top ? -175 : -245;
			$('#constraint_rel').css({
				top: Math.floor(p1.top) - 111,
				backgroundColor: bc1,
				backgroundPositionY: bp,
				backgroundPositionX: -1,
				visibility: 'visible'
			});
			$('#constraint_ref').css({
				top: Math.floor(p2.top) - 111,
				backgroundColor: bc2,
				backgroundPositionX: -1,
				visibility: 'visible'
			});
			var length = Math.abs(p1.top - p2.top);
			var connectorTop = p1.top < p2.top ? p1.top : p2.top;
			$('#connector_line').css({
				height: length,
				top: connectorTop + 15 - 111,
				visibility: 'visible'
			});
		},

		treeExpanded: function(event) {
			event.data.view.resetConstraintHeight();
		},

		treeCollapsed: function(event) {
			event.data.view.resetConstraintHeight();
			event.data.view.positionConstraintIcons(true);
		},

		resetConstraintHeight: function() {
			var height = $('div#layers').outerHeight();
			$('#constraint_viz').height(height);

		},

		toggleConstraintsForAllNodes: function() {
			var selectedNodes = shapeTree.getSelectedNodes();
			selectedNodes = selectedNodes.concat(listTree.getSelectedNodes());
			selectedNodes.forEach(function(item) {
				item.setSelected(false);
			});
		},

		setLayerActive: function(instanceId, layerId) {

		},

		constraintClicked: function(event) {
			shapeTree.activateKey(false);
			listTree.activateKey(false);
			event.data.view.visualizeConstraint();

		},

		visualizeConstraint: function() {
			var activeNode = constraintTree.getActiveNode();
			if (activeNode) {
				this.model.updateMapView(activeNode.key);
				var constraint = this.model.getConstraintById(activeNode.key);
				var pRef = currentRef;
				var pRel = currentRel;
				currentRef = constraint.get('proxy_references') ? constraint.get('proxy_references').get('id') : constraint.get('references').get('id');
				currentRel = constraint.get('proxy_relatives') ? constraint.get('proxy_relatives').get('id') : constraint.get('relatives').get('id');
				activeNode.status = 'opened';
				this.positionConstraintIcons();
				this.model.visualizeConstraint(currentRef, currentRel, pRef, pRel);
			}
		},

		//TODO: currently only works on constraints, should work on all objects
		deleteActive: function() {
			var active = constraintTree.getActiveNode();

			if (!active) {
				active = shapeTree.getActiveNode();
			}
			if (!active) {
				active = listTree.getActiveNode();
			}
			if (active) {
				this.model.removeObjectById(active.key);
			}

		},

		deleteAll: function() {
			shapeRoot.removeChildren();
			listRoot.removeChildren();
			constraintRoot.removeChildren();
			this.deactivateConstraint();
			this.resetConstraintHeight();

		},

		dropCompleted: function(nodeA, nodeB, hitMode) {
			this.model.reorderShapes(nodeA.key, nodeB.key, hitMode);
			var stored = nodeA.data.zIndex;
			nodeA.data.zIndex = nodeB.data.zIndex;
			nodeB.data.zIndex= stored;
		},

		shapeClicked: function(event) {
			var id = event.target.id;
			var activeNode = shapeTree.getActiveNode();
			constraintTree.activateKey(false);
			event.data.view.model.visualizeConstraint();
			listTree.activateKey(false);
			if (activeNode) {
				var shape = event.data.view.model.getById(activeNode.key);
				event.data.view.deselectAllNodes('lists');
				event.data.view.itemClicked(id, activeNode, shape);
				event.data.view.positionConstraintIcons();
			}
		},

		listClicked: function(event) {
			var id = event.target.id;
			var activeNode = listTree.getActiveNode();
			constraintTree.activateKey(false);
			event.data.view.model.visualizeConstraint();
			shapeTree.activateKey(false);
			var shape = event.data.view.model.getById(activeNode.key);
			event.data.view.deselectAllNodes('shapes');
			event.data.view.itemClicked(id, activeNode, shape);
			event.data.view.positionConstraintIcons();
		},

		deselectAllNodes: function(tree) {
			var s_tree;
			switch (tree) {
				case 'lists':
					s_tree = listTree;
					break;
				case 'constraints':
					s_tree = constraintTree;
					break;
				case 'shapes':
					s_tree = shapeTree;
					break;
			}
			var active = s_tree.getActiveNode();
			if (active) {
				active.setActive(false);
			}

		},

		itemClicked: function(id, activeNode, shape) {
			switch (id) {
				case 'constraint':
					break;
				case 'visible':
					this.toggleVisibility(activeNode, shape);
					break;
				case 'select_button':
					this.toggleSelection(activeNode, shape);
			}
		},

		toggleVisibility: function(activeNode, shape) {
			if (shape.get('visible')) {
				this.hideNode(activeNode);
				this.deselectNode(activeNode);
				this.model.hideShape(shape);
			} else {
				this.showNode(activeNode);
				this.model.showShape(shape);
			}
		},

		toggleSelection: function(activeNode, shape) {
			var select = shape.get('selected').getValue();
			this.deselectAll(shapeRoot, true);
			if (!select) {
				this.model.selectShape(shape);
				this.selectNode(activeNode);
			} else {
				this.model.deselectShape(shape);
				this.deselectNode(activeNode);
			}
		},

		updateSelection: function(selected_shapes) {
			this.deselectAll(shapeRoot);
			this.deselectAll(listRoot);
			for (var i = 0; i < selected_shapes.length; i++) {
				var node;
				switch (selected_shapes[i].get('type')) {
					case 'collection':
					case 'sampler':
						node = listTree.getNodeByKey(selected_shapes[i].get('id'));
						break;
					case 'geometry':
						node = shapeTree.getNodeByKey(selected_shapes[i].get('id'));
						break;
				}
				this.selectNode(node);
			}
		},

		deselectAll: function(root, toModel) {
			var children = root.getChildren();
			if (root.li) {
				this.deselectNode(root);
				if (toModel) {
					this.model.deselectShape(root.key);
				}

			}
			if (children) {
				for (var i = 0; i < children.length; i++) {
					this.deselectAll(children[i], toModel);
				}
			}
		},

		addShape: function(shape, parentId) {
			var index = shape.zIndex;
			if (!index) {
				index = 0;
			}
			this.deselectAll(shapeRoot);
			this.deselectAll(listRoot);
			var s = {
				title: shape.name,
				key: shape.id,
				zIndex: index,
			};
			var parentNode;
			if (parentId) {
				parentNode = shapeTree.getNodeByKey(parentId);
			} else {
				parentNode = shapeRoot;
			}
			var node;
			if (parentNode.children) {
				node = parentNode.children.length > 0 ? parentNode.addChildren(s, 0) : parentNode.addChildren(s);
			} else {
				node = parentNode.addChildren(s);
			}
			this.selectNode(node);
			this.resetConstraintHeight();
			for (var i = 0; i < shape.children.length; i++) {
				if (shape.children[i].name != 'point') {
					this.addShape(shape.children[i], shape.id);
				}
			}



		},

		removeShape: function(pId) {
			var node = shapeTree.getNodeByKey(pId);
			if (node) {
				node.remove();
				this.resetConstraintHeight();
			} else {
				console.error('could not find node to remove');
			}
		},

		removeChildren: function(pId) {
			var node = shapeTree.getNodeByKey(pId);
			node.removeChildren();
		},

		sortChildren: function(pId) {
			var node = shapeTree.getNodeByKey(pId);
			node.sortChildren(function(a, b) {
				console.log('a', a.data.zIndex, 'b', b.data.zIndex);
				if (a.data.zIndex < b.data.zIndex) {
					console.log('returning -1');

					return 1;
				} else {
					console.log('returning 1');

					return -1;
				}
			});
		},

		moveShape: function(pId, nodeId) {
			var node = shapeTree.getNodeByKey(pId);
			var parentNode = shapeTree.getNodeByKey(nodeId);
			if (node && parentNode) {
				node.moveTo(parentNode, 'child');
			}

		},

		addChild: function(shape, pId) {
			this.deselectAll(shapeRoot);
			this.deselectAll(listRoot);
			var parentNode = shapeTree.getNodeByKey(pId);
			if (parentNode) {
				var s = {
					title: shape.name,
					key: shape.id
				};
				var node;
				if (parentNode.children) {
					node = parentNode.children.length > 0 ? parentNode.addChildren(s, 0) : parentNode.addChildren(s);
				} else {
					node = parentNode.addChildren(s);
				}

				this.selectNode(node);

				this.resetConstraintHeight();
			}
		},

		/*removeChild:function(childId, parentId, delete){
			this.deselectAll(shapeRoot);
			this.deselectAll(listRoot);
			
		},*/



		addList: function(list) {
			this.deselectAll(shapeRoot);
			this.deselectAll(listRoot);
			var listData = {
				title: list.name,
				key: list.id
			};
			var listNode;
			if (listRoot.children) {
				listNode = listRoot.children.length > 0 ? listRoot.addChildren(listData, 0) : listRoot.addChildren(listData);
			} else {
				listNode = listRoot.addChildren(listData);
			}
			this.selectNode(listNode);
			this.resetConstraintHeight();
			this.visualizeConstraint();
		},

		removeCollection: function(pId) {
			var node = listTree.getNodeByKey(pId);
			if (node) {
				node.remove();
				this.resetConstraintHeight();
			} else {
				console.error('could not find node to remove');
			}
		},

		addConstraint: function(data) {
			this.deselectAll(shapeRoot);
			this.deselectAll(listRoot);
			this.deselectAll(constraintRoot);
			var constraintData = {
				title: data.get('name'),
				key: data.get('id'),
				rel: data.get('relatives').get('id'),
				ref: data.get('references').get('id')
			};
			var constraintNode;
			if (constraintRoot.children) {
				constraintNode = constraintRoot.children.length > 0 ? constraintRoot.addChildren(constraintData, 0) : constraintRoot.addChildren(constraintData);
			} else {
				constraintNode = constraintRoot.addChildren(constraintData);
			}
			this.selectNode(constraintNode);
			constraintNode.setActive(true);
			shapeTree.activateKey(false);
			listTree.activateKey(false);
			this.resetConstraintHeight();
			this.visualizeConstraint();
		},

		getActiveConstraint: function() {
			var node = constraintTree.getActiveNode();
			if (node) {
				return node.key;
			}
		},

		removeConstraint: function(pId) {
			var node = constraintTree.getNodeByKey(pId);
			if (node) {
				node.remove();
				currentRef = null;
				currentRel = null;
				this.resetConstraintHeight();
				this.positionConstraintIcons();
			} else {
				console.error('could not find node to remove');
			}
		},

		deactivateConstraint: function() {
			currentRef = null;
			currentRel = null;
			var active = constraintTree.getActiveNode();
			if (active) {
				active.setActive(false);
			}
			this.positionConstraintIcons();
		},

		selectNode: function(node) {
			var b = $(node.li).find('#select_button');
			$(b[0]).addClass('selected');
		},

		deselectNode: function(node) {
			var b = $(node.li).find('#select_button');
			$(b[0]).removeClass('selected');
		},

		hideNode: function(node) {
			var b = $(node.li).find('#visible');
			$(b[0]).addClass('hidden');
		},

		showNode: function(node) {
			var b = $(node.li).find('#visible');
			$(b[0]).removeClass('hidden');
		},

		getCurrentRef: function() {
			return currentRef;
		},

		getCurrentRel: function() {
			return currentRel;
		},



	});
	return LayersView;
});