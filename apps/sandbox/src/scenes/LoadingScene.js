import Phaser from 'phaser';

export default class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }

    preload() {
        // Create loading bar graphics
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Progress bar background
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        // Loading text
        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const percentText = this.add.text(width / 2, height / 2, '0%', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const assetText = this.add.text(width / 2, height / 2 + 50, '', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Update progress bar
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x4a90e2);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
            percentText.setText(Math.round(value * 100) + '%');
        });

        // Update asset text
        this.load.on('fileprogress', (file) => {
            assetText.setText('Loading: ' + file.key);
        });

        // Complete loading
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
        });

        // Load game assets with fallbacks
        this.loadGameAssets();
    }

    loadGameAssets() {
        // Try to load actual image assets, but create fallbacks if they fail
        
        // Create fallback textures first
        this.createFallbackTextures();

        // Attempt to load real assets (these would be actual image files in production)
        // For MVP, we'll use the fallback textures we just created
        
        // Simulate loading time for demonstration
        this.load.image('background', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        
        // Add a small delay to show the loading screen
        this.load.on('complete', () => {
            this.time.delayedCall(500, () => {
                this.scene.start('MenuScene');
            });
        });
    }

    createFallbackTextures() {
        // Player ship - green triangle
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x00ff00);
        playerGraphics.fillTriangle(16, 0, 0, 32, 32, 32);
        playerGraphics.generateTexture('player', 32, 32);
        playerGraphics.destroy();

        // Bullet - yellow rectangle
        const bulletGraphics = this.add.graphics();
        bulletGraphics.fillStyle(0xffff00);
        bulletGraphics.fillRect(0, 0, 8, 16);
        bulletGraphics.generateTexture('bullet', 8, 16);
        bulletGraphics.destroy();

        // Asteroid - brown irregular shape
        const asteroidGraphics = this.add.graphics();
        asteroidGraphics.fillStyle(0x8b4513);
        asteroidGraphics.fillRect(0, 0, 48, 48);
        // Add some irregular edges
        asteroidGraphics.fillStyle(0x654321);
        asteroidGraphics.fillRect(8, 8, 32, 32);
        asteroidGraphics.fillStyle(0xa0522d);
        asteroidGraphics.fillRect(12, 12, 24, 24);
        asteroidGraphics.generateTexture('asteroid', 48, 48);
        asteroidGraphics.destroy();

        // UI Button - blue rounded rectangle
        const buttonGraphics = this.add.graphics();
        buttonGraphics.fillStyle(0x4a90e2);
        buttonGraphics.fillRoundedRect(0, 0, 200, 50, 8);
        buttonGraphics.generateTexture('button', 200, 50);
        buttonGraphics.destroy();

        // Menu Button - red rounded rectangle
        const menuButtonGraphics = this.add.graphics();
        menuButtonGraphics.fillStyle(0xe74c3c);
        menuButtonGraphics.fillRoundedRect(0, 0, 200, 50, 8);
        menuButtonGraphics.generateTexture('menuButton', 200, 50);
        menuButtonGraphics.destroy();

        // Play Button - larger blue button
        const playButtonGraphics = this.add.graphics();
        playButtonGraphics.fillStyle(0x4a90e2);
        playButtonGraphics.fillRoundedRect(0, 0, 200, 50, 8);
        playButtonGraphics.generateTexture('playButton', 200, 50);
        playButtonGraphics.destroy();

        // Background stars texture
        const starsGraphics = this.add.graphics();
        starsGraphics.fillStyle(0x0a0a0a);
        starsGraphics.fillRect(0, 0, 800, 600);
        
        // Add random stars
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 800;
            const y = Math.random() * 600;
            const brightness = Math.random();
            const color = brightness > 0.7 ? 0xffffff : brightness > 0.4 ? 0xcccccc : 0x888888;
            starsGraphics.fillStyle(color);
            starsGraphics.fillRect(x, y, 2, 2);
        }
        
        starsGraphics.generateTexture('starfield', 800, 600);
        starsGraphics.destroy();
    }

    create() {
        // This scene will automatically transition to MenuScene after loading
    }
}