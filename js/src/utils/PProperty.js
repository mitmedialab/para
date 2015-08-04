/*PProperty.js
 * constrainable value in para
 * essentially a wrapper class for cjs functionality
 *
 */

define([
	'underscore',
	'jquery',
	'backbone',
	'cjs'
], function(_, $, Backbone, cjs) {

	var PProperty = Backbone.Model.extend({
		/*constructor
		 * creates a new cjs based on the value passed in
		 */

		defaults: {
			name: 'PProperty',
			type: 'PProperty',
		},
		//callback triggered when a subproperty is modified externally 
		modifyProperty: function() {
			console.log('change on PProperty',this.get('name'));
			this.trigger('changed',this);
		},

		constructor: function(val, operator) {
			Backbone.Model.apply(this, arguments);
			this._val = cjs(val);

			var target = this;
			this._val.onChange(function() {
				console.log('changed',target);
				//target.modifyProperty.call(target);
			});
			//this.storage =  val;
			if (operator) {
				this.set('operator', operator);
			}

		},
		getValue: function() {
		
			return this._val.get();
		},

		setValue: function(val) {
			this._val.set(val);
		},

		
		isValid: function(){
			return this._val.isValid();
		},

		//invalidate all constrainable properties
		invalidate: function() {
			this._val.invalidate();
		}


		//no toJSON required

	});

	return PProperty;
});