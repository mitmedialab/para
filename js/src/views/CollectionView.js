/*CollectionView
 * mananges the UI for the collection elements
 */


define([
	'jquery',
	'underscore',
	'backbone',
	'utils/analytics'

], function($, _, Backbone, analytics) {

	var countVal;
	var CollectionView = Backbone.View.extend({


		initialize: function() {
			this.disable('group');
			this.disable('list');
			this.disable('duplicator');
			this.disable('ungroup');
			this.disable('count');
		},


		events: {
			'click': 'clickEvent',
			'change #count': 'countChange'
		},

		enable: function(type) {
			if ($('#' + type).is(':disabled')) {
				$('#' + type).removeAttr('disabled');
				var bg = $('#' + type).css('backgroundPosition').split(" ")[1];
				var bgpos = parseInt(bg.replace("px", ""));
				$('#' + type).css({
					backgroundPositionY: bgpos + 54

				});
			}

		},

		disable: function(type) {
			if (!$('#' + type).is(':disabled')) {
				document.getElementById(type).disabled = true;
				var bg = $('#' + type).css('backgroundPosition').split(" ")[1];
				var bgpos = parseInt(bg.replace("px", ""));
				$('#' + type).css({
					backgroundPositionY: bgpos - 54

				});
			}
		},

		clickEvent: function(event) {
			switch (event.target.id) {
				case 'ungroup':
					this.model.unGroup();
					break;
				default:
					this.model.addObject(event.target.id);
					break;
			}
		},

		countChange: function(event) {
		
			var cval = $('#count').val();
			var value = this.verifyNumeric(cval);
			if (value) {
				countVal = +cval;
				this.model.setDuplicatorCount(+cval);
			} else {
				alert('please enter a number');
				$('#count').val(countVal);
			}
		},

		verifyNumeric: function(value) {
			return !isNaN(value);
		},

		setCount: function(item) {
			if (!item) {
				$('#count').val("");
			} else {

				if (item instanceof Array) {
					var count = item[0].getRange();
					var same = true;
					for (var i = 1; i < item.length; i++) {
						if (item[i].getRange() !== count) {
							same = false;
							break;
						}
					}
					$('#count').val(same ? count : "");
				} else {
					$('#count').val(item.getRange());
				}
			}
			countVal = +$('#count').val();
		},

		toggleCollectionButtons: function(selected) {
			if (selected.length < 1) {
				this.disable('group');
				this.disable('list');
				this.disable('duplicator');
				this.disable('count');
				this.disable('ungroup');
				this.setCount();
			} else {
				var collections = selected.filter(function(item) {
					return (item.get('type') == 'collection' || item.get('name') == 'group');
				});
				var duplicators = collections.filter(function(item) {
					return (item.get('name') == 'duplicator');
				});
				if (collections.length == selected.length) {
					this.enable('ungroup');
					this.setCount(selected);

				} else {
					this.disable('ungroup');
					this.setCount();
				}
				if (duplicators.length == selected.length) {
					this.enable('count');

				} else {
					this.disable('count');
				}
				if (selected.length > 1) {
					//this.enable('group');
					this.disable('duplicator');
					this.enable('list');
				} else {
					this.disable('group');
					this.disable('list');
					//TODO: right now can only create duplicator on geometry
					if(selected[0].get('type')==='geometry'){
						this.enable('duplicator');
					}
				}
			}
		}

	});
	return CollectionView;
});