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
			
			//this retains the constraint on an object
			this.getValue();	
			this._val.set(val);
			return this._val.isValid();
		},

		isValid: function(){
			return this._val.isValid();
		},

		onValueChanged: function(handler) {
			this._val.onChange(handler);
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
