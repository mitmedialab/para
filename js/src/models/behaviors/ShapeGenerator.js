/*RadialDistributeBehavior.js
 * creates a radial distirbution defined by anchors
 */
define([
    'models/behaviors/BaseBehavior',
    'models/PaperManager',
    'utils/TrigFunc'
  ],

  function(BaseBehavior, PaperManager, TrigFunc) {
    var paper = PaperManager.getPaperInstance();

    var Generator = FunctionBehavior.extend({
      name: 'generator',
      type: 'generator',

    });

    return Generator;
  });