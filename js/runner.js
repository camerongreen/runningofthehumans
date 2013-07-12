/*globals createjs*/

var org = org || {};
org.camerongreen = org.camerongreen || {};

/**
 *  Creates a runner object to do stuff with
 *
 * User: Cameron Green <i@camerongreen.org>
 * Date: 3/07/13
 * Time: 10:24 PM
 */
(function () {
  "use strict";

  var ns = org.camerongreen;
  var minVelocity = 5;
  var maxVelocity = 20;

  ns.Runner = function (id, img, containerLeft, containerRight, startLine, shadowColour) {
    this.name = "runner" + id;
    this.img = img;
    this.leftLimit = containerLeft;
    this.rightLimit = containerRight;
    this.startLine = startLine;
    this.shadowColour = shadowColour;
    this.width = 40;

    this.initialize();
    this.reset(id);
  };

  ns.Runner.prototype = new createjs.BitmapAnimation();

  ns.Runner.prototype.BitmapAnimation_initialize = ns.Runner.prototype.initialize;

  ns.Runner.prototype.initialize = function () {
    var runnerSprite = new createjs.SpriteSheet({
      images: [this.img],
      frames: {width: this.width, count: this.img.width / this.width, height: this.img.height, regX: 0, regY: 0},
      animations: {
        stand: 0,
        run: {
          frames: [3, 2, 1, 2, 3, 4, 5, 4],
          frequency: 3
        },
        caught: 6
      }
    });


    createjs.SpriteSheetUtils.addFlippedFrames(runnerSprite, true, false, false);
    this.BitmapAnimation_initialize(runnerSprite);

    this.shadow = new createjs.Shadow(this.shadowColour, 6, 9, 12);
  };

  ns.Runner.prototype.move = function (containerVelocity) {
    this.y = (this.y + containerVelocity) - this.velocity;
  };

  ns.Runner.prototype.randomX = function () {
    return this.leftLimit + (Math.random() * ((this.rightLimit - (this.img.width / 2) - this.leftLimit)));
  };


  ns.Runner.prototype.randomY = function () {
    return this.startLine - (Math.random() * this.img.height);
  };

  ns.Runner.prototype.randomVelocity = function () {
    return minVelocity + (Math.random() * (maxVelocity - minVelocity));
  };

  ns.Runner.prototype.reset = function (id) {
    this.x = this.randomX();
    this.y = this.randomY();
    // always have one guy who runs the fastest
    if (id === 0) {
      this.velocity = maxVelocity;
    } else {
      this.velocity = this.randomVelocity();
    }

    this.gotoAndPlay("stand");
  };
})();
