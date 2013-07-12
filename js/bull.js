/*globals createjs*/

var org = org || {};
org.camerongreen = org.camerongreen || {};

/**
 *  Creates a bull object to do stuff with
 *
 * User: Cameron Green <i@camerongreen.org>
 * Date: 3/07/13
 * Time: 10:24 PM
 */
(function () {
  "use strict";

  var ns = org.camerongreen;

  ns.Bull = function (img, containerLeft, containerRight, containerHeight, shadowColour) {
    this.name = "bull";
    this.img = img;
    this.leftLimit = containerLeft;
    this.rightLimit = containerRight;
    this.shadowColour = shadowColour;
    this.startX = (this.leftLimit + ((this.rightLimit - this.leftLimit) / 2)) - (img.width / 2);
    this.x = this.startX;
    this.y = containerHeight - img.height;
    this.xIncrement = 15;

    this.initialize();
  };

  ns.Bull.prototype = new createjs.BitmapAnimation();

  ns.Bull.prototype.BitmapAnimation_initialize = ns.Bull.prototype.initialize;

  ns.Bull.prototype.initialize = function () {
    var bullSprite = new createjs.SpriteSheet({
      images: [this.img],
      frames: {width: this.img.width, height: this.img.height, regX: 0, regY: 0},
      animations: {
        stand: 0
      }
    });

    createjs.SpriteSheetUtils.addFlippedFrames(bullSprite, true, false, false);
    this.BitmapAnimation_initialize(bullSprite);

    this.shadow = new createjs.Shadow(this.shadowColour, 6, 9, 18);
    this.gotoAndPlay("stand");
  };

  ns.Bull.prototype.move = function (x) {
    if ((x >= this.leftLimit) && ((x + this.img.width) <= this.rightLimit)) {
      this.x = x;
    }
  };

  ns.Bull.prototype.right = function () {
    this.move(this.x + this.xIncrement);
  };

  ns.Bull.prototype.left = function () {
    this.move(this.x - this.xIncrement);
  };

  ns.Bull.prototype.reset = function () {
    this.move(this.startX);
  };
})();
