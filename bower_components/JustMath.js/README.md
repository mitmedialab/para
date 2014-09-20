![JustMath.js - 2D Vector Math](https://raw.github.com/dcodeIO/JustMath.js/master/JustMath.png)
============================
An implementation of two dimensional vector math including a rich toolset for vector operations. It's also the math
library behind [eSoccer](http://www.esoccer.me), a cross-platform multiplayer HTML5 game developed at [University of
Applied Sciences Bonn](http://www.h-brs.de).

JustMath
--------
* Augments core Math
* Allows replacement of all methods (e.g. custom implementations of `JustMath.sqrt(value)`)
* Adds some convenience methods (`JustMath.sq(value)`, `JustMath.cot(angle)`)

JustMath.Vec2
-------------
* Vector instantiation (`new Vec2(vOrX[, y])`) and cloning (`Vec2#clone()`)
* Direct modification through `Vec2#x` and `Vec2#y`, also provides getters (`Vec2#getX()`, `Vec2#getY()`) and a setter
 (`Vec2#set(vOrX[, y])`)
* Vector addition (`Vec2#add(vOrX[, y])`), subtraction (`Vec2#sub(vOrX[, y])`) and multiplication
  (`Vec2#dot(vOrX[, y]))`)
* Vector orthogonality (`Vec2#ort()`)
* Vector normalization (`Vec2#norm()`), scaling (`Vec2#scale(factor)`), inversion (`Vec2#inv()`) and magnitude
  (`Vec2#mag()`, `Vec2#magSq()`) calculation
* Vector-Vector distances (`Vec2#dist(b)`, `Vec2#distSq(b)`)
* Vector rotation (`Vec2#rot(angle)`) and direction calculation (`Vec2#dir()`)
* Vector projection (`Vec2#project(b)`) and rejection (`Vec2#reject(b)`)
* Vector reflection (`Vec2#reflect(n)`), also with component-wise (projected and rejected component) scaling 
  (`Vec2#reflectAndScale(n, projectFactor, rejectFactor)`)
* Vector interpolation (`Vec2#lerp(p, percent)`)
* Vector containment in rectangle (`Vec2#inRect(p1, p2)`)
* [Vector,Vector] determinant calculation (`Vec2.det(v1, v2)`)
* Provides Vector#toString and `Vector#equals()`
* Provides vector operation chaining, e.g.
  
  ```javascript
  var a = new Vec2(1,2);
  var b = new Vec2(2,1);
  var n = new Vec2(0,1);
  a.clone().sub(b).norm().project(n)...
  ```
  
* Provides `Vec2#toString()` for pain-free debugging
* Is of course able to evaluate `Vec2#equals(b)`
* Exports and imports JSON payloads (`Vec2#getXY()`, `new Vec2(jsonPayload)`)
* Small allocation footprint when using `Vec2#clone()` wisely
* Accepts another Vec2 or plain X and Y coordinates as parameters where possible (e.g. `Vec2#add(vOrX[, y])`)

Features
--------
* [CommonJS](http://www.commonjs.org/) compatible
* [RequireJS](http://requirejs.org/)/AMD compatible
* Shim compatible
* [node.js](http://nodejs.org) compatible, also available via [npm](https://npmjs.org/package/justmath) (npm install justmath)
* [Closure Compiler](https://developers.google.com/closure/compiler/) ADVANCED_OPTIMIZATIONS compatible (fully annotated)
* Fully documented using [jsdoc3](https://github.com/jsdoc3/jsdoc)
* Zero dependencies and prerequisites
* Small footprint

Usage
-----
### Node.js / CommonJS ###
* Install: `npm install justmath`

```javascript
var JustMath = require("justmath"),
    Vec2 = JustMath.Vec2;
var a = new Vec2(1,2);
console.log("Not more than "+a.x+", "+a.y+", 3.");
```

### Browser (shim) ###

```html
<script src="//raw.github.com/dcodeIO/JustMath.js/master/JustMath.min.js"></script>
```

```javascript
var JustMath = dcodeIO.JustMath,
    Vec2 = JustMath.Vec2;
var a = new Vec2(1,2);
alert("Not more than "+a.x+", "+a.y+", 3.");
```

### RequireJS / AMD ###

```javascript
var JustMath = require("/path/to/JustMath.js"),
    Vec2 = JustMath.Vec2;
var a = new Vec2(1,2);
alert("Not more than "+a.x+", "+a.y+", 3.");
```

Downloads
---------
* [ZIP-Archive](https://github.com/dcodeIO/JustMath.js/archive/master.zip)
* [Tarball](https://github.com/dcodeIO/JustMath.js/tarball/master)

Documentation
-------------
* [View documentation](http://htmlpreview.github.com/?http://github.com/dcodeIO/JustMath.js/master/docs/JustMath.html)

Examples & Tests [![Build Status](https://travis-ci.org/dcodeIO/JustMath.js.png?branch=master)](https://travis-ci.org/dcodeIO/JustMath.js)
----------------
* [Run visual tests](http://htmlpreview.github.com/?https://github.com/dcodeIO/JustMath.js/master/examples/Vec2.html) (requires working HTML5 Canvas)
* [View source](https://github.com/dcodeIO/JustMath.js/blob/master/examples/Vec2.html)
* [View deploy tests source](https://github.com/dcodeIO/JustMath.js/blob/master/tests/suite.js)

License
-------
Apache License, Version 2.0 - http://www.apache.org/licenses/LICENSE-2.0.html