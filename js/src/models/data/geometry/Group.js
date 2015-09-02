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
  'utils/TrigFunc',
  'utils/PFloat',
  'utils/PPoint',


], function(_, paper, Duplicator, Instance, TrigFunc, PFloat, PPoint) {
  var Group = Instance.extend({

    defaults: _.extend({}, Instance.prototype.defaults, {

      name: 'group',
      type: 'geometry',
      points: null,
      open: false,
    }),

    initialize: function() {
      Instance.prototype.initialize.apply(this, arguments);
      this.resetProperties();
      var memberCount = new PFloat(0);
      memberCount.setNull(false);
      this.set('memberCount', memberCount);
      this.get('scalingDelta').setValue({
        x: 1,
        y: 1,
        operator: 'set'
      });
      this.members = [];
      var geom = new paper.Group();
      this.set('geom', geom);
      geom.data.instance  = this;
    },


    addMember: function(clone, index) {
      if (index) {
        this.members.splice(index, 0, clone);
        this.insertChild(index, clone);
        clone.get('zIndex').setValue(index);

      } else {
        this.members.push(clone);
        this.addChildNode(clone);

        clone.get('zIndex').setValue(this.members.length - 1);

      }
    },

    setValue: function(data) {
      Instance.prototype.setValue.call(this, data);
    },

    getMember: function(member) {
      return Duplicator.prototype.getMember.call(this, member);
    },


    hasMember: function(member, top, last) {
      return Duplicator.prototype.hasMember.call(this, member, top, last);
    },

    accessMemberGeom: function(){
      var geom_list = [];
      for(var i=0;i<this.members.length;i++){
       geom_list.push.apply(geom_list, this.members[i].accessMemberGeom());
      }
      return geom_list;
    },


    toggleOpen: function(item) {
      var result = Duplicator.prototype.toggleOpen.call(this, item);
      if (result) {
        this.inverseTransformRecurse([]);
        for (var i = 0; i < this.members.length; i++) {
          this.members[i].transformSelf();
        }
      }
      return result;

    },

    toggleClosed: function(item) {
      var result = Duplicator.prototype.toggleClosed.call(this, item);
      if (result) {
        for (var i = 0; i < this.members.length; i++) {
          this.members[i].inverseTransformSelf();
        }
        this.transformRecurse([]);
      }
      return result;

    },

    closeAllMembers: function() {
      Duplicator.prototype.closeAllMembers.call(this);
    },



    calculateGroupCentroid: function() {
      var point_list = [];
      for (var i = 0; i < this.members.length; i++) {
        point_list.push(this.members[i].get('geom').position);
      }
      var centroid = TrigFunc.centroid(point_list);
      return centroid;
    },


    compile: function() {
      if (this.members.length > 0) {
        this.members[0].compile();
      }

    },

    inverseTransformRecurse: function(geom_list) {
      
      geom_list.push.apply(geom_list,this.accessMemberGeom());

      if (this.nodeParent && this.nodeParent.get('name') === 'group') {
        this.nodeParent.inverseTransformRecurse(geom_list);

      }

      this.inverseTransformSelf();
      //console.log('parent inverse transformation', this._invertedMatrix.translation, this._invertedMatrix.rotation, this._invertedMatrix.scaling);
      //debugger;

      for (var j = 0; j < geom_list.length; j++) {
        //console.log('geom position before parent inversion', geom_list[j].position, geom_list[j].data.instance.get('id'));

        geom_list[j].transform(this._invertedMatrix);
        //console.log('geom position after parent inversion', geom_list[j].position, geom_list[j].data.instance.get('id'));
        //debugger;
      }

      for (var k = 0; k < this.members.length; k++) {
        //console.log('geom position before individual inversion', this.members[k].get('geom').position, this.members[k].get('id'));

        this.members[k].inverseTransformSelf();
        //console.log('geom position after individual inversion', this.members[k].get('geom').position, this.members[k].get('id'));
        //debugger;
      }

    },


    transformRecurse: function(geom_list) {
      for (var i = 0; i < this.members.length; i++) {
        // console.log('geom position before individual transform', this.members[i].get('geom').position, this.members[i].get('id'));

        geom_list.push.apply(geom_list, this.members[i].transformSelf());
        //console.log('geom position after individual transform', this.members[i].get('geom').position, this.members[i].get('id'));
        //debugger;
      }

      this.transformSelf();
      //console.log('parent transformation', this._matrix.translation, this._matrix.rotation, this._matrix.scaling);
      // debugger;
      for (var j = 0; j < geom_list.length; j++) {
        //console.log('geom position before parent transform', geom_list[j].position, geom_list[j].data.instance.get('id'));

        geom_list[j].transform(this._matrix);
        // console.log('geom position after parent transform', geom_list[j].position, geom_list[j].data.instance.get('id'));
        //debugger;
      }
      if (this.nodeParent && this.nodeParent.get('name') === 'group') {
        this.nodeParent.transformRecurse(geom_list);
      }
    },

    transformSelf: function(exclude) {

      this._matrix.reset();
      var value = this.getValue();
      var scalingDelta, rotationDelta, translationDelta;

      scalingDelta = value.scalingDelta;
      rotationDelta = value.rotationDelta;
      translationDelta = value.translationDelta;
      var center = this.calculateGroupCentroid();

      this._matrix.translate(translationDelta.x, translationDelta.y);
      this._matrix.rotate(rotationDelta, new paper.Point(center.x, center.y));
      this._matrix.scale(scalingDelta.x, scalingDelta.y, new paper.Point(center.x, center.y));
      return [];
    },

    inverseTransformSelf: function() {
      this._invertedMatrix = this._matrix.inverted();
      return [];
    },


    //renders the List UI
    render: function() {

    },

    renderGeom: function() {
      /* var visible = this.get('visible');
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
       geom.position.x = 0;
       geom.position.y = 0;
       geom.transform(this._rotationDelta);
       geom.transform(this._scalingDelta);
       geom.transform(this._translationDelta);



       this.updateScreenBounds(geom);

       this.get('pathAltered').setValue(false);
       geom.visible = visible;
       return geom;*/
    },



  });
  return Group;
});