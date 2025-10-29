class Play extends Phaser.Scene {
  constructor() {
    super("playScene");
  }

  preload() {
    this.load.setPath("assets");
    this.load.image("generator", "Generator.png");
    this.load.spritesheet("Blast", "Fire_Blast.png", {
      frameWidth: 400,
      frameHeight: 400
    });

    // Sounds
    this.load.audio("boomSound", "BOOM.mp3");
    this.load.audio("repairSound", "repair.mp3");
  }

  create() {
    const { width, height } = this.scale;

    this.TIME_LIMIT_MS = 3000;
    this.TARGET_SCORE = 15;
    this.P1_KEYS = ["A", "S", "D"];
    this.P2_KEYS = ["J", "K", "L"];

    // ---- UI Elements ----
    this.uiElements = [];

    const title = this.add.text(width / 2, 55, "GENFIXER", {
      fontSize: "72px",
      color: "#ffffff",
      fontStyle: "bold",
      fontFamily: "monospace",
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, 115, "A Competitive Generator Repair Game", {
      fontSize: "22px",
      color: "#cccccc",
    }).setOrigin(0.5);

    this.uiElements.push(title, subtitle);

    // ---- Labels / Divider ----
    this.add.text(width * 0.25, 250, "Player 1", { fontSize: "28px", color: "#ff8080" }).setOrigin(0.5);
    this.add.text(width * 0.75, 250, "Player 2", { fontSize: "28px", color: "#80b3ff" }).setOrigin(0.5);
    this.add.rectangle(width / 2, height / 2, 6, height * 0.82, 0x333845).setOrigin(0.5);

    // ---- Explosion animation ----
    if (!this.anims.exists("blast_once")) {
      this.anims.create({
        key: "blast_once",
        frames: this.anims.generateFrameNumbers("Blast", { start: 7, end: 9 }),
        frameRate: 16,
        repeat: 0,
      });
    }

    const barY = 420;

    this.p1 = {
      score: 0,
      required: "",
      deadline: null,
      scoreText: this.add.text(width * 0.25, 300, "P1: 0", { fontSize: "42px", color: "#ff8080" }).setOrigin(0.5),
      promptText: this.add.text(width * 0.25, 360, "Press: -", { fontSize: "34px", color: "#ffffff" }).setOrigin(0.5),
      barBg: this.add.rectangle(width * 0.25, barY, 500, 18, 0x2a2f3a).setOrigin(0.5),
      bar: this.add.rectangle(width * 0.25 - 250, barY, 500, 18, 0x29d458).setOrigin(0, 0.5),
      gen: null,
      boom: null,
    };

    this.p2 = {
      score: 0,
      required: "",
      deadline: null,
      scoreText: this.add.text(width * 0.75, 300, "P2: 0", { fontSize: "42px", color: "#80b3ff" }).setOrigin(0.5),
      promptText: this.add.text(width * 0.75, 360, "Press: -", { fontSize: "34px", color: "#ffffff" }).setOrigin(0.5),
      barBg: this.add.rectangle(width * 0.75, barY, 500, 18, 0x2a2f3a).setOrigin(0.5),
      bar: this.add.rectangle(width * 0.75 - 250, barY, 500, 18, 0x29d458).setOrigin(0, 0.5),
      gen: null,
      boom: null,
    };

    // ---- Generators ----
    const srcImg = this.textures.get("generator").getSourceImage();
    const targetWidth = 220;
    const genScale = targetWidth / srcImg.width;
    this.explosionScale = targetWidth / 400;

    this.p1.gen = this.add.image(width * 0.25, barY + 150, "generator").setOrigin(0.5).setScale(genScale);
    this.p2.gen = this.add.image(width * 0.75, barY + 150, "generator").setOrigin(0.5).setScale(genScale);

    const tip = this.add.text(width / 2, height - 60, "Press your key when shown. Timers begin on first input!", {
      fontSize: "22px",
      color: "#dddddd",
    }).setOrigin(0.5);
    this.uiElements.push(tip);

    // ---- State ----
    this.gameOver = false;
    this.started = false;
    this.exploded = false;

    this.setPrompt("P1");
    this.setPrompt("P2");
    this.p1.bar.width = this.p1.barBg.width;
    this.p2.bar.width = this.p2.barBg.width;

    // ---- Input & Sound ----
    this.input.keyboard.on("keydown", (e) => this.onKeyDown(e));

    this.boomSfx = this.sound.add("boomSound", { volume: 0.7 });
    this.repairSfx = this.sound.add("repairSound", { volume: 0.6 });
  }

  // ==== Helpers ====
  randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  setPrompt(player) {
    const p = player === "P1" ? this.p1 : this.p2;
    const keys = player === "P1" ? this.P1_KEYS : this.P2_KEYS;
    p.required = this.randFrom(keys);
    p.promptText.setText("Press: " + p.required);
    p.bar.fillColor = 0x29d458;
  }

  armBothTimers() {
    const now = this.time.now;
    this.p1.deadline = now + this.TIME_LIMIT_MS;
    this.p2.deadline = now + this.TIME_LIMIT_MS;
    this.p1.bar.width = this.p1.barBg.width;
    this.p2.bar.width = this.p2.barBg.width;
  }

  resetTimer(p) {
    const now = this.time.now;
    if (p === "P1") this.p1.deadline = now + this.TIME_LIMIT_MS;
    else this.p2.deadline = now + this.TIME_LIMIT_MS;
  }

  checkWin(p) {
    if (p === "P1" && this.p1.score >= this.TARGET_SCORE)
      return this.endGame("Player 1 fixed their generator! 🛠️", 300);
    if (p === "P2" && this.p2.score >= this.TARGET_SCORE)
      return this.endGame("Player 2 fixed their generator! 🛠️", 300);
    return false;
  }

  explode(side) {
    if (this.exploded) return;
    this.exploded = true;

    const obj = side === "P1" ? this.p1 : this.p2;
    if (obj.gen) obj.gen.setVisible(false);

    obj.boom = this.add.sprite(obj.gen.x, obj.gen.y, "Blast")
      .setOrigin(0.5)
      .setScale(this.explosionScale)
      .setDepth(10);

    obj.boom.play("blast_once");
    this.boomSfx.play();
  }

  onKeyDown(e) {
    if (this.gameOver) return;
    const key = (e.key || "").toUpperCase();
    const isP1 = this.P1_KEYS.includes(key);
    const isP2 = this.P2_KEYS.includes(key);
    if (!isP1 && !isP2) return;

    if (!this.started) {
      this.started = true;
      this.armBothTimers();
    }

    if (isP1) {
      if (key === this.p1.required) {
        this.p1.score++;
        this.p1.scoreText.setText("P1: " + this.p1.score);
        this.repairSfx.play(); // ✅ Correct input sound
        if (this.checkWin("P1")) return;
        this.setPrompt("P1");
        this.resetTimer("P1");
      } else {
        this.explode("P1");
        this.endGame(`Player 1 pressed the wrong key (needed ${this.p1.required}).`, 800);
      }
    } else if (isP2) {
      if (key === this.p2.required) {
        this.p2.score++;
        this.p2.scoreText.setText("P2: " + this.p2.score);
        this.repairSfx.play(); // ✅ Correct input sound
        if (this.checkWin("P2")) return;
        this.setPrompt("P2");
        this.resetTimer("P2");
      } else {
        this.explode("P2");
        this.endGame(`Player 2 pressed the wrong key (needed ${this.p2.required}).`, 800);
      }
    }
  }

  update() {
    if (this.gameOver || !this.started) return;
    const now = this.time.now;

    const handleTimer = (p, side) => {
      const fullW = p.barBg.width;
      const rem = Math.max(0, (p.deadline ?? 0) - now);
      const frac = Phaser.Math.Clamp(rem / this.TIME_LIMIT_MS, 0, 1);
      p.bar.width = fullW * frac;
      p.bar.fillColor = frac < 0.33 ? 0xff5d5d : frac < 0.66 ? 0xffd166 : 0x29d458;
      if (rem === 0) this.endGame(`${side} timed out (needed ${p.required}).`);
    };

    handleTimer(this.p1, "Player 1");
    handleTimer(this.p2, "Player 2");
  }

  endGame(msg, delay = 300) {
    if (this.gameOver) return;
    this.gameOver = true;

    // 🧹 Clear any lingering title/subtitle/tip text
    this.uiElements.forEach(el => el.destroy());
    this.uiElements = [];

    this.time.delayedCall(delay, () => {
      this.scene.start("gameEndScene", {
        msg,
        p1: this.p1.score,
        p2: this.p2.score,
      });
    });
  }
}
