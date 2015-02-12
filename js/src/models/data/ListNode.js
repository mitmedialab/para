/*ListNode.js
 * class for collections of user created objects
 */

define([
  'jquery',
  'underscore',
  'paper',
  'models/data/Instance'

], function($, _, paper, Instance) {

  var ListNode = Instance.extend({
    defaults: _.extend({}, Instance.prototype.defaults, {
      name: 'list',
      type: 'list',
      open: false, //indicates whether list is open or not;
    }),

    initialize: function() {
      Instance.prototype.initialize.apply(this, arguments);
      this.members = [];
      this.get('translation_delta').setNull(false);

    },

    /* addMember, removeMember
     * methods for adding and removing members from the list
     * accepts both arrays and single objects as arguments */
    addMember: function(data) {
      if (data instanceof Array) {
        for (var i = 0; i < data.length; i++) {
          this.members.push(data[i]);
        }
      } else {
        this.members.push(data);
      }
    },

    removeMember: function(data) {
      var index = $.inArray(data, this.members);
      if (index === -1) {
        return false;
      } else {
        this.members.splice(index, 1);
        return true;
      }
    },

    /*recRemoveMember
     * attempts to remove an item recursively
     * returns true if item is removed,
     * false if item is not found
     */
    recRemoveMember: function(data) {
      if (this.removeMember(data)) {
        return true;
      } else {
        for (var i = 0; i < this.members.length; i++) {
          var removed = this.members[i].recRemoveMember(data);
          if (removed) {
            return true;
          }
        }
      }
      return false;
    },

    /* hasMember, getMember
     * recursive methods for checking if instance exists in
     * list or sublist and accessing said parent list */

    hasMember: function(member, top) {
      if (!top) {
        if (this === member) {
          return true;
        }
      }
      for (var i = 0; i < this.members.length; i++) {
        if (this.members[i].hasMember(member)) {
          return true;
        }
      }
      return false;
    },

    getMember: function(member) {

      for (var i = 0; i < this.members.length; i++) {
        var m = this.members[i].getMember(member);
        if (m) {
          if (this.get('open')) {
            return m;
          } else {
            return this;
          }
        }
      }
      return null;
    },

    /*closeMembers
     * recursively closes all members
     *of this list
     */
    closeMembers: function() {
      for (var i = 0; i < this.members.length; i++) {
        if (this.members[i].get('type') === 'list') {
          this.members[i].closeMembers();
          this.members[i].set('open', false);
        }
      }
    },

    compile: function() {
      this.compileMembers();
    },

   compileMembers: function() {
      //console.log('num members = ', this.members.length, 'num geom =', geomList.length);
      console.log('tdelta',this.accessProperty('translation_delta'));
      console.log('l-matrix',this.get('tmatrix'));
      for (var i = 0; i < this.members.length; i++) {
        this.compileTransforms();
        var member = this.members[i];
        var m_tmatrix = member.get('tmatrix');
        m_tmatrix.concatenate(this.get('tmatrix'));
      }
    },

    compileTransforms: function(){
     this.get('rmatrix').reset();
     this.get('smatrix').reset();
     this.get('tmatrix').reset();
      Instance.prototype.compileTransforms.call(this,arguments);

    },

    render:function(){
      var bbox = this.renderBoundingBox();
      bbox.selectedColor = this.getSelectionColor();
      bbox.selected = this.get('selected');
      if (this.get('open')) {
        bbox.strokeColor = new paper.Color(255, 0, 0, 0.5);
        bbox.strokeWidth = 1;
      }

    },

    renderBoundingBox: function() {
      if (this.get('bbox')) {
        this.get('bbox').remove();
      }

      for (var k = 0; k < this.members.length; k++) {
        this.updateBoundingBox(this.members[k]);
      }

      var i_bbox = this.get('i_bbox');
      if (i_bbox.bottomRight) {
        var width = i_bbox.bottomRight.x - i_bbox.topLeft.x;
        var height = i_bbox.bottomRight.y - i_bbox.topLeft.y;
        var bbox = new paper.Path.Rectangle(i_bbox.topLeft, new paper.Size(width, height));
        this.set('bbox', bbox);

        var screen_bounds = bbox.bounds;
        this.set({
          screen_top_left: screen_bounds.topLeft,
          screen_top_right: screen_bounds.topRight,
          screen_bottom_right: screen_bounds.bottomRight,
          screen_bottom_left: screen_bounds.bottomLeft,
          center: screen_bounds.center,
          left_center: screen_bounds.leftCenter,
          right_center: screen_bounds.rightCenter,
          bottom_center: screen_bounds.bottomCenter,
          top_center: screen_bounds.topCenter,
          area: screen_bounds.area,
          screen_width: screen_bounds.width,
          screen_height: screen_bounds.height,
        });

        return bbox;
      }
    },

  });

  return ListNode;


});