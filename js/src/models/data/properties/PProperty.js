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
		
		
		constructor: function(val, operator) {
			//Backbone.Model.apply(this, arguments);
			this._val = cjs(val);

			var callback = this.modified;
			var target = this;
			this._val.onChange(function() {
				callback.call(target);
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
			var set;
			this._val.set(val);
			return this._val.isValid();
		},

		//callback triggered when a subproperty is modified externally 
		modified: function() {
			this.trigger('modified', this);
		},

		
		isValid: function(){
			return this._val.isValid();
		},

		//invalidate all constrainable properties
		invalidate: function() {
			this._val.invalidate();
		},

		deleteSelf: function(){
			this.stopListening();
			this._val.offChange();
			//this._val.set(0);
			this._val.destroy();
		},




		//no toJSON required

	});

	return PProperty;
});