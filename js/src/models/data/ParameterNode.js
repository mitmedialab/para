/*ParameterNode.js
instance that acts as a parameter for a function and can be used to transfer its effects to other instances*/

	var ParameterNode = {

		setName: function(name) {
			this.set('param_name', name);
		},

		renderStyle: function(geom){
			console.log('rendering style of param');
			geom.fillColor = this.get('primary_selection_color');
			geom.visible = this.get('visible');
		}
	};