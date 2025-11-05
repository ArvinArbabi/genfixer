class Play extends Phaser.Scene {
  constructor() { super("playScene"); }

  preload() {
    this.load.setPath("assets");
    this.load.image("generator", "Generator.png");
    this.load.spritesheet("Blast", "Fire_Blast.png", { frameWidth: 400, frameHeight: 400 });
    this.load.audio("boomSound", "BOOM.mp3");
    this.load.audio("repairSound", "repair.mp3");
  }

  create() {
    const { width, height } = this.scale;

    // --- Config ---
    this.TIME_LIMIT_MS = 3000;
    this.TARGET_SCORE  = 15;
    this.MAX_LIVES     = 3;
    this.P1_KEYS = ["A","S","D"];
    this.P2_KEYS = ["J","K","L"];

    // --- Title (rules on Main Menu only) ---
    this.uiElements = [];
    const title = this.add.text(width/2, 55, "GENFIXER", {
      fontSize: "72px", color: "#ffffff", fontStyle: "bold", fontFamily: "monospace"
    }).setOrigin(0.5);
    const subtitle = this.add.text(width/2, 115, "A Competitive Generator Repair Game", {
      fontSize: "22px", color: "#cccccc"
    }).setOrigin(0.5);
    this.uiElements.push(title, subtitle);

    // Labels / divider
    this.add.text(width*0.25, 250, "Player 1", { fontSize: "28px", color: "#ff8080" }).setOrigin(0.5);
    this.add.text(width*0.75, 250, "Player 2", { fontSize: "28px", color: "#80b3ff" }).setOrigin(0.5);
    this.add.rectangle(width/2, height/2, 6, height*0.82, 0x333845).setOrigin(0.5);

    // Explosion anim
    if (!this.anims.exists("blast_once")) {
      this.anims.create({
        key: "blast_once",
        frames: this.anims.generateFrameNumbers("Blast", { start: 7, end: 9 }),
        frameRate: 16,
        repeat: 0
      });
    }

    const barY = 420;

    // --- Player state + UI ---
    this.p1 = {
      score: 0, lives: this.MAX_LIVES, required: "", deadline: null,
      isStunned: false, boom: null,
      scoreText: this.add.text(width*0.25, 300, "P1: 0", { fontSize: "42px", color: "#ff8080" }).setOrigin(0.5),
      livesText: this.add.text(width*0.25, 330, "Lives: ❤️❤️❤️", { fontSize: "22px", color: "#ffaaaa" }).setOrigin(0.5),
      promptText: this.add.text(width*0.25, 360, "Press: -", { fontSize: "34px", color: "#ffffff" }).setOrigin(0.5),
      barBg: this.add.rectangle(width*0.25, barY, 500, 18, 0x2a2f3a).setOrigin(0.5),
      bar:   this.add.rectangle(width*0.25 - 250, barY, 500, 18, 0x29d458).setOrigin(0, 0.5),
      gen:   null
    };

    this.p2 = {
      score: 0, lives: this.MAX_LIVES, required: "", deadline: null,
      isStunned: false, boom: null,
      scoreText: this.add.text(width*0.75, 300, "P2: 0", { fontSize: "42px", color: "#80b3ff" }).setOrigin(0.5),
      livesText: this.add.text(width*0.75, 330, "Lives: ❤️❤️❤️", { fontSize: "22px", color: "#a0c4ff" }).setOrigin(0.5),
      promptText: this.add.text(width*0.75, 360, "Press: -", { fontSize: "34px", color: "#ffffff" }).setOrigin(0.5),
      barBg: this.add.rectangle(width*0.75, barY, 500, 18, 0x2a2f3a).setOrigin(0.5),
      bar:   this.add.rectangle(width*0.75 - 250, barY, 500, 18, 0x29d458).setOrigin(0, 0.5),
      gen:   null
    };

    // Generators (offset +150)
    const srcImg = this.textures.get("generator").getSourceImage();
    const targetW = 220;
    const genScale = targetW / srcImg.width;
    this.explosionScale = targetW / 400;

    this.p1.gen = this.add.image(width*0.25, barY + 150, "generator").setOrigin(0.5).setScale(genScale);
    this.p2.gen = this.add.image(width*0.75, barY + 150, "generator").setOrigin(0.5).setScale(genScale);

    // Tip
    const tip = this.add.text(width/2, height - 60, "Press your key when shown. Timers begin on first input!", {
      fontSize: "22px", color: "#dddddd"
    }).setOrigin(0.5);
    this.uiElements.push(tip);

    // State + sounds
    this.gameOver = false;
    this.started  = false;
    this.boomSfx   = this.sound.add("boomSound",   { volume: 0.7 });
    this.repairSfx = this.sound.add("repairSound", { volume: 0.6 });

    // Initial prompts/bars
    this.setPrompt("P1");
    this.setPrompt("P2");
    this.p1.bar.width = this.p1.barBg.width;
    this.p2.bar.width = this.p2.barBg.width;

    // Input
    this.input.keyboard.on("keydown", (e) => this.onKeyDown(e));
  }

  // --- Helpers ---
  randFrom(a){ return a[Math.floor(Math.random()*a.length)]; }
  setPrompt(side){
    const p = side==="P1"?this.p1:this.p2;
    const keys = side==="P1"?this.P1_KEYS:this.P2_KEYS;
    p.required = this.randFrom(keys);
    p.promptText.setText("Press: " + p.required);
    p.bar.fillColor = 0x29d458;
  }
  armBothTimers(){
    const now = this.time.now;
    this.p1.deadline = now + this.TIME_LIMIT_MS;
    this.p2.deadline = now + this.TIME_LIMIT_MS;
    this.p1.bar.width = this.p1.barBg.width;
    this.p2.bar.width = this.p2.barBg.width;
  }
  resetTimer(side){
    const now = this.time.now;
    (side==="P1"?this.p1:this.p2).deadline = now + this.TIME_LIMIT_MS;
  }
  updateLivesText(p){
    p.livesText.setText(`Lives: ${"❤️".repeat(Math.max(0,p.lives))}`);
  }
  checkWinByScore(side){
    if (side==="P1" && this.p1.score>=this.TARGET_SCORE) { this.finishMatch("Player 1 fixed their generator! 🛠️"); return true; }
    if (side==="P2" && this.p2.score>=this.TARGET_SCORE) { this.finishMatch("Player 2 fixed their generator! 🛠️"); return true; }
    return false;
  }

  // robust penalty that ignores spam
  penalize(side, reason) {
  if (this.gameOver) return;
  const DELAY = 800;
  const victim = side === "P1" ? this.p1 : this.p2;

  // Ignore if already handling a penalty
  if (victim.isStunned) return;
  victim.isStunned = true;

  // Take the life immediately
  victim.lives = Math.max(0, victim.lives - 1);
  this.updateLivesText(victim);

  // Hide generator + play explosion
  if (victim.gen && victim.gen.visible) victim.gen.setVisible(false);
  if (victim.boom) victim.boom.destroy();
  victim.boom = this.add.sprite(victim.gen.x, victim.gen.y, "Blast")
    .setOrigin(0.5)
    .setScale(this.explosionScale)
    .setDepth(10);

  victim.boom.play("blast_once");
  this.boomSfx.play();

  // ✅ Destroy explosion sprite once animation completes
  victim.boom.on("animationcomplete", () => {
    victim.boom.destroy();
  });

  // Red flash overlay
  const halfX = side === "P1" ? this.scale.width * 0.25 : this.scale.width * 0.75;
  const overlay = this.add.rectangle(
    halfX,
    this.scale.height / 2,
    this.scale.width / 2,
    this.scale.height,
    0xff0000,
    0.25
  ).setDepth(9);

  // Extend timers a bit so no unfair timeout
  if (this.started) {
    if (this.p1.deadline) this.p1.deadline += DELAY;
    if (this.p2.deadline) this.p2.deadline += DELAY;
  }

  // If out of lives → end
  if (victim.lives === 0) {
    const big = this.add.text(halfX, 200, `${side} LOST`, {
      fontSize: "64px",
      color: "#ff4d4d",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(11);
    this.time.delayedCall(DELAY, () => {
      overlay.destroy();
      this.finishMatch(
        `${side} is out of lives! ${side === "P1" ? "Player 2" : "Player 1"} wins!`,
        600
      );
    });
    return;
  }

  // Otherwise, recover
  this.time.delayedCall(DELAY, () => {
    overlay.destroy();
    if (victim.gen) victim.gen.setVisible(true);
    this.setPrompt(side);
    this.resetTimer(side);
    victim.isStunned = false;
  });
}


  // --- Input ---
  onKeyDown(e){
    if (this.gameOver) return;

    const key = (e.key||"").toUpperCase();
    const isP1 = this.P1_KEYS.includes(key);
    const isP2 = this.P2_KEYS.includes(key);
    if (!isP1 && !isP2) return;

    // arm timers on first valid-side key
    if (!this.started) { this.started = true; this.armBothTimers(); }

    // ignore inputs for sides currently stunned (fixes spam)
    if (isP1 && this.p1.isStunned) return;
    if (isP2 && this.p2.isStunned) return;

    if (isP1) {
      if (key === this.p1.required) {
        this.p1.score++; this.p1.scoreText.setText("P1: " + this.p1.score);
        this.repairSfx.play();
        if (this.checkWinByScore("P1")) return;
        this.setPrompt("P1"); this.resetTimer("P1");
      } else {
        this.penalize("P1", `Wrong key (needed ${this.p1.required})`);
      }
    } else if (isP2) {
      if (key === this.p2.required) {
        this.p2.score++; this.p2.scoreText.setText("P2: " + this.p2.score);
        this.repairSfx.play();
        if (this.checkWinByScore("P2")) return;
        this.setPrompt("P2"); this.resetTimer("P2");
      } else {
        this.penalize("P2", `Wrong key (needed ${this.p2.required})`);
      }
    }
  }

  // --- Update ---
  update(){
    if (this.gameOver || !this.started) return;
    const now = this.time.now;

    const tick = (p, side) => {
      const fullW = p.barBg.width;
      const rem = Math.max(0, (p.deadline ?? 0) - now);
      const frac = Phaser.Math.Clamp(rem / this.TIME_LIMIT_MS, 0, 1);
      p.bar.width = fullW * frac;
      p.bar.fillColor = frac < 0.33 ? 0xff5d5d : (frac < 0.66 ? 0xffd166 : 0x29d458);
      if (rem === 0) this.penalize(side, "Timed out");
    };

    tick(this.p1, "P1");
    tick(this.p2, "P2");
  }

  // --- Finish ---
  finishMatch(message, delay=300){
    if (this.gameOver) return;
    this.gameOver = true;

    this.uiElements.forEach(el => el.destroy());
    this.uiElements = [];

    this.time.delayedCall(delay, () => {
      this.scene.start("gameEndScene", {
        msg: message,
        p1: this.p1.score,
        p2: this.p2.score
      });
    });
  }
}
