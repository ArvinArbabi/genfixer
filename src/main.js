"use strict";

let config = {
  type: Phaser.AUTO,
  width: 1600,
  height: 900,
  backgroundColor: "#0f0f13",
  physics: { default: "arcade" },
  scene: [MainMenu, Play, GameEnd],
};

let game = new Phaser.Game(config);
