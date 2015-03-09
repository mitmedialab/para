/*ListNode.js
 * class for collections of user created objects
 */

define([
  'jquery',
  'underscore',
  'paper',
  'models/data/Instance',
  'utils/PFloat'

], function($, _, paper, Instance, PFloat) {

  var ListNode = Instance.extend({
    defaults: _.extend({}, Instance.prototype.defaults, {
      name: 'list',
      type: 'list',
      member_count:null,
      open: false, //indicates whether list is open or not;
    }),

    initialize: function() {
      Instance.prototype.initialize.apply(this, arguments);
      this.members = [];
      this.set('member_count',new PFloat(0));
      this.get('translation_delta').setNull(false);
    },

    printMembers: function() {
      var ids = [];
      for (var i = 0; i < this.members.length; i++) {

        if (this.members[i].get('type') === 'list') {
          this.members[i].printMembers();
        }
        ids = ids.concat(this.members[i].get('id'));
      }
      console.log('total members for', this.get('id'), ids.length, ids);
    },

    /* addMember, removeMember
     * methods for adding and removing members from the list
     * accepts both arrays and single objects as arguments */
    addMember: function(data) {
      var translation_delta = this.accessProperty('translation_delta');
      var neg_delta = {
        x: -translation_delta.x,
        y: -translation_delta.y
      };
      if (data instanceof Array) {
        for (var i = 0; i < data.length; i++) {

          data[i].modifyProperty({
            'translation_delta': neg_delta
          });
          this.members.push(data[i]);
        }
      } else {
       
        data.modifyProperty({
          'translation_delta': neg_delta
        });

        this.members.push(data);
      }
      this.get('member_count').setValue(this.members.length);
    },

    addMemberToOpen: function(data) {
      if (this.get('open')) {
        var addedToList = false;
        for (var i = 0; i < this.members.length; i++) {
          addedToList = addedToList ? true : this.members[i].addMemberToOpen(data);
        }
        if (addedToList) {
          if (data.get('type') === 'list') {
            for (var j = 0; j < data.members.length; j++) {
              var removed = this.removeMember(data.members[j]);
            }
          }
          this.addMember(data);
          return true;
        } else {
          return true;
        }
      } 
      return false;
    },

    /* removeAllMembers;
     * removes all members from this list
     */
    removeAllMembers: function() {
      for (var i = this.members.length - 1; i >= 0; i--) {
        this.removeMember(this.members[i]);
      }
    },

    removeMember: function(data) {
      var index = $.inArray(data, this.members);
      if (index === -1) {
        return false;
      } else {
        var member = this.members.splice(index, 1)[0];
        member.modifyProperty({
          'translation_delta': this.accessProperty('translation_delta')
        });

        return true;
      }
        this.get('member_count').setValue(this.members.length);

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

    /* getListMembers
     * returns all members of this list which are themselves lists
     */
    getListMembers: function() {
      return this.members.filter(function(member) {
        return member.get('type') === 'list';
      });
    },

    /*closeMembers
     * recursively closes all members
     *of this list
     */
    closeAllMembers: function() {
      for (var i = 0; i < this.members.length; i++) {
        if (this.members[i].get('type') === 'list') {
          this.members[i].closeAllMembers();
          this.members[i].set('open', false);
        }
      }
    },

    toggleOpen: function(item) {
      if (this.hasMember(item)) {
        if (!this.get('open')) {
          this.set('open', true);
          return [this];
        } else {
          var toggledLists = [];
          for (var i = 0; i < this.members.length; i++) {
            var toggled = this.members[i].toggleOpen(item);
            if (toggled) {
              toggledLists = toggledLists.concat(toggled);
            }
          }
          return toggledLists;
        }
      }
      return null;
    },

    toggleClosed: function(item) {
      if (this.hasMember(item)) {
        var toggledLists = [];
        for (var i = 0; i < this.members.length; i++) {
          var toggled = this.members[i].toggleClosed(item);
          if (toggled) {
            toggledLists = toggledLists.concat(toggled);
          }
        }
        if (toggledLists.length > 0) {
          return toggledLists;
        } else {
          if (this.get('open')) {
            this.set('open', false);
            return [this];
          }
        }
      }
      return null;
    },

    compile: function() {
      for (var i = 0; i < this.members.length; i++) {
        this.compileMemberAt(i);
      }
    },

    compileMemberAt: function(index) {
      var translation_delta = this.get('translation_delta');
      var i_matricies = this.compileTransforms();
      var member = this.members[index];
      var mtd = member.get('translation_delta');
      var m_tmatrix = member.get('tmatrix');
      var l_matrix = i_matricies.tmatrix;
      var xC = translation_delta.x.isConstrained();
      var yC = translation_delta.y.isConstrained();
      var mxC = mtd.x.isConstrained();
      var myC = mtd.y.isConstrained();
      if (xC && !mxC) {
        m_tmatrix.tx = 0;
      }
      if (yC && !myC) {
        m_tmatrix.ty = 0;
      }
      if (mxC) {
        l_matrix.tx = 0;
      }
      if (myC) {
        l_matrix.ty = 0;
      }
      m_tmatrix.concatenate(l_matrix);
    },

    compileTransforms: function() {
      var rmatrix = this.get('rmatrix').clone();
      var smatrix = this.get('smatrix').clone();
      var tmatrix = this.get('tmatrix').clone();

      var rotation_origin = this.get('rotation_origin').toPaperPoint();
      var scaling_origin = this.get('scaling_origin').toPaperPoint();


      var scaling_delta = this.accessProperty('scaling_delta');
      var rotation_delta = this.accessProperty('rotation_delta');
      var translation_delta = this.inheritProperty('translation_delta');

      if (rotation_delta) {
        rmatrix.rotate(rotation_delta, rotation_origin);
      }
      if (scaling_delta) {
        smatrix.scale(scaling_delta.x, scaling_delta.y, scaling_origin);
      }
      if (translation_delta) {
        tmatrix.translate(translation_delta.toPaperPoint());
      }
      return {
        tmatrix: tmatrix,
        rmatrix: rmatrix,
        smatrix: smatrix
      };
    },



    render: function() {
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
        bbox.sendToBack();
        this.updateScreenBounds(bbox);
        return bbox;
      }
    },

  });

  return ListNode;


});