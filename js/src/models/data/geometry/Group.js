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
      this.resetProperties();
      this.get('geom').data.geom = true;
       this.get('geom').data.nodetype = this.get('name');
    },

    /*setValue
    passes modifications onto members, stripped of any properties that are constrained on the list
     */
    setValue: function(data) {
      Instance.prototype.setValue.call(this, data);
    },


    addMember: function(clone, index) {
      Duplicator.prototype.addMember.call(this, clone, index);
      var memberCount = {
        v: this.members.length,
        operator: 'set'
      };
      for (var i = 0; i < this.members.length; i++) {
        this.members[i].get('zIndex').setValue(i);
      }
      this.get('memberCount').setValue(memberCount);
      this.get('translationDelta').setValue(this.calculateGroupCentroid());
   
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


    compile: function() {
      Instance.prototype.compile.call(this);
    },


    //renders the List UI
    render: function() {
      console.log('rendering geom');
      if (!this.get('rendered')) {

        var geom = this.renderGeom();
        if (geom) {
         //this.renderSelection(geom);
        }

        this.set('rendered', true);



      }

    },

    renderGeom: function() {
      var visible = this.get('visible');
      var geom = this.get('geom');
      var zIndex = this.get('zIndex').getValue();
      if (geom.index != zIndex) {
        geom.parent.insertChild(zIndex, geom);
      }
      var pathAltered = this.get('pathAltered').getValue();

      if (!pathAltered) {
        //geom.transform(this._itemp_matrix);

        geom.transform(this._ti_matrix);
        geom.transform(this._si_matrix);
        geom.transform(this._ri_matrix);
      }

      //var position = this.get('position').toPaperPoint();
     geom.position.x=0;
     geom.position.y=0;
     geom.transform(this._rotationDelta);
     // geom.transform(this._scalingDelta);
      geom.transform(this._translationDelta);
     


      this.updateScreenBounds(geom);

      this.get('pathAltered').setValue(false);
      geom.visible = visible;
      console.log('geom',geom.position,geom.scaling,geom.visible,geom.rotation,geom.bounds.width,geom.bounds.height);
      return geom;
    },



  });
  return Group;
});