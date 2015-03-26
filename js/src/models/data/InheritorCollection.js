/*InheritorCollection.js
constrainable property that stores an instance's inheritors
*/

define([

		'utils/PConstraint'
	],

	function(PConstraint) {

		var InheritorCollection = PConstraint.extend({
			constructor: function(instance_parent){
				this.inheritors = [];
				this.set('operator','set');
				this.instance_parent = instance_parent;
			},

			/* isConstrained
			* returns object with booleans for each inheritor based on constraint status
			*/
			isConstrained: function(){
				var data = {};
				data.self = this.isSelfConstrained();
				data.inheritors = [];
				for(var i=0;i<this.inheritors.length;i++){
					data.inheritors.push(this.inheritors[i].isConstrained().self);
				}
				return data;
			},

			getConstraint: function() {
				var data = {};
				data.self = this.getSelfConstraint();
				data.inheritors = [];
				for(var i=0;i<this.inheritors.length;i++){
					data.inheritors.push(this.inheritors[i].getConstraint().self);
				}
				return data;
			},

			setValue: function(data){
				var inheritor_data = data.inheritors;
				for(var i=0;i<inheritor_data.length;i++){
					var inheritor;
					if(this.inheritors.length<=i){
						inheritor = this.instance_parent.create();
						this.inheritors.push(inheritor);
					}
					else{
						inheritor = this.instances[i];
					}
					inheritor.setValue(inheritor_data[i]);
				}

				
				var difference = this.inheritors.length-inheritor_data.length;
				for(var i=0;i<difference;i++){
					this.inheritors[this.inheritors.length-1].deleteSelf();
					this.inheritors.pop();
				} 

			},

		});
		return InheritorCollection;
	});