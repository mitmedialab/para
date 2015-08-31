/*Group.js
 * path object
 * extends Duplicator node (for the time being)
 * node with actual path in it
 */


define([
  'underscore',
  'paper',
  'models/data/collections/Duplicator',
  'models/data/Instance',
  'utils/TrigFunc'


], function(_, paper, Duplicator, Instance, TrigFunc) {
  var Group = Duplicator.extend({

    defaults: _.extend({}, Duplicator.prototype.defaults, {

      name: 'group',
      type: 'geometry',
      points: null,
    }),

    initialize: function() {
      Duplicator.prototype.initialize.apply(this, arguments);
      this.tf_matrix = new paper.Matrix();
    },

    /*setValue
    passes modifications onto members, stripped of any properties that are constrained on the list
     */
    setValue: function(data) {
      Instance.prototype.setValue.call(this, data);
      var centroid = this.calculateGroupCentroid();
      var tD = this.get('translationDelta').getValue();
      var rD = this.get('rotationDelta').getValue();
      var sD = this.get('scalingDelta').getValue();
      this.tf_matrix = new paper.Matrix();
      this.tf_matrix = this.tf_matrix.rotate(rD, centroid.x, centroid.y);
      this.tf_matrix = this.tf_matrix.scale(sD.x, sD.y, new paper.Point(centroid.x, centroid.y));
      this.tf_matrix = this.tf_matrix.translate(tD.x, tD.y);

      for (var i = 0; i < this.members.length; i++) {
        this.members[i].trigger('modified', this.members[i]);
      }
    },


    getGroupMatrix: function() {

      if (this.nodeParent && this.nodeParent.get('name') === 'group') {
        var matrix = this.nodeParent.getGroupMatrix();
        matrix.concatenate(this.tf_matrix);
        return matrix;
      } else {
        console.log('this.tf_matrix', this.tf_matrix);
        return this.tf_matrix;
      }
    },


    calculateGroupCentroid: function() {
      var center_list = [];
      for (var i = 0; i < this.members.length; i++) {
        var center = this.members[i].get('center');

        center_list.push({
          x: center.x.getValue(),
          y: center.y.getValue()
        });
      }
      var centroid = TrigFunc.centroid(center_list);
      return centroid;
    },



  });
  return Group;
});