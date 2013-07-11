/*globals document jQuery clearjs*/

var org = org || {};
org.camerongreen = org.camerongreen || {};

/**
 *
 *
 * User: Cameron Green <i@camerongreen.org>
 * Date: 3/07/13
 * Time: 10:24 PM
 */
(function ($) {
  "use strict";

  $(document).ready(function () {
    init();
  });

  var FPS = 30, height = 600, width = 800, stage, queue, running = false, bestTime = 0, ticks = 0, soundOn = true, basePath;
  var streetContainer, streetLeft = 110, streetRight = 685, streetBg, streetBg2, streetX = 0, streetY = 0, streetYTotal = 0, streetVelocity = 0, streetVelocityMax = 25, streetVelocityIncrement = 1;
  var bull, bullSpeedY, bullSpeedIndicator;
  var runnersContainer, runnersMax = 18, runners = [], runnerWidth = 40, runnerHeight = 40, score = 0, runnerMinVelocity = 5, runnerMaxVelocity = 20;
  var scoreText, timeText, bestTimeText, mainText, helpContainer, shadowColour = "#000000";

  if (typeof Drupal !== "undefined") {
    basePath = "/" + Drupal.settings.running.basePath;
  } else {
    basePath = ".";
  }

  var KEYCODE = {
    space: 32,
    up: 38,
    left: 37, 
    right: 39,
    down: 40,
    sound: 83, // s
    pause: 80, // p
    quit: 81 // q
  };

  var TEXT = {
    name: "Running of the humans",
    runnersBehind: "Runners behind",
    start: "Space/Click to start",
    score: "Tally",
    speed: "Speed",
    timer: "Time",
    bestTime: "Best time",
    bestTimeMessage: "New best time!!!",
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
  };

  function init() {
    stage = new createjs.Stage("cnv");
    $(document).keydown(handleKeyPress);
    var offset = $("#cnv").offset();

    $("#cnv").click(function () {
      if (!running) {
        if (score > 0) {
          showMainScreen();
        } else {
          startGame();
        }
      }
    }).mousemove(function (evt) {
        if (running) {
          bull.move(evt.pageX - offset.left);
        }
    }).mousewheel(function (evt, delta) {
      if (delta > 0) {
        streetFaster();
      } else {
        streetSlower();
      }
      return false;
    });
      
    var imagePath = basePath + "/images";
    queue = new createjs.LoadQueue(false);
    queue.addEventListener("complete", go);
    queue.loadManifest([
      {id: "bull", src: imagePath + "/bull.png"},
      {id: "runner", src: imagePath + "/runner.png"},
      {id: "bg", src: imagePath + "/bg.png"}
    ]);

    var audioPath = basePath + "/sounds/";
    var manifest = [
      {
        id: "ole",
        src: audioPath + "ole.mp3|" + audioPath + "ole.ogg"
      },
      {
        id: "espana",
        src: audioPath + "espana.mp3|" + audioPath + "espana.ogg"
      }
    ];

    createjs.Sound.registerManifest(manifest);
  }

  function go() {
    showBg();
    initRunners();
    initBull();
    showText();
    showBullSpeedContainer();
    showMainScreen();
    createjs.Ticker.setFPS(FPS);
    createjs.Ticker.useRAF = true;
    createjs.Ticker.addEventListener("tick", tick);
  }

  function showText() {
    var textShadow = new createjs.Shadow(shadowColour, 2, 3, 6);

    mainText = new createjs.Text(TEXT.start, "30px Arial", "white");
    mainText.x = width / 2;
    mainText.y = height / 2 - 25;
    mainText.shadow = textShadow;
    mainText.textAlign = "center";
    stage.addChild(mainText);

    var heading = new createjs.Text(TEXT.name, "40px Arial", "#111111");
    heading.x = width - 10;
    heading.y = 100;
    heading.rotation = 90;
    heading.shadow = textShadow;
    stage.addChild(heading);

    var timeHeading = new createjs.Text(TEXT.timer, "15px Arial", "white");
    timeHeading.x = 10;
    timeHeading.y = 10;
    timeHeading.shadow = textShadow;
    stage.addChild(timeHeading);

    timeText = new createjs.Text("0 " + TEXT.seconds, "20px Arial", "white");
    timeText.x = 10;
    timeText.y = timeHeading.y + 25;
    timeText.shadow = textShadow;
    stage.addChild(timeText);

    var bestTimeHeading = new createjs.Text(TEXT.bestTime, "15px Arial", "white");
    bestTimeHeading.x = 10;
    bestTimeHeading.y = height - 80;
    bestTimeHeading.shadow = textShadow;
    stage.addChild(bestTimeHeading);

    bestTimeText = new createjs.Text("0 " + TEXT.seconds, "20px Arial", "white");
    bestTimeText.x = 10;
    bestTimeText.y = bestTimeHeading.y + 25;
    bestTimeText.shadow = textShadow;
    stage.addChild(bestTimeText);

    var scoreHeading = new createjs.Text(TEXT.score, "15px Arial", "white");
    scoreHeading.x = 10;
    scoreHeading.y = timeText.y + 40;
    scoreHeading.shadow = textShadow;
    stage.addChild(scoreHeading);

    scoreText = new createjs.Text(score + "/" + runnersMax, "20px Arial", "white");
    scoreText.x = 10;
    scoreText.y = scoreHeading.y + 25;
    scoreText.shadow = textShadow;
    stage.addChild(scoreText);

    var speedHeading = new createjs.Text(TEXT.speed, "15px Arial", "white");
    speedHeading.x = 10;
    speedHeading.y = scoreText.y + 40;
    speedHeading.shadow = textShadow;
    stage.addChild(speedHeading);
    bullSpeedY = speedHeading.y + 25;

    helpContainer = new createjs.Container();
    stage.addChild(helpContainer);

    var textHeight = 60;
    for (var i = 0, l = TEXT.help.length; i < l; i++) {
      var help = new createjs.Text(TEXT.help[i], "20px Arial", "black");
      help.x = width / 2 - 80;
      help.y = textHeight;
      helpContainer.addChild(help);
      textHeight += 25;
    }
  }

  function setMainText(stuff) {
    mainText.text = stuff;
  }

  function showScoreText() {
    scoreText.text = score + "/" + runnersMax;
  }

  function showTimeText(seconds) {
    timeText.text = seconds.toFixed(2) + " " + TEXT.seconds;
  }

  /**
   * Not sure how canvas works, but shapes don't support resizing except by
   * scaling, which doesn't really work for me here.  So I've just redrawn it
   * though removed it first to avoid adding gazillions of child objects
   * and causing a memory leak
   */
  function updateBullSpeedIndicator() {
    stage.removeChild(bullSpeedIndicator);

    bullSpeedIndicator = new createjs.Shape();
    var scaledSpeed = (98 / streetVelocityMax) * streetVelocity;
    bullSpeedIndicator.graphics.beginLinearGradientFill(["#600","#E04006"], [0, 1], 0, bullSpeedY + 1, 0, bullSpeedY + 1 + 98).drawRect(21, (bullSpeedY + 99) - scaledSpeed, 24, scaledSpeed);
    stage.addChild(bullSpeedIndicator);
  }

  function showBullSpeedContainer() {
    var outer = new createjs.Shape();
    outer.graphics.beginFill("#fff").drawRect(20, bullSpeedY, 26, 100);
    stage.addChild(outer);
  }

  function showBestTimeText(seconds) {
    bestTimeText.text = seconds.toFixed(2) + " " + TEXT.seconds;
  }

  function resetScore() {
    score = 0;
    showScoreText();
  }

  function resetTime() {
    ticks = 0;
    showTimeText(ticks);
  }

  function updateScore() {
    score++;
    showScoreText();

    if (score === runnersMax) {
      victory();
    }
  }

  function updateTime() {
    ticks++;
    var seconds = ticks / FPS;
    showTimeText(seconds);
  }

  function victory() {
    var message = TEXT.victory;
    var seconds = ticks / FPS;
    var newBestTime = (bestTime !== 0) && (seconds < bestTime);
    if ((bestTime === 0) || newBestTime) {
      bestTime = seconds;
      showBestTimeText(seconds);
      if (newBestTime) {
        message += "\n" + TEXT.bestTimeMessage;
      }
    }
    setMainText(message);
    running = false;
  }

  function showBg() {
    var image = queue.getResult("bg");
    var streetSprite = new createjs.SpriteSheet({
      images: [image],
      frames: {width: image.width, height: image.height, regX: 0, regY: 0},
      animations: {
        be: 0
      }
    });

    streetContainer = new createjs.Container();
    stage.addChild(streetContainer);

    streetBg = new createjs.BitmapAnimation(streetSprite);
    streetBg.name = "street1";
    streetBg.x = streetX;
    streetBg.y = streetY;
    streetBg.gotoAndPlay("be");
    streetContainer.addChild(streetBg);

    streetBg2 = new createjs.BitmapAnimation(streetSprite);
    streetBg2.name = "street2";
    streetBg2.x = streetX;
    streetBg2.y = streetY - height;
    streetBg2.gotoAndPlay("be");
    streetContainer.addChild(streetBg2);
  }

  function initBull() {
    var image = queue.getResult("bull");
    bull = new org.camerongreen.Bull(image, streetLeft, streetRight, height, shadowColour);
    stage.addChild(bull);
  }

  function streetFaster() {
    if (running && (streetVelocity < streetVelocityMax)) {
      streetVelocity += streetVelocityIncrement;
      if (streetVelocity > streetVelocityMax) {
        streetVelocity = streetVelocityMax;
      }
    }
  }

  function streetSlower() {
    if (running && (streetVelocity > 0)) {
      streetVelocity -= (2 * streetVelocityIncrement);
      if (streetVelocity < 0) {
        streetVelocity = 0;
      }
    }
  }

  function handleKeyPress(evt) {
    switch (evt.which) {
      case KEYCODE.right:
        bull.right();
        break;
      case KEYCODE.left:
        bull.left();
        break;
      case KEYCODE.up:
        streetFaster();
        break;
      case KEYCODE.down:
        streetSlower();
        break;
      case KEYCODE.sound:
        if (soundOn) {
          createjs.Sound.stop();
          soundOn = false;
        } else {
          soundOn = true;
          var espana = createjs.Sound.play("espana");
          espana.loop = -1;
        }
        break;
      case KEYCODE.pause:
        var paused = !createjs.Ticker.getPaused();
        createjs.Ticker.setPaused(paused);
        break;
      case KEYCODE.space:
        if (!running) {
          // this is when the user has finished
          // a game, so just reset
          if (score > 0) {
            showMainScreen();
          } else {
            startGame();
          }
        }
        break;
      case KEYCODE.quit:
        showMainScreen();
        break;
    }

    evt.preventDefault();
  }

  function startGame() {
    running = true;
    streetVelocity = 1;
    setMainText("");
    helpContainer.alpha = 0;
    if (soundOn) {
      var espana = createjs.Sound.play("espana");
      espana.loop = -1;
    }
    for (var i = 0; i < runnersMax; i++) {
      runners[i].gotoAndPlay("run");
    }
  }

  function showMainScreen() {
    resetScore();
    resetTime();
    setMainText(TEXT.start);
    helpContainer.alpha = 1;
    bull.reset();
    resetRunners();
    streetBg.y = 0;
    streetBg2.y = streetBg.y - height;
    streetY = 0;
    streetYTotal = 0;
    streetVelocity = 0;
    running = false;
    createjs.Sound.stop();
  }

  function initRunners() {
    runnersContainer = new createjs.Container();
    stage.addChild(runnersContainer);
    for (var i = 0; i < runnersMax; i++) {
      var runner = createRunner(i);
      runnersContainer.addChild(runner);
      runners.push(runner);
    }
  }

  function resetRunners() {
    for (var i = 0; i < runnersMax; i++) {
      runners[i].x = runnerRandomX();
      runners[i].positionY = runnerRandomY();
      runners[i].y = runnerRandomY();
      runners[i].state = "running";
      // always have one guy who runs the fastest
      if (i === 0) {
        runners[i].velocity = runnerMaxVelocity;
      } else {
        runners[i].velocity = runnerRandomVelocity();
      }

      runners[i].gotoAndPlay("stand");
    }
  }

  function runnerRandomX() {
    return streetLeft + (Math.random() * ((streetRight - (runnerWidth / 2) - streetLeft)));
  }

  function runnerRandomVelocity() {
    return runnerMinVelocity + (Math.random() * (runnerMaxVelocity - runnerMinVelocity));
  }

  function runnerRandomY() {
    return (bull.y - 100) - (runnerHeight / 2) + (Math.random() * runnerHeight);
  }

  function createRunner(i) {
    var image = queue.getResult("runner");
    var runnerSprite = new createjs.SpriteSheet({
      images: [image],
      frames: {width: runnerWidth, count: 7, height: runnerHeight, regX: 0, regY: 0},
      animations: {
        stand: 0,
        run: {
          frames: [3, 2, 1, 2, 3, 4, 5, 4],
          frequency: 3
        },
        caught: 6
      }
    });

    var runner = new createjs.BitmapAnimation(runnerSprite);

    runner.name = "runner" + i;
    runner.shadow = new createjs.Shadow(shadowColour, 6, 9, 12);

    return runner;
  }

  function tick() {
    if (running && !createjs.Ticker.getPaused()) {
      updateTime();
      updateBullSpeedIndicator();

      streetY += streetVelocity;
      streetYTotal += streetVelocity;

      if (streetY >= height) {
        streetY = 0;
      }

      streetBg.y = streetY;
      streetBg2.y = streetBg.y - height;

      var runnerBehind = false;

      for (var i = 0; i < runnersMax; i++) {
        if (runners[i].state === "running") {
          runners[i].positionY -= runners[i].velocity;
          runners[i].y = runners[i].positionY + streetYTotal;
          if (collision(bull.x, bull.y, bull.img.width, 40, runners[i].x, runners[i].y + 12, runnerWidth, 14)) {
            if (soundOn) {
              var ole = createjs.Sound.play("ole");
              ole.setVolume(0.2);
            }
            updateScore();
            runners[i].state = "caught";
            runners[i].gotoAndPlay("caught");
          }

          if (runners[i].y > height) {
            runnerBehind = true;
          }
        } else {
          // if they are caught, have them scroll off the screen
          runners[i].positionY += streetVelocity;
          runners[i].y += streetVelocity;
        }
      }

      if (runnerBehind) {
        setMainText(TEXT.runnersBehind);
      } else if (running) {
        setMainText("");
      }
    }

    stage.update();
  }

  function collision(ax, ay, awidth, aheight, bx, by, bwidth, bheight) {
    var fuzziness = 5;
    // horizontal collision
    if (((bx + bwidth) >= (ax + fuzziness)) && ((ax + awidth) >= (bx - fuzziness))) {
      // vertical collision
      if (((by + bheight) >= (ay + fuzziness)) && ((ay + aheight) >= (by - fuzziness))) {
        return true;
      }
    }

    return false;
  }
})(jQuery);
