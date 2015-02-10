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
      var index;
      if (data instanceof Array) {
        for (var i = 0; i < data.length; i++) {
          index = $.inArray(data[i], this.embers);
          this.members.splice(index, 1);
        }
      } else {
        index = $.inArray(data, this.members);
        this.members.splice(index, 1);
      }
    },


    /* hasMember, getMember
     * recursive methods for checking if instance exists in
     * list or sublist and accessing said parent list */

    hasMember: function(member) {
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
      return false;
    },

    render: function(data) {
      var bbox = this.renderBoundingBox(data);
      bbox.selectedColor = this.getSelectionColor();
      bbox.selected = this.get('selected');
      if(this.get('open')){
        bbox.strokeColor = new paper.Color(255,0,0,0.5);
        bbox.strokeWidth = 1;
      }

      return [];
    },

    renderBoundingBox: function(geomList) {
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
          top_center:screen_bounds.topCenter,
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