/* ProtoView.js 
 * view for displaying
 * prototypes created by user
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'handlebars'

], function($, _, Backbone, Handlebars) {
	var template, source, prototypes, currentId;
	var canvasDown = false;
	var ProtoView = Backbone.View.extend({
		//
		initialize: function() {
			source = $('#protoTemplate').html();
			template = Handlebars.default.compile(source);
			prototypes = [];
			currentId = -1;
			$("#canvas").bind('mousedown', function() {
				canvasDown = true;
			});
			$("#canvas").bind('mouseup', {
				model: this.model
			}, this.canvasMouseUp);
			this.listenTo(this.model, "protoypeViewModified", this.addPrototype);

		},

		events: {
			"mouseup": "checkAddPrototype",
			"mousedown #canvas": "canvasMouseDown",
			"mousedown .proto-item": "assignId",
			"mouseup .proto-item": "removeId",

		},

		assignId: function(event) {
			var clickedEl = $(event.currentTarget);
			currentId = clickedEl.attr("id");
		},

		removeId: function() {
			currentId = -1;
		},

		checkAddPrototype: function() {
			if (canvasDown) {
				var protoParams = this.model.addPrototype();
				console.log('adding prototype', protoParams);
				if (protoParams) {
					this.addPrototype(protoParams.geom, protoParams.id);
				}
			}
		},

		canvasMouseUp: function(event) {
			canvasDown = false;
			if (currentId > -1) {
				console.log("instantiatePrototype");
				event.data.model.geometryInstantiated(currentId, event.offsetX, event.offsetY);
				currentId = -1;
			}

		},


		addPrototype: function(geom, id, mod) {
			console.log('triggering prototype', geom, id);
			var hScale = 75 / geom.bounds.height;
			console.log('hScale', hScale);
			console.log('height', geom.bounds.height);
			geom.scale(hScale);
			console.log('height', geom.bounds.height);

			geom.position.x = 50;
			geom.position.y = 37;

			geom.data.instance = null;
			geom.visible = true;
			var psvg = geom.exportSVG({
				asString: true
			});
			geom.remove();
			console.log('id=', id);
			var data = {
				label: 'foo',
				name: id,
				svgsrc: psvg
			};
			if (mod) {
				for (var i = 0; i < prototypes.length; i++) {
					if (prototypes[i].name === id) {
						prototypes.splice(i, 1, data);
						console.log('index=', i);
						break;
					}

				}
			} else {
				prototypes.push(data);
			}
			var html = template({
				proto: prototypes
			});
			$('#proto-menu').html(html);
		},



	});
	return ProtoView;
});