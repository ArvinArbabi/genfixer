class MainMenu extends Phaser.Scene {
  constructor() {
    super("menuScene");
  }

  create() {
    const { width, height } = this.scale;

    // ---- Title & Tagline ----
    this.add.text(width/2, 120, "GENFIXER", {
      fontSize: "72px",
      color: "#ffffff",
      fontStyle: "bold",
      fontFamily: "monospace",
    }).setOrigin(0.5);

    this.add.text(width/2, 175, "A Competitive Generator Repair Game", {
      fontSize: "22px",
      color: "#cccccc",
    }).setOrigin(0.5);

    // ---- Rules ----
    const rules = [
      "⚙️ Both players repair at the same time.",
      "⌛ You have 3 seconds to press your shown key each time.",
      "❌ Wrong key or timeout ends the game immediately.",
      "🏆 First to 15 points fixes their generator and wins!"
    ];
    this.add.text(width/2, 245, rules.join("\n"), {
      fontSize: "20px",
      color: "#bbbbbb",
      align: "center",
      lineSpacing: 8,
    }).setOrigin(0.5);

    // ---- Controls hint ----
    this.add.text(width/2, 385, "Player 1 keys: A / S / D     •     Player 2 keys: J / K / L", {
      fontSize: "20px",
      color: "#a0c4ff",
    }).setOrigin(0.5);

    // ---- Start prompt ----
    this.add.text(width/2, height - 120, "Press SPACE to Start", {
      fontSize: "32px",
      color: "#caffbf",
    }).setOrigin(0.5);

    this.add.text(width/2, height - 80, "Timers arm on the first valid key press.", {
      fontSize: "18px",
      color: "#dddddd",
    }).setOrigin(0.5);

    // Input
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.scene.start("playScene");
    }
  }
}
