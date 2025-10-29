class GameEnd extends Phaser.Scene {
  constructor() {
    super("gameEndScene");
  }

  init(data) {
    this.msg = data.msg || "Game Over!";
    this.p1 = data.p1 ?? 0;
    this.p2 = data.p2 ?? 0;
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width/2, height*0.35, this.msg, {
      fontSize: "56px",
      color: "#ffcc00"
    }).setOrigin(0.5);

    this.add.text(width/2, height*0.5, `Final Score  —  P1: ${this.p1}   P2: ${this.p2}`, {
      fontSize: "28px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(width/2, height*0.7, "SPACE: Restart   •   M: Main Menu", {
      fontSize: "22px",
      color: "#bbbbbb"
    }).setOrigin(0.5);

    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.scene.start("playScene");
    } else if (Phaser.Input.Keyboard.JustDown(this.keyM)) {
      this.scene.start("menuScene");
    }
  }
}
