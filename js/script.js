/*globals document jQuery clearjs*/
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

  var FPS = 30, height = 600, width = 800, stage, queue, running = false, bestTime = 0, ticks = 0;
  var streetContainer, streetLeft = 110, streetRight = 685, streetBg, streetBg2, streetX = 0, streetY = 0, streetYTotal = 0, streetVelocity = 1, streetVelocityMax = 25, streetVelocityIncrement = 1;
  var bull, bullWidth = 70, bullHeight = 151, bullStartX = (width / 2) - (bullWidth / 2), bullStartY = height - bullHeight, bullVelocityIncrement = 15;
  var runnersContainer, runnersMax = 10, runners = [], runnerWidth = 40, runnerHeight = 40, score = 0, runnerStartLine = bullStartY - 100, runnerMinVelocity = 1, runnerMaxVelocity = 15;
  var scoreText, timeText, bestTimeText, mainText, helpContainer, shadowColour = "#000000";
  var textShadow = new createjs.Shadow(shadowColour, 2, 3, 6);
  var runnerShadow = new createjs.Shadow(shadowColour, 6, 9, 12);
  var bullShadow = new createjs.Shadow(shadowColour, 6, 9, 18);

  var KEYCODE = {
    space: 32,
    up: 102, // f (fast)
    left: 108, // l (left)
    right: 39, // ; (right)
    down: 115, // s (slow)
    pause: 112, // p (pause)
    quit: 113 // q (quit)
  };

  var TEXT = {
    name: "Running of the humans",
    runnersBehind: "Runners behind",
    start: "Space/Click to start",
    score: "Tally",
    timer: "Time",
    bestTime: "Best time",
    bestTimeMessage: "New best time!!!",
    seconds: "sec",
    victory: "Well done!",
    help: [
      "f/mousewheel = faster",
      "s/mousewheel = slower",
      "l/mouse = left",
      '"/mouse = right',
      "p = pause",
      "q = quit"
    ]
  };

  document.onkeypress = handleKeyPress;

  function init() {
    stage = new createjs.Stage("cnv");
    $("#cnv").click(function () {
      if (!running) {
        if (score > 0) {
          showMainScreen();
        } else {
          startGame();
        }
      }
    }).mousemove(function (evt) {
        moveBull(evt.pageX);
      }).mousewheel(function (evt, delta) {
        if (delta === 1) {
          bullFaster();
        } else {
          bullSlower();
        }
        return false;
      });

    queue = new createjs.LoadQueue(false);
    queue.addEventListener("complete", go);
    queue.loadManifest([
      {id: "bull", src: "images/bull.png"}, //120x160
      {id: "runner", src: "images/runner.png"},
      {id: "bg", src: "images/bg.png"} //50x50
    ]);
  }

  function go() {
    showBg();
    initRunners();
    showBull();
    showText();
    showMainScreen();
    createjs.Ticker.setFPS(FPS);
    createjs.Ticker.useRAF = true;
    createjs.Ticker.addEventListener("tick", tick);
  }

  function showText() {
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

    mainText = new createjs.Text(TEXT.start, "30px Arial", "white");
    mainText.x = width / 2 - 125;
    mainText.y = height / 2 - 15;
    mainText.shadow = textShadow;
    stage.addChild(mainText);

    var textHeight = 100;
    helpContainer = new createjs.Container();
    stage.addChild(helpContainer);

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
      frames: {width: width, height: height, regX: 0, regY: 0},
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

  function showBull() {
    var image = queue.getResult("bull");
    var bullSprite = new createjs.SpriteSheet({
      images: [image],
      frames: {width: bullWidth, height: bullHeight, regX: 0, regY: 0},
      animations: {
        stand: 0
      }
    });

    bull = new createjs.BitmapAnimation(bullSprite);
    bull.name = "bull";
    bull.x = bullStartX;
    bull.y = bullStartY;
    bull.shadow = bullShadow;
    bull.gotoAndPlay("stand");
    stage.addChild(bull);
  }

  function moveBull(x, ignoreRunning) {
    if ((running || ignoreRunning) && (x > streetLeft) && ((x + bullWidth) < streetRight)) {
      bull.x = x;
    }
  }

  function bullRight() {
    moveBull(bull.x + bullVelocityIncrement);
  }

  function bullLeft() {
    moveBull(bull.x - bullVelocityIncrement);
  }

  function bullFaster() {
    if (running && (streetVelocity < streetVelocityMax)) {
      streetVelocity += streetVelocityIncrement;
      if (streetVelocity > streetVelocityMax) {
        streetVelocity = streetVelocityMax;
      }
    }
  }

  function bullSlower() {
    if (running && (streetVelocity > 0)) {
      streetVelocity -= (2 * streetVelocityIncrement);
      if (streetVelocity < 0) {
        streetVelocity = 0;
      }
    }
  }

  function handleKeyPress(e) {
    if (!e) {
      e = window.event;
    }
    //console.log(e.keyCode);
    switch (e.keyCode) {
      case KEYCODE.right:
        bullRight();
        break;
      case KEYCODE.left:
        bullLeft();
        break;
      case KEYCODE.up:
        bullFaster();
        break;
      case KEYCODE.down:
        bullSlower();
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
  }

  function startGame() {
    running = true;
    setMainText("");
    helpContainer.alpha = 0;
    for (var i = 0; i < runnersMax; i++) {
      runners[i].gotoAndPlay("run");
    }
  }

  function showMainScreen() {
    resetScore();
    resetTime();
    setMainText(TEXT.start);
    helpContainer.alpha = 1;
    moveBull(bullStartX, true);
    resetRunners();
    streetBg.y = 0;
    streetBg2.y = streetBg.y - height;
    streetY = 0;
    streetYTotal = 0;
    streetVelocity = 1;
    running = false;
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
    return runnerStartLine - (runnerHeight / 2) + (Math.random() * runnerHeight);
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
    runner.shadow = runnerShadow;

    return runner;
  }

  function tick() {
    if (running && !createjs.Ticker.getPaused()) {
      updateTime();

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
          if (collision(bull.x, bull.y, bullWidth, 40, runners[i].x, runners[i].y + 12, runnerWidth, 14)) {
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
