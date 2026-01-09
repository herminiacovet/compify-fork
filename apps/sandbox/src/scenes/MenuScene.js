import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Create starfield background using graphics
        this.createStarfield();

        // Add title
        this.add.text(400, 200, 'ASTEROID SHOOTER', {
            fontSize: '48px',
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Add subtitle
        this.add.text(400, 280, 'Destroy asteroids and survive as long as you can!', {
            fontSize: '20px',
            fill: '#cccccc',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        // Add game features
        this.add.text(400, 320, '• Shoot asteroids to earn points\n• Avoid collisions to preserve lives\n• Game gets faster as you progress', {
            fontSize: '16px',
            fill: '#aaaaaa',
            fontFamily: 'Arial, sans-serif',
            align: 'center'
        }).setOrigin(0.5);

        // Create play button using graphics
        const playButton = this.add.graphics();
        playButton.fillStyle(0x4a90e2); // Blue
        playButton.fillRoundedRect(-100, -25, 200, 50, 8);
        playButton.x = 400;
        playButton.y = 420;
        playButton.setInteractive(new Phaser.Geom.Rectangle(-100, -25, 200, 50), Phaser.Geom.Rectangle.Contains);
        
        // Add button text
        this.add.text(400, 420, 'PLAY GAME', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        // Button hover effects
        playButton.on('pointerover', () => {
            playButton.clear();
            playButton.fillStyle(0x6bb6ff); // Lighter blue
            playButton.fillRoundedRect(-100, -25, 200, 50, 8);
            this.game.canvas.style.cursor = 'pointer';
        });

        playButton.on('pointerout', () => {
            playButton.clear();
            playButton.fillStyle(0x4a90e2); // Original blue
            playButton.fillRoundedRect(-100, -25, 200, 50, 8);
            this.game.canvas.style.cursor = 'default';
        });

        // Start game on click
        playButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Add instructions
        this.add.text(400, 520, 'Use ARROW KEYS or WASD to move, SPACE to shoot', {
            fontSize: '16px',
            fill: '#888888',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        this.add.text(400, 540, 'Press SPACE or click PLAY GAME to start', {
            fontSize: '14px',
            fill: '#666666',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        // Add keyboard shortcut
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        console.log('MenuScene created successfully');
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
        // Allow space to start game
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.scene.start('GameScene');
        }
    }
}