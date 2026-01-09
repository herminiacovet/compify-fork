import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
    }

    create() {
        // Create starfield background using graphics
        this.createStarfield();

        // Game Over title
        this.add.text(400, 150, 'GAME OVER', {
            fontSize: '64px',
            fill: '#ff0000',
            fontFamily: 'Arial, sans-serif',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Final score
        this.add.text(400, 250, `Final Score: ${this.finalScore}`, {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // High score message (simple local storage)
        const highScore = this.getHighScore();
        if (this.finalScore > highScore) {
            this.setHighScore(this.finalScore);
            this.add.text(400, 300, 'NEW HIGH SCORE!', {
                fontSize: '24px',
                fill: '#ffff00',
                fontFamily: 'Arial, sans-serif',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
        } else {
            this.add.text(400, 300, `High Score: ${highScore}`, {
                fontSize: '24px',
                fill: '#cccccc',
                fontFamily: 'Arial, sans-serif'
            }).setOrigin(0.5);
        }

        // Play Again button using graphics
        const playAgainButton = this.add.graphics();
        playAgainButton.fillStyle(0x4a90e2); // Blue
        playAgainButton.fillRoundedRect(-100, -25, 200, 50, 8);
        playAgainButton.x = 300;
        playAgainButton.y = 400;
        playAgainButton.setInteractive(new Phaser.Geom.Rectangle(-100, -25, 200, 50), Phaser.Geom.Rectangle.Contains);

        this.add.text(300, 400, 'PLAY AGAIN', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        // Menu button using graphics
        const menuButton = this.add.graphics();
        menuButton.fillStyle(0xe74c3c); // Red
        menuButton.fillRoundedRect(-100, -25, 200, 50, 8);
        menuButton.x = 500;
        menuButton.y = 400;
        menuButton.setInteractive(new Phaser.Geom.Rectangle(-100, -25, 200, 50), Phaser.Geom.Rectangle.Contains);

        this.add.text(500, 400, 'MAIN MENU', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        // Button hover effects
        playAgainButton.on('pointerover', () => {
            playAgainButton.clear();
            playAgainButton.fillStyle(0x6bb6ff); // Lighter blue
            playAgainButton.fillRoundedRect(-100, -25, 200, 50, 8);
            this.game.canvas.style.cursor = 'pointer';
        });

        playAgainButton.on('pointerout', () => {
            playAgainButton.clear();
            playAgainButton.fillStyle(0x4a90e2); // Original blue
            playAgainButton.fillRoundedRect(-100, -25, 200, 50, 8);
            this.game.canvas.style.cursor = 'default';
        });

        menuButton.on('pointerover', () => {
            menuButton.clear();
            menuButton.fillStyle(0xff6b6b); // Lighter red
            menuButton.fillRoundedRect(-100, -25, 200, 50, 8);
            this.game.canvas.style.cursor = 'pointer';
        });

        menuButton.on('pointerout', () => {
            menuButton.clear();
            menuButton.fillStyle(0xe74c3c); // Original red
            menuButton.fillRoundedRect(-100, -25, 200, 50, 8);
            this.game.canvas.style.cursor = 'default';
        });

        // Button actions
        playAgainButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // Add restart instruction
        this.add.text(400, 500, 'Press R to restart or M for menu', {
            fontSize: '16px',
            fill: '#888888',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        // Keyboard shortcuts
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

        console.log('GameOverScene created successfully');
    }

    createStarfield() {
        // Create a simple starfield background
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000011); // Dark blue background
        graphics.fillRect(0, 0, 800, 600);
        
        // Add random white dots as stars
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 800;
            const y = Math.random() * 600;
            const size = Math.random() > 0.8 ? 2 : 1;
            graphics.fillStyle(0xffffff);
            graphics.fillRect(x, y, size, size);
        }
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.start('GameScene');
        }

        if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
            this.scene.start('MenuScene');
        }
    }

    getHighScore() {
        try {
            return parseInt(localStorage.getItem('compify-asteroid-highscore') || '0');
        } catch (e) {
            return 0;
        }
    }

    setHighScore(score) {
        try {
            localStorage.setItem('compify-asteroid-highscore', score.toString());
        } catch (e) {
            // Silently fail if localStorage is not available
        }
    }
}