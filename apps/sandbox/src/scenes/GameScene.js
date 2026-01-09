import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        // Don't initialize game state here - do it in create() so it resets on restart
        this.shotDelay = 200; // Minimum delay between shots (this can stay as it's a constant)
    }

    preload() {
        // Create simple colored rectangles as textures for sprites
        // This is the proper way to create simple shapes in Phaser for physics objects
        
        // Player texture (green triangle)
        this.add.graphics()
            .fillStyle(0x00ff00)
            .fillTriangle(10, 0, 0, 20, 20, 20)
            .generateTexture('player', 20, 20);
        
        // Bullet texture (yellow rectangle)
        this.add.graphics()
            .fillStyle(0xffff00)
            .fillRect(0, 0, 4, 16)
            .generateTexture('bullet', 4, 16);
        
        // Asteroid texture (brown circle)
        this.add.graphics()
            .fillStyle(0x8b4513)
            .fillCircle(25, 25, 25)
            .fillStyle(0x654321)
            .fillCircle(15, 15, 8)
            .fillCircle(35, 20, 6)
            .generateTexture('asteroid', 50, 50);
    }

    create() {
        // Initialize/reset game state - this runs every time the scene starts
        this.score = 0;
        this.lives = 3;
        this.asteroidTimer = 0;
        this.asteroidDelay = 2000; // 2 seconds between asteroids
        this.lastShotTime = 0;

        // Create starfield background
        this.createStarfield();

        // Create player sprite (not graphics!)
        this.player = this.physics.add.sprite(400, 500, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDrag(300);
        this.player.body.setSize(16, 16); // Smaller collision box

        // Create physics groups for bullets and asteroids
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 20
        });
        
        this.asteroids = this.physics.add.group({
            defaultKey: 'asteroid',
            maxSize: 15
        });

        // Input handling
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');

        // Collision detection - this should work properly now with sprites
        this.physics.add.overlap(this.bullets, this.asteroids, this.hitAsteroid, null, this);
        this.physics.add.overlap(this.player, this.asteroids, this.hitPlayer, null, this);

        // UI
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        });

        this.livesText = this.add.text(16, 50, 'Lives: 3', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        });

        // Instructions
        this.add.text(400, 580, 'Use arrow keys to move • Space to shoot • ESC to pause', {
            fontSize: '16px',
            fill: '#888888',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        // Initialize timer for asteroid spawning
        this.asteroidTimer = this.time.now + this.asteroidDelay;

        // Add pause functionality
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.isPaused = false;

        // Add restart key
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        console.log('GameScene created successfully with sprites');
    }

    createStarfield() {
        // Create a simple starfield background
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000011); // Dark blue background
        graphics.fillRect(0, 0, 800, 600);
        
        // Add random white dots as stars
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * 800;
            const y = Math.random() * 600;
            const size = Math.random() > 0.8 ? 2 : 1;
            const brightness = Math.random() > 0.5 ? 0xffffff : 0xcccccc;
            graphics.fillStyle(brightness);
            graphics.fillRect(x, y, size, size);
        }
    }

    update() {
        // Handle pause
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.togglePause();
        }

        // Handle restart
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }

        if (this.isPaused) {
            return;
        }

        // Player movement - using setVelocity on the sprite body
        const speed = 300;
        let velocityX = 0;
        let velocityY = 0;

        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            velocityX = -speed;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            velocityX = speed;
        }

        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            velocityY = -speed;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            velocityY = speed;
        }

        this.player.setVelocity(velocityX, velocityY);

        // Shooting with rate limiting
        if (this.spaceKey.isDown && this.time.now > this.lastShotTime + this.shotDelay) {
            this.shootBullet();
            this.lastShotTime = this.time.now;
        }

        // Spawn asteroids based on timer
        if (this.time.now > this.asteroidTimer) {
            this.spawnAsteroid();
            this.asteroidTimer = this.time.now + this.asteroidDelay;
            
            // Gradually increase difficulty
            if (this.asteroidDelay > 800) {
                this.asteroidDelay -= 100;
            }
        }

        // Clean up bullets that are off screen
        this.bullets.children.entries.forEach(bullet => {
            if (bullet.y < -50) {
                bullet.destroy();
            }
        });

        // Clean up asteroids that are off screen
        this.asteroids.children.entries.forEach(asteroid => {
            if (asteroid.y > 650) {
                asteroid.destroy();
            }
        });
    }

    shootBullet() {
        // Get a bullet from the group or create a new one
        const bullet = this.bullets.get(this.player.x, this.player.y - 20);
        
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.body.enable = true;
            bullet.setVelocityY(-500); // Fast upward movement
            bullet.body.setSize(4, 16);
            
            console.log('Bullet fired at:', bullet.x, bullet.y, 'Velocity Y:', bullet.body.velocity.y);
        }
    }

    spawnAsteroid() {
        // Get an asteroid from the group or create a new one
        const x = Phaser.Math.Between(50, 750);
        const asteroid = this.asteroids.get(x, -50);
        
        if (asteroid) {
            asteroid.setActive(true);
            asteroid.setVisible(true);
            asteroid.body.enable = true;
            
            // Set random size
            const scale = Phaser.Math.FloatBetween(0.5, 1.5);
            asteroid.setScale(scale);
            asteroid.asteroidSize = 25 * scale; // Store for scoring
            
            // Set velocity and rotation
            asteroid.setVelocityY(Phaser.Math.Between(100, 250));
            asteroid.setAngularVelocity(Phaser.Math.Between(-200, 200));
            
            // Set collision body size based on scale
            asteroid.body.setSize(40 * scale, 40 * scale);
            
            console.log('Asteroid spawned at:', asteroid.x, asteroid.y, 'Scale:', scale, 'Velocity Y:', asteroid.body.velocity.y);
        }
    }

    hitAsteroid(bullet, asteroid) {
        // Create explosion effect
        this.createExplosion(asteroid.x, asteroid.y, 0xff6600);
        
        // Deactivate objects (proper way with object pools)
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false;
        
        asteroid.setActive(false);
        asteroid.setVisible(false);
        asteroid.body.enable = false;
        
        // Update score based on asteroid size
        const points = Math.max(10, Math.floor(60 - (asteroid.asteroidSize || 25)));
        this.score += points;
        this.scoreText.setText('Score: ' + this.score);
        
        console.log('Asteroid hit! Points:', points, 'Total Score:', this.score);
    }

    hitPlayer(player, asteroid) {
        // Only process if player is not already invincible
        if (!player.invincible) {
            // Create explosion effect
            this.createExplosion(player.x, player.y, 0xff0000);
            
            // Deactivate asteroid
            asteroid.setActive(false);
            asteroid.setVisible(false);
            asteroid.body.enable = false;
            
            this.lives -= 1;
            this.livesText.setText('Lives: ' + this.lives);

            // Flash player red briefly and make invincible
            player.setTint(0xff0000);
            player.invincible = true;
            
            this.time.delayedCall(300, () => {
                player.clearTint();
            });
            
            this.time.delayedCall(1500, () => {
                player.invincible = false;
            });

            if (this.lives <= 0) {
                this.scene.start('GameOverScene', { score: this.score });
            }
            
            console.log('Player hit! Lives:', this.lives);
        }
    }

    createExplosion(x, y, color = 0xff6600) {
        // Create explosion particles using sprites for better performance
        for (let i = 0; i < 8; i++) {
            const particle = this.add.rectangle(x, y, 4, 4, color);
            
            // Random velocity for explosion effect
            const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const speed = Phaser.Math.Between(50, 150);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            // Animate the particle
            this.tweens.add({
                targets: particle,
                x: particle.x + vx,
                y: particle.y + vy,
                alpha: 0,
                scaleX: 0.1,
                scaleY: 0.1,
                duration: 600,
                onComplete: () => particle.destroy()
            });
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.physics.pause();
            this.pauseText = this.add.text(400, 300, 'PAUSED\n\nPress ESC to resume\nPress R to restart', {
                fontSize: '32px',
                fill: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                align: 'center',
                backgroundColor: '#000000',
                padding: { x: 30, y: 20 }
            }).setOrigin(0.5);
        } else {
            this.physics.resume();
            if (this.pauseText) {
                this.pauseText.destroy();
                this.pauseText = null;
            }
        }
    }
}