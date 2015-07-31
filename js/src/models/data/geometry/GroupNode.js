/*GroupNode.js
 * path object
 * extends GeometryNode
 * node with actual path in it
 */


define([
	'underscore',
	'models/data/geometry/GeometryNode'


], function(_,GeometryNode) {
	var GrouphNode = GeometryNode.extend({

		defaults: _.extend({}, GeometryNode.prototype.defaults, {

			name: 'group',
			type: 'geometry',
			points: null,
		}),

		initialize: function() {

		},

		   /*  var delta = this.get(propname);

        if (delta) {
          var member = this.members[index];
          var member_property = member.get(propname);
          var matrixMap = this.get('matrix_map');
          var matrix_props = matrixMap[propname].properties;
          var member_matrix = member.get(matrixMap[propname].name);
          var delta_constrained = delta.isSelfConstrained();
          var member_property_constrained = member_property.isSelfConstrained();

          for (var p in matrix_props) {
            if (delta.hasOwnProperty(p)) {
              var delta_subproperty_constrained = false;
              var member_subproperty_constrained = false;
              if (delta[p] instanceof PConstraint) {
                delta_subproperty_constrained = delta[p].isSelfConstrained();
                member_subproperty_constrained = member_property[p].isSelfConstrained();
              }
              for (var i = 0; i < matrix_props[p].length; i++) {
                if ((delta_subproperty_constrained || delta_constrained) && !member_subproperty_constrained && !member_property_constrained) {
                  member_matrix[matrix_props[p][i]] = 0;
                }
                if (member_subproperty_constrained || member_property_constrained) {
                  l_matrix[matrix_props[p][i]] = 0;
                }
              }
            }
          }
          member_matrix.concatenate(l_matrix);
        }

      },*/


	});
	return GroupNode;
});