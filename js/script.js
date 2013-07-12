/*globals document jQuery clearjs*/

var org = org || {};
org.camerongreen = org.camerongreen || {};

/**
 * A game I wrote, because I hadn't written a game
 *
 * User: Cameron Green <i@camerongreen.org>
 * Date: 3/07/13
 * Time: 10:24 PM
 */
(function ($) {
  "use strict";

  var ns = org.camerongreen;

  ns.vars = {
    queue: null,
    running: false,
    bestTime: 0,
    gameTicks: 0,
    soundOn: true,
    basePath: typeof Drupal === "undefined" ? "." : "/" + Drupal.settings.running.basePath,
    shadowColour: "#000000",
    FPS: 30,
    street: {
      left: 110,
      right: 685,
      velocity: 0,
      velocityMax: 25,
      velocityIncrement: 1
    },
    runners: {
      max: 20,
      missedPenalty: 5,
      score: 0,
      missed: 0
    },
    KEYCODE: {
      space: 32,
      up: 38,
      left: 37,
      right: 39,
      down: 40,
      sound: 83, // s
      pause: 80, // p
      quit: 81 // q
    },
    TEXT: {
      name: "Running of the humans",
      start: "Space/Click to start",
      score: "Tally",
      speed: "Speed",
      timer: "Time",
      bestTime: "Best time",
      bestTimeMessage: "New best time!!!",
      missedRunners: "Missed runners",
      seconds: "sec",
      victory: "Well done!",
      help: [
        "up/mousewheel = faster",
        "down/mousewheel = slower",
        "left/mouse = left",
        'right/mouse = right',
        "p = toggle pause",
        "s = toggle sound",
        "q = quit"
      ]
    }
  };

  $(document).ready(function () {
    ns.init(ns.vars.FPS, ns.vars.basePath);
  });

  ns.init = function (fps, basePath) {
    var stage = new createjs.Stage("cnv");

    ns.loadImages(basePath + "/images", function () {
      ns.go(stage, ns.vars.queue);
    });

    ns.loadSounds(basePath + "/sounds");

    createjs.Ticker.setFPS(fps);
    createjs.Ticker.useRAF = true;
    createjs.Ticker.addEventListener("tick", function() {
      ns.tick(stage);
    });
  };

  ns.setUpControls = function (stage) {
    $(document).keydown(function (evt) {
      ns.handleKeyPress(stage, evt);
    });

    stage.onMouseDown = function () {
      if (!ns.vars.running) {
        if (ns.vars.runners.score > 0) {
          ns.showMainScreen(stage);
        } else {
          ns.startGame(stage);
        }
      }
    };

    stage.onMouseMove = function (evt) {
      if (ns.vars.running) {
        var bull = stage.getChildByName("bull");
        bull.move(evt.stageX);
      }
    };

    $("#cnv").mousewheel(function (evt, delta) {
      if (delta > 0) {
        ns.streetFaster();
      } else {
        ns.streetSlower();
      }
      return false;
    });

  }

  ns.loadImages = function(path, callBack) {
    ns.vars.queue = new createjs.LoadQueue(false);
    ns.vars.queue.addEventListener("complete", callBack);
    ns.vars.queue.loadManifest([
      {id: "bull", src: path + "/bull.png"},
      {id: "runner", src: path + "/runner.png"},
      {id: "bg", src: path + "/bg.png"}
    ]);
  };

  ns.loadSounds = function(path) {
    var manifest = [
      {
        id: "ole",
        src: path + "/ole.mp3|" + path + "/ole.ogg"
      },
      {
        id: "espana",
        src: path + "/espana.mp3|" + path + "/espana.ogg"
      },
      {
        id: "missed",
        src: path + "/missed.mp3|" + path + "/missed.ogg"
      }
    ];

    createjs.Sound.registerManifest(manifest);
  };

  ns.go = function (stage, queue) {
    ns.setUpControls(stage);
    ns.showBg(stage, queue);
    ns.initRunners(stage, queue);
    ns.initBull(stage, queue);
    ns.showText(stage);
    ns.showSpeedContainer(stage);
    ns.showMainScreen(stage);
  }

  ns.showText = function (stage) {
    var textShadow = new createjs.Shadow(ns.shadowColour, 2, 3, 6);

    var main = new createjs.Text(ns.vars.TEXT.start, "30px Arial", "white");
    main.name = "textEl.main";
    main.x = stage.canvas.width / 2;
    main.y = stage.canvas.height / 2 - 25;
    main.shadow = textShadow;
    main.textAlign = "center";
    stage.addChild(main);

    var heading = new createjs.Text(ns.vars.TEXT.name, "40px Arial", "#111111");
    heading.x = stage.canvas.width - 10;
    heading.y = 100;
    heading.rotation = 90;
    heading.shadow = textShadow;
    stage.addChild(heading);

    var timeHeading = new createjs.Text(ns.vars.TEXT.timer, "15px Arial", "white");
    timeHeading.x = 10;
    timeHeading.y = 10;
    timeHeading.shadow = textShadow;
    stage.addChild(timeHeading);

    var time = new createjs.Text("0 " + ns.vars.TEXT.seconds, "20px Arial", "white");
    time.name = "textEl.time";
    time.x = 10;
    time.y = timeHeading.y + 25;
    time.shadow = textShadow;
    stage.addChild(time);

    var bestTimeHeading = new createjs.Text(ns.vars.TEXT.bestTime, "15px Arial", "white");
    bestTimeHeading.x = 10;
    bestTimeHeading.y = stage.canvas.height - 80;
    bestTimeHeading.shadow = textShadow;
    stage.addChild(bestTimeHeading);

    var bestTime = new createjs.Text("0 " + ns.vars.TEXT.seconds, "20px Arial", "white");
    bestTime.name = "textEl.bestTime";
    bestTime.x = 10;
    bestTime.y = bestTimeHeading.y + 25;
    bestTime.shadow = textShadow;
    stage.addChild(bestTime);

    var scoreHeading = new createjs.Text(ns.vars.TEXT.score, "15px Arial", "white");
    scoreHeading.x = 10;
    scoreHeading.y = time.y + 40;
    scoreHeading.shadow = textShadow;
    stage.addChild(scoreHeading);

    var score = new createjs.Text(0 + "/" + ns.vars.runners.max, "20px Arial", "white");
    score.name = "textEl.score";
    score.x = 10;
    score.y = scoreHeading.y + 25;
    score.shadow = textShadow;
    stage.addChild(score);

    var speedHeading = new createjs.Text(ns.vars.TEXT.speed, "15px Arial", "white");
    speedHeading.x = 10;
    speedHeading.y = stage.canvas.height - 220;
    speedHeading.shadow = textShadow;
    stage.addChild(speedHeading);
    ns.vars.streetSpeedY = speedHeading.y + 25;

    var helpContainer = new createjs.Container();
    helpContainer.name = "help";
    stage.addChild(helpContainer);

    var textHeight = 60;
    for (var i = 0, l = ns.vars.TEXT.help.length; i < l; i++) {
      var help = new createjs.Text(ns.vars.TEXT.help[i], "20px Arial", "black");
      help.x = stage.canvas.width / 2 - 80;
      help.y = textHeight;
      helpContainer.addChild(help);
      textHeight += 25;
    }
  };

  ns.setMainText = function (stage, stuff) {
    var el = stage.getChildByName("textEl.main");
    el.text = stuff;
  };

  ns.showScoreText = function (stage, runners) {
    var el = stage.getChildByName("textEl.score");
    el.text = runners.score + "/" + runners.max;
  };

  ns.showTimeText = function (stage, seconds) {
    var el = stage.getChildByName("textEl.time");
    el.text = seconds.toFixed(2) + " " + ns.vars.TEXT.seconds;
  };

  ns.showBestTimeText = function (stage, seconds) {
    var el = stage.getChildByName("textEl.bestTime");
    el.text = seconds.toFixed(2) + " " + ns.vars.TEXT.seconds;
  };

  /**
   * Not sure how canvas works, but shapes don't support resizing except by
   * scaling, which doesn't really work for me here.  So I've just redrawn it
   * though removed it first to avoid adding gazillions of child objects
   * and causing a memory leak...if that's how canvas works
   */
  ns.updateSpeedIndicator = function (stage) {
    var el = stage.getChildByName("speedIndicator");

    if (el) {
      stage.removeChild(el);
    }

    el = new createjs.Shape();
    el.name = "speedIndicator";
    var scaledSpeed = (98 / ns.vars.street.velocityMax) * ns.vars.street.velocity;
    el.graphics.beginLinearGradientFill(["#600", "#E04006"], [0, 1], 0, ns.vars.streetSpeedY + 1, 0, ns.vars.streetSpeedY + 1 + 98).drawRect(20, (ns.vars.streetSpeedY + 99) - scaledSpeed, 23, scaledSpeed);
    stage.addChild(el);
  };

  ns.showSpeedContainer = function (stage) {
    var outer = new createjs.Shape();
    outer.graphics.beginFill("#fff").drawRect(19, ns.vars.streetSpeedY, 25, 100);
    outer.shadow = new createjs.Shadow(ns.shadowColour, 2, 3, 6);

    stage.addChild(outer);
  };

  ns.resetScore = function (stage) {
    ns.vars.runners.score = 0;
    ns.vars.runners.missed = 0;
    ns.showScoreText(stage, ns.vars.runners);
  };

  ns.resetTime = function (stage) {
    ns.vars.gameTicks = 0;
    ns.showTimeText(stage, 0);
  };

  ns.updateScore = function (stage) {
    ns.vars.runners.score++;
    ns.showScoreText(stage, ns.vars.runners);

    if (ns.vars.runners.score === ns.vars.runners.max) {
      ns.victory(stage);
    }
  };

  ns.updateTime = function (stage) {
    ns.vars.gameTicks++;
    var seconds = ns.vars.gameTicks / ns.vars.FPS;
    ns.showTimeText(stage, seconds);
  };

  ns.victory = function(stage) {
    var message = ns.vars.TEXT.victory;
    var seconds = ns.vars.gameTicks / ns.vars.FPS;
    if (ns.vars.runners.missed) {
      var penalty = ns.vars.runners.missed * ns.vars.runners.missedPenalty;
      message += "\n" + ns.vars.TEXT.missedRunners;
      message += ": " + ns.vars.runners.missed + " x " + ns.vars.runners.missedPenalty + " = " + penalty + " " + ns.vars.TEXT.seconds;
      seconds += penalty;
    }
    ns.showTimeText(stage, seconds);
    var newBestTime = (ns.vars.bestTime !== 0) && (seconds < ns.vars.bestTime);
    if ((ns.vars.bestTime === 0) || newBestTime) {
      ns.vars.bestTime = seconds;
      ns.showBestTimeText(stage, seconds);
      if (newBestTime) {
        message += "\n" + ns.vars.TEXT.bestTimeMessage;
      }
    }
    ns.setMainText(stage, message);
    ns.vars.running = false;
  };

  ns.showBg = function (stage, queue) {
    var image = queue.getResult("bg");
    var streetSprite = new createjs.SpriteSheet({
      images: [image],
      frames: {width: image.width, height: image.height, regX: 0, regY: 0},
      animations: {
        be: 0
      }
    });

    var container = new createjs.Container();
    container.name = "street";
    stage.addChild(container);

    var bg1 = new createjs.BitmapAnimation(streetSprite);
    bg1.name = "street1";
    bg1.height = image.height;
    bg1.x = 0;
    bg1.y = 0;
    bg1.gotoAndPlay("be");
    container.addChild(bg1);

    var bg2 = new createjs.BitmapAnimation(streetSprite);
    bg2.name = "street2";
    bg2.height = image.height;
    bg2.x = 0;
    bg2.y = -(image.height);
    bg2.gotoAndPlay("be");
    container.addChild(bg2);
  };

  ns.initBull = function (stage, queue) {
    var image = queue.getResult("bull");
    var bull = new ns.Bull(image, ns.vars.street.left, ns.vars.street.right, stage.canvas.height, ns.shadowColour);
    stage.addChild(bull);
  };

  ns.streetFaster = function () {
    if (ns.vars.running && (ns.vars.street.velocity < ns.vars.street.velocityMax)) {
      ns.vars.street.velocity += ns.vars.street.velocityIncrement;
      if (ns.vars.street.velocity > ns.vars.street.velocityMax) {
        ns.vars.street.velocity = ns.vars.street.velocityMax;
      }
    }
  };

  ns.streetSlower = function () {
    if (ns.vars.running && (ns.vars.street.velocity > 0)) {
      ns.vars.street.velocity -= (2 * ns.vars.street.velocityIncrement);
      if (ns.vars.street.velocity < 0) {
        ns.vars.street.velocity = 0;
      }
    }
  };

  ns.handleKeyPress = function (stage, evt) {
    switch (evt.which) {
      case ns.vars.KEYCODE.right:
        var bull = stage.getChildByName("bull");
        bull.right();
        break;
      case ns.vars.KEYCODE.left:
        var bull = stage.getChildByName("bull");
        bull.left();
        break;
      case ns.vars.KEYCODE.up:
        ns.streetFaster();
        break;
      case ns.vars.KEYCODE.down:
        ns.streetSlower();
        break;
      case ns.vars.KEYCODE.sound:
        if (ns.vars.soundOn) {
          createjs.Sound.stop();
          ns.vars.soundOn = false;
        } else {
          ns.vars.soundOn = true;
          var espana = createjs.Sound.play("espana");
          espana.loop = -1;
        }
        break;
      case ns.vars.KEYCODE.pause:
        var paused = !createjs.Ticker.getPaused();
        createjs.Ticker.setPaused(paused);
        break;
      case ns.vars.KEYCODE.space:
        if (!ns.vars.running) {
          // this is when the user has finished
          // a game, so just reset
          if (score.total > 0) {
            ns.showMainScreen(stage);
          } else {
            ns.startGame(stage);
          }
        }
        break;
      case ns.vars.KEYCODE.quit:
        ns.showMainScreen(stage);
        break;
    }

    evt.preventDefault();
  };

  ns.startGame = function (stage) {
    ns.vars.running = true;
    ns.vars.street.velocity = 1;
    ns.setMainText(stage, "");

    var help = stage.getChildByName("help");
    help.alpha = 0;

    if (ns.vars.soundOn) {
      var espana = createjs.Sound.play("espana");
      espana.loop = -1;
    }

    var container = stage.getChildByName("runners");
    for (var i = 0, l = container.children.length; i < l; i++) {
      var runner = container.getChildAt(i);
      runner.gotoAndPlay("run");
    }
  };

  ns.showMainScreen = function (stage) {
    ns.resetScore(stage);
    ns.resetTime(stage);
    ns.setMainText(stage, ns.vars.TEXT.start);
    var help = stage.getChildByName("help");
    help.alpha = 0;
    var bull = stage.getChildByName("bull");
    bull.reset();
    ns.resetRunners(stage);
    ns.resetStreet(stage);
    ns.vars.running = false;
    createjs.Sound.stop();
  };

  ns.resetStreet = function (stage) {
    var street = stage.getChildByName("street");
    var bg1 = street.getChildByName("street1");
    var bg2 = street.getChildByName("street2");
    bg1.y = 0;
    bg2.y = -(bg1.height);
    ns.vars.street.velocity = 0;
  };

  ns.initRunners = function (stage, queue) {
    var container = new createjs.Container();
    container.name = "runners";
    stage.addChild(container);
    var image = queue.getResult("runner");
    for (var i = 0; i < ns.vars.runners.max; i++) {
      var runner = new ns.Runner(i, image, ns.vars.street.left, ns.vars.street.right, stage.canvas.height - 220, ns.vars.shadowColour);
      container.addChild(runner);
    }
  };

  ns.resetRunners = function (stage) {
    var container = stage.getChildByName("runners");
    for (var i = 0, l = container.children.length; i < l; i++) {
      var runner = container.getChildAt(i);
      runner.reset(i);
    }
  };

  ns.updateStreet = function (stage) {
    var street = stage.getChildByName("street");
    var bg1 = street.getChildByName("street1");
    var bg2 = street.getChildByName("street2");

    bg1.y += ns.vars.street.velocity;

    if (bg1.y >= bg1.height) {
      bg1.y = 0;
    }

    bg2.y = bg1.y - bg1.height;
  };

  ns.tick = function (stage) {
    if (ns.vars.running && !createjs.Ticker.getPaused()) {
      ns.updateTime(stage);
      ns.updateSpeedIndicator(stage);
      ns.updateStreet(stage);

      var runners = stage.getChildByName("runners");
      var bull = stage.getChildByName("bull");

      for (var i = 0, l = runners.children.length; i < l; i++) {
        var runner = runners.getChildAt(i);
        if (runner.currentAnimation === "run") {
          runner.move(ns.vars.street.velocity);
          if (ns.collision(bull.x, bull.y, bull.img.width, 30, runner.x, runner.y + 12, runner.width, 14)) {
            if (ns.vars.soundOn) {
              var ole = createjs.Sound.play("ole").setVolume(0.2);
            }
            runner.gotoAndPlay("caught");
            ns.updateScore(stage);
          }

          if (runner.y > stage.canvas.height) {
            var ole = createjs.Sound.play("missed").setVolume(0.1);
            ns.vars.runners.missed++;
            runner.gotoAndPlay("caught");
            ns.updateScore(stage);
          }
        } else {
          // if they are caught, have them scroll off the screen
          runner.y += ns.vars.street.velocity;
        }
      }
    }

    stage.update();
  };

  ns.collision = function (ax, ay, awidth, aheight, bx, by, bwidth, bheight) {
    var fuzziness = 5;
    // horizontal collision
    if (((bx + bwidth) >= (ax + fuzziness)) && ((ax + awidth) >= (bx - fuzziness))) {
      // vertical collision
      if (((by + bheight) >= (ay + fuzziness)) && ((ay + aheight) >= (by - fuzziness))) {
        return true;
      }
    }

    return false;
  };
})(jQuery);
