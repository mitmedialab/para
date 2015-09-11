/*ListNode.js
 * class for collections of user created objects
 */

define([
  'jquery',
  'underscore',
  'paper',
  'models/data/Instance',
  'utils/PFloat',
  'utils/PConstraint',
  'utils/TrigFunc'

], function($, _, paper, Instance, PFloat, PConstraint, TrigFunc) {

  var ListNode = Instance.extend({
    defaults: _.extend({}, Instance.prototype.defaults, {
      name: 'list',
      type: 'collection',
      open: false, //indicates whether list is open or not;
      bbox_dimensions: null,
    }),

    initialize: function() {
      Instance.prototype.initialize.apply(this, arguments);
      this.members = [];
      this.offsets = [];

      var memberCount = new PFloat(0);
      memberCount.setNull(false);
      this.set('memberCount', memberCount);

      this.get('translationDelta').setNull(false);
      this.get('scalingDelta').setNull(false);
      this.get('rotationDelta').setNull(false);
      this.get('fillColor').setNull(false);
      this.get('strokeColor').setNull(false);
      this.get('strokeWidth').setNull(false);
    },

    /*setValue
    passes modifications onto members
     */
    setValue: function(data, mode, modifier) {

      for (var i = 0; i < this.members.length; i++) {
        this.members[i].setValue(data, mode, modifier);
      }
      this.setNull(false);
    },


    printMembers: function() {
      var ids = [];
      for (var i = 0; i < this.members.length; i++) {

        if (this.members[i].get('type') === 'collection') {
          this.members[i].printMembers();
        }
        ids = ids.concat(this.members[i].get('id'));
      }
      console.log('total members for', this.get('id'), ids.length, ids);
    },

    /* addMember, removeMember
     * methods for adding and removing members from the list
     * accepts both arrays and single objects as arguments */
    addMember: function(data, index) {

      if (data instanceof Array) {
        for (var i = 0; i < data.length; i++) {
          this.members.push(data[i]);

        }
      } else {
        if (index) {
          this.members.splice(index, 0, data);
        } else {
          this.members.push(data);
        }

      }

      var memberCount = {
        v: this.members.length,
        operator: 'set'
      };
      this.get('memberCount').setValue(memberCount);
    },

    computeCentroid: function() {
      var sumX = 0;
      var sumY = 0;
      this.members.forEach(function(m) {
        var pos = m._temp_matrix.translation;


        sumX += pos.x;
        sumY += pos.y;
      });

      return {
        x: sumX / this.members.length,
        y: sumY / this.members.length
      };

    },

    // sets the geom visibility to false
    hide: function() {
      for (var i = 0; i < this.members.length; i++) {
        this.members[i].hide();
      }
    },

    show: function() {
      for (var i = 0; i < this.members.length; i++) {
        this.members[i].show();
      }
    },

    bringToFront: function() {
      for (var i = 0; i < this.members.length; i++) {
        this.members[i].bringToFront();
      }
    },


    addMemberToOpen: function(data) {
      if (this.get('open')) {
        var addedToList = false;
        for (var i = 0; i < this.members.length; i++) {
          var added = this.members[i].addMemberToOpen(data);
          if (added) {
            addedToList = true;
          }
        }
        if (addedToList) {
          if (data.get('type') === 'collection') {
            for (var j = 0; j < data.members.length; j++) {
              var removed = this.removeMember(data.members[j]);
            }
          }
          return true;
        } else {
          this.addMember(data);
          return true;
        }
      }
      return false;
    },

    /* removeAllMembers;
     * removes all members from this list
     */
    removeAllMembers: function() {
      var removed = [];
      for (var i = this.members.length - 1; i >= 0; i--) {
        var removedMember = this.removeMember(this.members[i]);
        if (removedMember) {
          removed.push(removedMember);
        }
      }
      return removed;
    },


    deleteAllMembers: function(deleted){
       if(!deleted){
        deleted = [];
      }
      for(var i=this.members.length-1;i>=0;i--){
        deleted.push.apply(deleted,this.members[i].deleteAllMembers());
        if(this.members[i].get('type')==='collection'){
          this.members[i].deleteSelf();
          deleted.push(this.members[i]);
        }
        this.removeMember(this.members[i]);
      }
      return deleted;
    },



    removeMember: function(data) {
      var index = $.inArray(data, this.members);

      if (index > -1) {

        var member = this.members.splice(index, 1)[0];
        var memberCount = {
          v: this.members.length,
          operator: 'set'
        };
        this.get('memberCount').setValue(memberCount);

        //this.stopListening(member);
        return member;
      }

    },

    /*recRemoveMember
     * attempts to remove an item recursively
     * returns item if item is removed,
     */
    recRemoveMember: function(data) {
      var removedItems = [];
      var modified = [];
      var orphans = [];
      var selfRemoved = this.removeMember(data);
      if (selfRemoved) {
        orphans = data.removeAllMembers();
        this.addMember(orphans);
        removedItems.push(selfRemoved);
        modified.push(this);
      } else {
        for (var i = 0; i < this.members.length; i++) {
          var r = this.members[i].recRemoveMember(data);
          removedItems = removedItems.concat(r.removed);
          modified = modified.concat(r.modified);
          orphans = orphans.concat(r.orphans);
        }
      }
      return {
        removed: removedItems,
        modified: modified,
        orphans: orphans
      };

    },

    /* hasMember, getMember
     * recursive methods for checking if instance exists in
     * list or sublist and accessing said parent list */

    hasMember: function(member, top, last) {
      if (!top) {
        if (this === member) {
          return last;
        }
      }
      for (var i = 0; i < this.members.length; i++) {
        var member_found = this.members[i].hasMember(member, false, this);
        if (member_found) {
          return member_found;
        }
      }
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

    getLiteralSubprops: function(key, subprop) {
      var subprops = [];
      for (var i = 0; i < this.members.length; i++) {
        var sp = this.members[i].getLiteralSubprops(key, subprop);
        subprops = subprops.concat(sp);
      }
      return subprops;
    },


    getLastMember: function() {
      if (this.members.length > 0) {
        return this.members[this.members.length - 1];
      }
    },

    getFirstMember: function() {
      if (this.members.length > 0) {
        return this.members[0];
      }
    },

    getMemberAt: function(index) {
      if (this.members.length > index) {
        return this.members[index];
      }
    },

    /* getListMembers
     * returns all members of this list which are themselves lists
     */
    getListMembers: function() {
      return this.members.filter(function(member) {
        return member.get('type') === 'collection';
      });
    },

    //returns all non-list members
    getInstanceMembers: function(memberList) {
      if (!memberList) {
        memberList = [];
      }
      for (var i = 0; i < this.members.length; i++) {
        if (this.members[i].get('type') !== 'collection') {
          memberList.push(this.members[i]);
        } else {
          this.members[i].getInstanceMembers(memberList);
        }

      }
      return memberList;
    },


    propertyModified: function(event) {
      for (var i = 0; i < this.members.length; i++) {
        this.members[i].trigger('modified', this.members[i]);
      }
    },



    getMemberNumber: function() {
      return this.getValueFor('memberCount');
    },

    getMemberIndex: function(member) {
      return _.indexOf(this.members, member);
    },

    setIndex: function(index, member) {
      var old_index = this.getMemberIndex(member);
      if (index > 0) {
        var spliced_member = this.members.splice(old_index, 1)[0];

        this.members.splice(index, 0, spliced_member);

        //TODO: create something that specifies child order here 
        return true;
      }
      return false;
    },
    /*closeMembers
     * recursively closes all members
     *of this list
     */
    closeAllMembers: function() {
      for (var i = 0; i < this.members.length; i++) {
        if (this.members[i].get('type') === 'collection') {
          this.members[i].closeAllMembers();
          this.members[i].set('open', false);
        }
      }
    },

    toggleOpen: function(item) {
      if (this.hasMember(item, true) || this === item) {
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
          var c_members = this.members;
          var shared_members = toggledLists.filter(function(item) {
            return c_members.indexOf(item) > -1;
          });
          if (shared_members.length > 0) {
            for (var j = 0; j < this.members.length; j++) {
              if (shared_members.indexOf(this.members[j]) === -1) {
                this.members[j].toggleClosed(this.members[j]);
              }
            }
          }
          return toggledLists;
        }
      }
      return null;
    },

    toggleClosed: function(item) {
      if (this.hasMember(item, true) || this === item) {
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

    },



    //triggered on change of select property, removes bbox
    selectionChange: function() {
      Instance.prototype.selectionChange.call(this, arguments);
      if (!this.get('selected').getValue()) {
        this.get('ui').visible = false;
      }
    },

    render: function() {
      this.renderBoundingBox();

    },

    renderBoundingBox: function() {
      this.set('bbox_dimensions', {
        topLeft: null,
        bottomRight: null,
      });
      for (var k = 0; k < this.members.length; k++) {
        this.calculateBoundingBox(this.members[k]);
      }

      var bbox_dimensions = this.get('bbox_dimensions');

      if (bbox_dimensions.bottomRight) {
        var width = bbox_dimensions.bottomRight.x - bbox_dimensions.topLeft.x;
        var height = bbox_dimensions.bottomRight.y - bbox_dimensions.topLeft.y;
        var x = bbox_dimensions.topLeft.x + width / 2;
        var y = bbox_dimensions.topLeft.y + height / 2;

        var bbox = this.get('bbox');
        if (!bbox) {

          bbox = new paper.Path.Rectangle(bbox_dimensions.topLeft, new paper.Size(width, height));
          bbox.data.instance = this;
          this.set('bbox', bbox);
          var targetLayer = paper.project.layers.filter(function(layer) {
            return layer.name === 'ui_layer';
          })[0];
          targetLayer.addChild(bbox);


        } else {
          bbox.scale(width / bbox.bounds.width, height / bbox.bounds.height);
          bbox.position.x = x;
          bbox.position.y = y;



        }
        var selection_clone = this.get('selection_clone');

        if (!selection_clone) {
          this.createSelectionClone();
          selection_clone = this.get('selection_clone');
        } else {
          selection_clone.scale(width / selection_clone.bounds.width, height / selection_clone.bounds.height);
          selection_clone.position.x = x;
          selection_clone.position.y = y;
        }

        this.updateScreenBounds(bbox);
      }

    },

    calculateBoundingBox: function(member) {
      if (member.get('screen_top_left') && member.get('screen_bottom_right')) {
        var bbox_dimensions = this.get('bbox_dimensions');
        var i_topLeft = member.get('screen_top_left').getValue();
        var i_bottomRight = member.get('screen_bottom_right').getValue();

        if (!bbox_dimensions.topLeft) {
          bbox_dimensions.topLeft = i_topLeft;
        } else {
          if (i_topLeft.x < bbox_dimensions.topLeft.x) {
            bbox_dimensions.topLeft.x = i_topLeft.x;
          }
          if (i_topLeft.y < bbox_dimensions.topLeft.y) {
            bbox_dimensions.topLeft.y = i_topLeft.y;
          }
        }

        if (!bbox_dimensions.bottomRight) {
          bbox_dimensions.bottomRight = i_bottomRight;
        } else {
          if (i_bottomRight.x > bbox_dimensions.bottomRight.x) {
            bbox_dimensions.bottomRight.x = i_bottomRight.x;
          }
          if (i_bottomRight.y > bbox_dimensions.bottomRight.y) {
            bbox_dimensions.bottomRight.y = i_bottomRight.y;
          }
        }
      }

    },

    getBounds: function() {
      return this.get('bbox').bounds;
    },

    toJSON: function() {
      var data = Instance.prototype.toJSON.call(this, arguments);
      var members = [];
      _.each(this.members, function(item) {
        members.push(item.toJSON());
      });
      data.members = members;
      return data;
    },

    parseJSON: function(data,manager){
      Instance.prototype.parseJSON.call(this, data);
      var members = data.members;
      var collection_members = [];
      for(var i=0;i<members.length;i++){
        var member;
        if(members[i].type ==='collection'){
          member = new this.constructor();  
          collection_members.push.apply(collection_members,member.parseJSON(members[i],manager));
        }
        else{
          member = manager.getById(members[i].id);
        }
        this.addMember(member,i);
      }
      collection_members.push(this);
      return collection_members;
    },

    getShapeClone: function() {
      var clone = new paper.Group(this.members.map(function(instance) {
        return instance.getShapeClone();
      }));
      return clone;
    },

    createSelectionClone: function() {
      if (this.get('selection_clone')) {
        this.get('selection_clone').remove();
        this.set('selection_clone', null);
      }
      var selection_clone = this.get('bbox').clone();
      var targetLayer = paper.project.layers.filter(function(layer) {
        return layer.name === 'ui_layer';
      })[0];
      targetLayer.addChild(selection_clone);
      selection_clone.data.instance = this;
      selection_clone.fillColor = null;
      selection_clone.strokeWidth = 3;
      selection_clone.selected = false;
      this.set('selection_clone', selection_clone);
    },

    getRange: function() {
      return this.get('memberCount').getValue();
    }


  });

  return ListNode;


});