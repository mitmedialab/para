/*Group.js
 * path object
 * extends Duplicator node (for the time being)
 * node with actual path in it
 */


define([
  'underscore',
  'paper',
  'models/data/collections/Duplicator',
  'utils/TrigFunc'


], function(_, paper, Duplicator, TrigFunc) {
  var Group = Duplicator.extend({

    defaults: _.extend({}, Duplicator.prototype.defaults, {

      name: 'group',
      type: 'geometry',
      points: null,
    }),

    initialize: function() {
      Duplicator.prototype.initialize.apply(this, arguments);
    },

    /*setValue
    passes modifications onto members, stripped of any properties that are constrained on the list
     */
    setValue: function(data) {
      var constrained_props = this.getConstraintValues();
            console.log('data', data,constrained_props);

      var centroid = this.calculateGroupCentroid();
      for (var i = 0; i < this.members.length; i++) {
        if (constrained_props[i]) {
          var reference_status = this.isReference(this.members[i]);
          var stripped_data = TrigFunc.stripBoolean(data, constrained_props[i], reference_status);

          if (stripped_data['rotationDelta']) {
            console.log('stripped_data',i,stripped_data);
            var mod_data = this.rotate(stripped_data['rotationDelta'], centroid,this.members[i]);
            console.log('mod_data', mod_data);
            console.log('translationDelta pre', this.members[i].get('translationDelta').getValue());

            this.members[i].setValue(mod_data);
            console.log('translationDelta post', this.members[i].get('translationDelta').getValue());

          }

        } else {
          this.members[i].setValue(data);
        }

      }
      this.trigger('modified', this);
    },


    scale: function(data, centroid) {

    },

    rotate: function(data, centroid, member) {
      console.log('centroid =', centroid);

      var angle = data.v;
     
      
      console.log('angle=', angle, 'centroid=', centroid);
      var geom = member.get('geom');
      var cloned_matrix = geom.matrix.clone();
      var tf= cloned_matrix.rotate(angle, centroid.x, centroid.y);
      console.log('tf',tf.rotation, tf.translation);

      var mod_data = {
        rotationDelta: {
          v: tf.rotation,
          operator: 'add'
        },
        translationDelta: {
          x: tf.translation.x,
          y: tf.translation.y,
          operator: 'add'
        }
      };
      return mod_data;

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
    }



  });
  return Group;
});