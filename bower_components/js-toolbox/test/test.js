module('Toolbox.Base');

test('instanceof', function () {
    var Test1 = Toolbox.Base.extend({});
    var Test2 = Test1.extend({});
    ok(new Test1() instanceof Toolbox.Base, 'Test1 should be an Toolbox.Base');
    ok(new Test2() instanceof Toolbox.Base, 'Test2 should be an Toolbox.Base');
    ok(new Test2() instanceof Test1, 'Test2 should be a Test1 object');
});

test('constructor property', function () {
    var MyClass = Toolbox.Base.extend({});
    strictEqual(MyClass, (new MyClass()).constructor);
});

test('constructor can return different instance', function () {
    var testObj = {};
    var MyClass = Toolbox.Base.extend({
        constructor: function () {
            return testObj;
        }
    });
    strictEqual(new MyClass(), testObj);
});

test('child constructor returns parent constructor return value', function () {
    var testObj = {};
    var Test1 = Toolbox.Base.extend({
        constructor: function () {
            return testObj;
        }
    });
    var Test2 = Test1.extend({});
    strictEqual(new Test2(), testObj);
});

test('__super__', function () {
    var Test1 = Toolbox.Base.extend({});
    var Test2 = Test1.extend({});
    strictEqual(Test1.__super__, Toolbox.Base.prototype);
    strictEqual(Test2.__super__, Test1.prototype);
});


module('Toolbox.LiveObject');

test('attribute without default value', function () {
    var Test1 = Toolbox.LiveObject.extend({});
    var t1 = new Test1();
    strictEqual(t1.get('one'), undefined, '"one" should be undefined');
});

test('default attribute value', function () {
    var Test1 = Toolbox.LiveObject.extend({
        one: 1
    });
    var t1 = new Test1();
    strictEqual(t1.get('one'), 1, '"one" should be 1');
});

test('override default attribute value when creating instance', function () {
    var Test1 = Toolbox.LiveObject.extend({
        one: 1
    });
    var t1 = new Test1({
        one: 2
    });
    strictEqual(t1.get('one'), 2, '"one" should be 2');
});

test('override default attribute value with set', function () {
    var Test1 = Toolbox.LiveObject.extend({
        one: 1
    });
    var t1 = new Test1();
    t1.set('one', 2);
    strictEqual(t1.get('one'), 2, '"one" should be 2');
});

test('define new attribute when creating instance', function () {
    var Test1 = Toolbox.LiveObject.extend({});
    var t1 = new Test1({
        one: 1
    });
    strictEqual(t1.get('one'), 1, '"one" should be 1');
});

test('define new attribute with set', function () {
    var Test1 = Toolbox.LiveObject.extend({});
    var t1 = new Test1();
    t1.set('one', 1);
    strictEqual(t1.get('one'), 1, '"one" should be 1');
});

test('extend empty properties', function () {
    var Test1 = Toolbox.LiveObject.extend();
    var t1 = new Test1();
    ok(t1);
});

test('get calculated property', function () {
    var Test1 = Toolbox.LiveObject.extend({
        calc1: Toolbox.prop([], function () {
            return 'calculated';
        })
    });
    var t1 = new Test1();
    strictEqual(t1.get('calc1'), 'calculated', '"calc1" should be "calculated"');
});

test('set calculated property', function () {
    var Test1 = Toolbox.LiveObject.extend({
        calc1: Toolbox.prop(
            [],
            function () {
                return this._val1;
            },
            function (value) {
                this._val1 = value + '_set';
            }
        )
    });
    var t1 = new Test1();
    t1.set('calc1', 'something');
    strictEqual(t1.get('calc1'), 'something_set');
});

test('get method property', function () {
    var Test1 = Toolbox.LiveObject.extend({
        m1: function () {
            return 'method1';
        }
    });
    var t1 = new Test1();
    strictEqual(t1.get('m1'), t1.m1, '"m1" should be a method');
});

test('property change event', function () {
    var Test1 = Toolbox.LiveObject.extend({
        one: 'one'
    });
    var t1 = new Test1();
    var oneChanged = false;
    t1.bind('oneChanged', function () {
        oneChanged = true;
    });
    t1.set('one', 'something');
    ok(oneChanged);
});

test('calculated property change event', function () {
    var Test1 = Toolbox.LiveObject.extend({
        calc1: Toolbox.prop([],
            function () {
                return this._val1;
            },
            function (value) {
                this._val1 = value + '_set';
            }
        )
    });
    var t1 = new Test1();
    var calc1Changed = false;
    t1.bind('calc1Changed', function () {
        calc1Changed = true;
    });
    t1.set('calc1', 'something');
    ok(calc1Changed);
});

test('calculated property dependency change events', function () {
    var Test1 = Toolbox.LiveObject.extend({
        one: 'one',
        calc1: Toolbox.prop(['one'], function () {
            return this.get('one') + ' calc1';
        }),
        calc2: Toolbox.prop(['calc1'], function () {
            return this.get('calc1') + '_calc2';
        })
    });
    var t1 = new Test1();
    // Order of events matters.
    var changes = [];
    t1.bind('calc2Changed', function () {
        changes.push('calc2');
    });
    t1.bind('calc1Changed', function () {
        changes.push('calc1');
    });
    t1.bind('oneChanged', function () {
        changes.push('one');
    });
    t1.set('one', 'something');
    deepEqual(changes, ['one', 'calc1', 'calc2']);
});

test('binding', function () {
    var obj1 = new Toolbox.LiveObject({
        'one': 5
    });
    var obj2 = new Toolbox.LiveObject({
        'two': 10
    });
    Toolbox.bindProperties(obj1, 'one', obj2, 'two');
    strictEqual(obj1.get('one'), 10, 'initial binding propagates value to first object');
    strictEqual(obj2.get('two'), 10, 'initial binding does not propagate value to second object');
    obj1.set('one', 100);
    strictEqual(obj2.get('two'), 100, 'change is propagated to second object');
    obj2.set('two', 200);
    strictEqual(obj1.get('one'), 200, 'change is propagated to first object');
});

test('null property value', function () {
    var obj1 = new Toolbox.LiveObject({
        someProp: null
    });
});

