/*Duplicator.js
 * list which can enact iterative constraints on its members and declaratively update number of copies of the target..
 */

define([
        'underscore',
        'models/data/Instance',
        'models/data/collections/ConstrainableList',
        'models/data/geometry/Group',
        'models/data/properties/PFloat',
        'models/data/properties/PBool',
        'paper',
        'models/data/properties/PConstraint',
        'models/data/Constraint',
        'utils/TrigFunc',

    ],

    function(_, Instance, ConstrainableList, Group, PFloat, PBool, paper, PConstraint, Constraint, TrigFunc) {

        var Duplicator = Group.extend({

            defaults: _.extend({}, Group.prototype.defaults, {
                name: 'duplicator',
                count: null,
                target: null,
                mode: 'standard',
                type: 'geometry',
                exception_count: null,
            }),

            initialize: function(attributes, options) {

                Group.prototype.initialize.apply(this, arguments);
                this.masterList = new ConstrainableList();
                this.internalList = new ConstrainableList();

                this.internalList.set('id', 'internal' + this.internalList.get('id'));
                this.masterList.set('id', 'internal' + this.masterList.get('id'));

                //members of the duplicator which are constrained
                this.group_relative = [];
                //members of the duplicator which are acting as the reference in the constraint
                this.group_reference = [];

                var count = new PFloat(0);
                this.set('count', count);
            },

            importSVG: function(data) {
                var item = new paper.Group();
                item.importSVG(data);
            },

            exportSVG: function() {
                return this.get('geom').exportSVG({
                    asString: true
                });
            },

            toJSON: function(noUndoCache) {

                var data = Group.prototype.toJSON.call(this, noUndoCache);
                data.target_index = this.children.indexOf(this.get('target'));
                data.targetID = this.get('target').get('id');
                data.internalList = this.internalList.toJSON(noUndoCache);
                data.masterList = this.masterList.toJSON(noUndoCache);

                data.group_relative = [];
                data.group_reference = [];
                data.count = this.get('count').getValue();
                for (var i = 0; i < this.group_relative.length; i++) {
                    data.group_relative.push(this.group_relative[i].toJSON(noUndoCache));
                }
                for (var j = 0; j < this.group_reference.length; j++) {
                    data.group_reference.push(this.group_reference[j].toJSON(noUndoCache));
                }

                return data;
            },



            parseJSON: function(data) {
                var changed = Group.prototype.parseJSON.call(this, data);
                if (!this.get('target') || this.get('target').get('id') != data.targetID) {
                    this.setTarget(_.find(this.children, function(child) {
                        return child.get('id') == data.targetID;
                    }));
                }
                var target_index = data.target_index;
                var target_data = data.children[target_index];
                var target = this.get('target');
                var i, j, list;
                this.get('count').setValue(data.count);
                target.parseInheritorJSON(target_data, this);

                var cI = this.internalList.parseJSON(data.internalList, this);
                var mI = this.masterList.parseJSON(data.masterList, this);
                changed.toRemove.push.apply(changed, cI.toRemove);
                changed.toAdd.push.apply(changed, cI.toAdd);
                changed.toRemove.push.apply(changed, mI.toRemove);
                changed.toAdd.push.apply(changed, mI.toAdd);

                for (i = 0; i < data.group_relative.length; i++) {
                    list = new ConstrainableList();
                    list.parseJSON(data.group_relative[i], this);
                    this.group_relative.push(list);
                }
                for (j = 0; j < data.group_reference.length; j++) {
                    list = new ConstrainableList();
                    list.parseJSON(data.group_reference[j], this);
                    this.group_reference.push(list);
                }

                return changed;
            },


            getInternalList: function(id) {
                if (this.internalList.get('id') === id) {
                    return this.internalList;
                }
                if (this.masterList.get('id') === id) {
                    return this.masterList;
                }
                for (var i = 0; i < this.group_relative.length; i++) {
                    if (this.group_relative[i].get('id') === id) {
                        return this.group_relative[i];
                    } else if (this.group_reference[i].get('id') === id) {
                        return this.group_reference[i];
                    }
                }
            },

            getInternalListOwner: function(id) {
                if (this.internalList.get('id') === id) {
                    return this;
                }
                if (this.masterList.get('id') === id) {
                    return this;
                }
                for (var i = 0; i < this.group_relative.length; i++) {
                    if (this.group_relative[i].get('id') === id) {
                        return this;
                    } else if (this.group_reference[i].get('id') === id) {
                        return this;
                    }
                }
                return Group.prototype.getInternalListOwner.call(this, id);
            },


            //TODO: Duplicator creation in progress
            create: function(noInheritor) {
                var instance = Group.prototype.create.call(this, noInheritor);
                var target_index = this.children.indexOf(this.get('target'));
                var target = instance.children[target_index];

                instance.get('count').setValue(this.get('count'));

                for (var i = 0; i < instance.children.length; i++) {
                    instance.masterList.addMember(instance.children[i]);
                }

                instance.internalList.addMember(target);
                instance.internalList.get('ui').remove();
                if (instance.masterList.members.length > 1) {
                    instance.internalList.addMember(instance.masterList.members[instance.masterList.members.length - 1]);
                }
                instance.setTarget(target);
                instance.stopListening(instance.internalList);
                instance.stopListening(instance.masterList);
                return instance;
            },

            setInternalConstraint: function() {


                var internalConstraints = [];
                if (this.get('target').get('name') == 'group') {
                    internalConstraints.push.apply(internalConstraints, this.setInternalGroupConstraint());
                }
                this.internalList.addMember(this.get('target'));
                this.internalList.get('ui').remove();
                if (this.masterList.members.length > 1) {
                    this.internalList.addMember(this.masterList.members[this.masterList.members.length - 1]);
                }
                var targetId = this.get('target').get('id');
                var lastId = this.masterList.members[this.masterList.members.length - 1].get('id');

                var constraint = new Constraint();
                constraint.set('references', this.internalList);
                constraint.set('relatives', this.masterList);
                constraint.set('proxy_references', this.get('target'));
                var data = [
                    ['translationDelta_xy', 'translationDelta_xy', ['interpolate', 'interpolate']],
                    ['scalingDelta_xy', 'scalingDelta_xy', ['interpolate', 'interpolate']],
                    ['fillColor_hsl', 'fillColor_hsl', ['interpolate', 'interpolate', 'interpolate']],
                    ['strokeColor_hsl', 'strokeColor_hsl', ['interpolate', 'interpolate', 'interpolate']],
                    ['rotationDelta_v', 'rotationDelta_v', ['interpolate', 'interpolate']],
                    ['strokeWidth_v', 'strokeWidth_v', ['interpolate', 'interpolate']]
                ];

                constraint.create(data);
                constraint.setExemptForAll(targetId, true);
                constraint.setExemptForAll(lastId, true);

                internalConstraints.push(constraint);

                return internalConstraints;
            },

            setInternalGroupConstraint: function() {
                var member_constraints = [];
                var target = this.get('target');
                for (var i = 0; i < target.children.length; i++) {
                    var relative_list = new ConstrainableList();
                    var reference_list = new ConstrainableList();
                    relative_list.set('id', 'internal' + relative_list.get('id'));
                    relative_list.get('ui').remove();
                    reference_list.set('id', 'internal' + reference_list.get('id'));
                    reference_list.get('ui').remove();

                    this.group_relative.push(relative_list);
                    this.group_reference.push(reference_list);
                    reference_list.addMember(target.children[i]);
                    var targetId = target.children[i].get('id');
                    var lastId;
                    if (this.masterList.members.length > 1) {
                        reference_list.addMember(this.masterList.members[this.masterList.members.length - 1].children[i]);
                        lastId = this.masterList.members[this.masterList.members.length - 1].children[i].get('id');
                    }

                    for (var j = 0; j < this.masterList.members.length; j++) {
                        relative_list.addMember(this.masterList.members[j].children[i]);
                    }

                    var constraint = new Constraint();
                    constraint.set('references', reference_list);
                    constraint.set('relatives', relative_list);
                    constraint.set('proxy_references', target.children[i]);
                    constraint.set('proxy_relatives', this.masterList.members[1].children[i]);
                    var data = [
                        ['translationDelta_xy', 'translationDelta_xy', ['interpolate', 'interpolate']],
                        ['scalingDelta_xy', 'scalingDelta_xy', ['interpolate', 'interpolate']],
                        ['fillColor_hsl', 'fillColor_hsl', ['interpolate', 'interpolate', 'interpolate']],
                        ['strokeColor_hsl', 'strokeColor_hsl', ['interpolate', 'interpolate', 'interpolate']],
                        ['rotationDelta_v', 'rotationDelta_v', ['interpolate', 'interpolate']],
                        ['strokeWidth_v', 'strokeWidth_v', ['interpolate', 'interpolate']]
                    ];
                    constraint.create(data);
                    constraint.setExemptForAll(targetId, true);
                    if (lastId) {
                        constraint.setExemptForAll(lastId, true);
                    }
                    member_constraints.push(constraint);
                }
                return member_constraints;
            },

            setTarget: function(target) {
                if (target) {
                    this.set('target', target);
                    if (_.indexOf(this.children, target) < 0) {
                        this.addChildNode(target);
                    }
                } else {
                    this.set('target', null);
                }
                if (!this.masterList.hasMember(target, true)) {
                    this.masterList.addMember(target, 0);
                }
                console.log('duplicator target', this.get('target'));
            },


            addRelativeMember: function(copy, index) {
                if (this.masterList.members.length > 1) {

                    copy.setValue(this.masterList.members[this.masterList.members.length - 2].getValue());

                    if (!index) {
                        index = this.masterList.members.length - 1;
                    }
                } else {

                    copy.setValue(this.masterList.members[0].getValue());

                    if (!index) {
                        index = 1;
                    }
                }
                this.insertChild(index, copy);
                this.masterList.addMember(copy, index);
            },

            deleteRelativeMember: function() {
                var data = this.masterList.members[this.masterList.members.length - 2];
                if (data) {
                    this.removeChildNode(data);
                    this.masterList.removeMember(data);
                    this.get('target').removeInheritor(data);
                    data.deleteSelf();
                    return data;
                }
            },



            insertChild: function(index, child, registerUndo) {
                Group.prototype.insertChild.call(this, index, child, registerUndo);
                if (child.get('name') === 'group') {
                    for (var j = 0; j < child.children.length; j++) {
                        for (var i = 0; i < this.group_relative.length; i++) {
                            this.group_relative[j].addMember(child.children[j], index);
                        }
                    }
                }
            },

            removeChildNode: function(node, updateCount, fullDelete) {
                var target = this.get('target');
                if (!fullDelete && this.internalList.hasMember(node, true, this)) {
                    return false;
                }
                var index = $.inArray(node, this.children);
                var child;

                if (index > -1) {

                    child = this.children.splice(index, 1)[0];
                    var childIndex = child.get('geom').index;
                    this.get('geom').removeChildren(childIndex, childIndex + 1);
                    Group.prototype.removeChildNode.call(this, child);

                }
                if (node.get('name') === 'group') {
                    for (var j = 0; j < node.children.length; j++) {
                        for (var i = 0; i < this.group_relative.length; i++) {
                            this.group_relative[j].removeMember(node.children[j]);
                        }
                    }
                }
                if (updateCount) {
                    for (var k = 0; k < this.children.length; k++) {
                        this.children[k].get('zIndex').setValue(k);
                    }
                }
                return child;
            },


            deleteMember: function(member, removeAll) {

                this.removeChildNode(member, false, removeAll);
                member.deleteSelf();
                var parent = member.getParentNode();
                if (parent) {
                    parent.removeChildNode(member);
                }
                return member;

            },

            // sets the geom visibility to false
            hide: function() {
                Instance.prototype.hide.call(this);
            },

            show: function() {
                Instance.prototype.show.call(this);

            },

            deleteSelf: function() {
                this.stopListening();
                 for (var i = 0; i < this.group_relative.length; i++) {
                    this.group_relative[i].deleteSelf();
                }
                for (var j = 0; i < this.group_reference.length; j++) {
                    this.group_reference[j].deleteSelf();
                }
                this.masterList.deleteSelf();
                this.internalList.deleteSelf();
                var data = Group.prototype.deleteSelf.call(this);
                return data;
            },



          


            setCount: function(count, registerUndo) {
                if (registerUndo) {
                    this.addToUndoStack();
                }


                this.get('count').setValue(count);
                var diff = count - this.children.length;
                var target = this.get('target');
                var starting_length = this.getRange();
                var toRemove = [];
                var toAdd = [];
                var currentLast = this.masterList.members[this.masterList.members.length - 1].getValue();
                if (diff > 0) {
                    for (var i = 0; i < diff; i++) {
                        var member = target.create();
                        this.addRelativeMember(member);
                        toAdd.push(member);

                    }
                } else if (diff < 0) {

                    for (var j = 0; j < 0 - diff; j++) {
                        var d_member = this.deleteRelativeMember();
                        if (d_member) {
                            toRemove.push(d_member);
                        }
                    }

                }
                var data = {
                    toAdd: toAdd,
                    toRemove: toRemove
                };



                return data;
            },

            getCountValue: function() {
                return this.get('count').getValue();
            },

            getRange: function() {
                return this.masterList.getRange();
            },



        });
        return Duplicator;

    });