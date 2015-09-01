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
      if(index){
                    this.members.splice(index, 0, clone);
                    this.insertChild(index,clone);
                    clone.get('zIndex').setValue(index);

                }
                else{
                     this.members.push(clone);
                    this.addChildNode(clone);

                    clone.get('zIndex').setValue(this.members.length-1);

                }
                var diff = this.members.length - this.indexNumbers.length;
                
                this.addMemberNotation();

    },

    toggleOpen: function(item){
      Duplicator.prototype.toggleOpen.call(this,item);
        var geom = this.get('geom');
        geom.transform(this._ti_matrix);
        geom.transform(this._si_matrix);
        geom.transform(this._ri_matrix);
        for(var i=0;i<this.members.length;i++){
          this.members[i].trigger('modified',this.members[i]);
        }
    },

    toggleClosed: function(item){
      Duplicator.prototype.toggleClosed.call(this,item);
      var geom = this.get('geom');
      geom.transform(this._rotationDelta);
      geom.transform(this._scalingDelta);
      geom.transform(this._translationDelta);
      this.updateCentroid();

    },

    updateCentroid:function(){
      var old_centroid = this.get('translationDelta').getValue();
      var new_centroid = this.calculateGroupCentroid();
      var diff = TrigFunc.subtract(new_centroid,old_centroid);
      this.get('translationDelta').add(diff);

    },



    calculateGroupCentroid: function() {
      var point_list = [];
      for(var i=0;i<this.members.length;i++){
        point_list.push(this.members[i].get('geom').position);
      }
      var centroid = TrigFunc.centroid(point_list);
      return centroid;
    },


    compile: function() {
      Instance.prototype.compile.call(this);
    },

    compileTransformation: function(value) {
      
      this._invertedMatrix = this._matrix.inverted();
      this._matrix.reset();
      var scalingDelta, rotationDelta, translationDelta;

      scalingDelta = value.scalingDelta;
      rotationDelta = value.rotationDelta;
      translationDelta = value.translationDelta;
      var center = this.calculateGroupCentroid();
      this._matrix.translate(translationDelta.x,translationDelta.y);
      this._matrix.rotate(rotationDelta,center.x,center.y);
      this._matrix.scale(scalingDelta.x,scalingDelta.y,center.x,center.y);
      /*this._rotation_origin = this.get('rotation_origin').toPaperPoint();
      this._scaling_origin = this.get('scaling_origin').toPaperPoint();
      this._position = this.get('position').toPaperPoint();*/

    },

    inverseTransform: function(geom){
      if(this.nodeParent && this.nodeParent.get('name')==='group'){
        this.nodeParent.inverseTransform(geom);
      }
    geom.transform(this._invertedMatrix);

    },

    transform: function(geom){
      geom.transform(this._matrix);
       if(this.nodeParent && this.nodeParent.get('name')==='group'){
        this.nodeParent.transform(geom);
      }
    },

    //renders the List UI
    render: function() {
      for(var i=0;i<this.members.length;i++){
        this.members[i].reset();
        this.members[i].compile();
        this.members[i].render();
      }

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