/*CollectionView
 * mananges the UI for the collection elements
 */


define([
	'jquery',
	'underscore',
	'backbone',
	'utils/analytics'

], function($, _, Backbone, analytics) {


	var CollectionView = Backbone.View.extend({


		initialize: function() {
				this.disable('group');
				this.disable('list');
				this.disable('duplicator');
				this.disable('ungroup');
				console.log('model',this.model);
		},


		events: {
			'click': 'clickEvent'
		},

		enable: function(type) {
			if($('#' + type).is(':disabled')){
			$('#' + type).removeAttr('disabled');
			var bg = $('#' + type).css('backgroundPosition').split(" ")[1];
			var bgpos = parseInt(bg.replace("px", ""));
			console.log('background position=', bgpos);
			$('#' + type).css({
				backgroundPositionY: bgpos + 54

			});
			}

		},

		disable: function(type) {
			if(!$('#' + type).is(':disabled')){
			document.getElementById(type).disabled = true;
			var bg = $('#' + type).css('backgroundPosition').split(" ")[1];
			var bgpos = parseInt(bg.replace("px", ""));
			console.log('background position=', bgpos);
			$('#' + type).css({
				backgroundPositionY: bgpos - 54

			});
}

		},

		clickEvent: function(event) {
			console.log('click event on target', event.target.id);
			switch(event.target.id){
				case 'ungroup':
					this.model.unGroup();
				break;
				default: 
					this.model.addObject(event.target.id);
				break;
			}
		},

		toggleCollectionButtons: function(selected) {
			console.log('toggle collections buttons', selected);
			if (selected.length < 1) {
				this.disable('group');
				this.disable('list');
				this.disable('duplicator');
				this.disable('ungroup');
			} else {
				var collections = selected.filter(function(item) {
					return (item.get('type') == 'collection' || item.get('name') == 'group');
				});
				if (collections.length == selected.length) {
					this.enable('ungroup');
				} else {
					this.disable('ungroup');
				}
				if (selected.length > 1) {
					console.log('enabling buttons');
					this.enable('group');
					this.disable('duplicator');
					this.enable('list');
				} else {
					this.disable('group');
					this.disable('list');
					this.enable('duplicator');
				}
			}
		}

	});
	return CollectionView;
});