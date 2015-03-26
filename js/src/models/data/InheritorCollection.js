/*InheritorCollection.js
constrainable property that stores an instance's inheritors
*/

define([
		'underscore',
		'utils/PConstraint',
		'utils/PFloat'
	],

	function(_, PConstraint, PFloat) {

		var InheritorCollection = PConstraint.extend({
			constructor: function(instance_parent) {
				PConstraint.apply(this, arguments);
				this.inheritors = [];
				this.num = new PFloat(0);
				this.set('operator', 'set');
				this.instance_parent = instance_parent;
			},

			/* isConstrained
			 * returns object with booleans for each inheritor based on constraint status
			 */

			addInheritor: function(inheritor) {
				this.inheritors.push(inheritor);
				this.num.setValue(1);
			},

			removeInheritor: function(inheritor) {
				inheritor.deleteSelf();
				var index = _.indexOf(this.inheritors, inheritor);
				this.inheritors.splice(index, 1);
				this.num.setValue(1);
			},

			isConstrained: function() {
				var data = {};
				data.self = this.isSelfConstrained();
				data.inheritors = [];
				for (var i = 0; i < this.inheritors.length; i++) {
					data.inheritors.push(this.inheritors[i].isConstrained().self);
				}
				return data;
			},

			getConstraint: function() {
				var data = {};
				data.self = this.getSelfConstraint();
				data.inheritors = [];
				for (var i = 0; i < this.inheritors.length; i++) {
					data.inheritors.push(this.inheritors[i].getConstraint().self);
				}
				return data;
			},

			getSelfConstraint: function() {
				return this;
			},

			setValue: function(data) {
				console.log('calling set value for InheritorCollection for', this.instance_parent.get('id'));
				var inheritor_data = data.inheritors;
				for (var i = 0; i < inheritor_data.length; i++) {
					var inheritor;
					if (this.inheritors.length <= i) {
						inheritor = this.instance_parent.create();
					} else {
						inheritor = this.inheritors[i];
					}
					inheritor.setValue(inheritor_data[i]);
				}

				//TODO: will need error handling for when inheritors that are constraining other objects are removed
				var difference = this.inheritors.length - inheritor_data.length;
				for (var j = 0; j < difference; j++) {
					this.removeInheritor(this.inheritors[this.inheritors.length - 1]);
				}

			},

			getValue: function() {
				if (!this.isSelfConstrained()) {
					var inheritor_values = [];
					for (var i = 0; i < this.inheritors.length; i++) {
						inheritor_values.push(this.inheritors[i].getValue());
					}
					return {
						inheritors: inheritor_values,
						num: this.num.getValue()
					};
				} else {
					return this.getSelfConstraint().getValue();
				}
			},

			//returns actual inheritors themselves rather than constraint values
			accessProperty: function() {
				if (!this.isSelfConstrained()) {
					return this.inheritors;

				} else {
					return this.getSelfConstraint().accessProperty;
				}
			},

			//overrides PConstraint modifyProperty method
			modifyProperty: function(data){
				console.log('modify property for inheritors',data);
				if(data.inheritors){
					this.setValue(data);
				}
			}

		});

		return InheritorCollection;
	});