export default class AssetManager {
    constructor(scene) {
        this.scene = scene;
        this.loadedAssets = new Set();
        this.failedAssets = new Set();
    }

    /**
     * Load an asset with fallback support
     * @param {string} key - Asset key
     * @param {string} url - Asset URL
     * @param {Function} fallbackCreator - Function to create fallback texture
     */
    loadWithFallback(key, url, fallbackCreator) {
        // Check if asset is already loaded
        if (this.loadedAssets.has(key)) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            // Try to load the asset
            this.scene.load.image(key, url);
            
            // Set up error handling
            this.scene.load.once(`filecomplete-image-${key}`, () => {
                this.loadedAssets.add(key);
                resolve();
            });

            this.scene.load.once(`loaderror`, (file) => {
                if (file.key === key) {
                    console.warn(`Failed to load asset: ${key}, using fallback`);
                    this.failedAssets.add(key);
                    
                    // Create fallback texture
                    if (fallbackCreator) {
                        fallbackCreator.call(this.scene);
                        this.loadedAssets.add(key);
                    }
                    resolve();
                }
            });
        });
    }

    /**
     * Preload all game assets with fallbacks
     */
    preloadGameAssets() {
        const assets = [
            {
                key: 'player',
                url: '/assets/player.png',
                fallback: this.createPlayerFallback
            },
            {
                key: 'bullet',
                url: '/assets/bullet.png',
                fallback: this.createBulletFallback
            },
            {
                key: 'asteroid',
                url: '/assets/asteroid.png',
                fallback: this.createAsteroidFallback
            },
            {
                key: 'starfield',
                url: '/assets/starfield.png',
                fallback: this.createStarfieldFallback
            }
        ];

        // Load each asset with fallback
        assets.forEach(asset => {
            this.loadWithFallback(asset.key, asset.url, asset.fallback);
        });
    }

    /**
     * Create fallback textures
     */
    createPlayerFallback() {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x00ff00);
        graphics.fillTriangle(16, 0, 0, 32, 32, 32);
        graphics.generateTexture('player', 32, 32);
        graphics.destroy();
    }

    createBulletFallback() {
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffff00);
        graphics.fillRect(0, 0, 8, 16);
        graphics.generateTexture('bullet', 8, 16);
        graphics.destroy();
    }

    createAsteroidFallback() {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x8b4513);
        graphics.fillRect(0, 0, 48, 48);
        graphics.fillStyle(0x654321);
        graphics.fillRect(8, 8, 32, 32);
        graphics.fillStyle(0xa0522d);
        graphics.fillRect(12, 12, 24, 24);
        graphics.generateTexture('asteroid', 48, 48);
        graphics.destroy();
    }

    createStarfieldFallback() {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x0a0a0a);
        graphics.fillRect(0, 0, 800, 600);
        
        // Add random stars
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 800;
            const y = Math.random() * 600;
            const brightness = Math.random();
            const color = brightness > 0.7 ? 0xffffff : brightness > 0.4 ? 0xcccccc : 0x888888;
            graphics.fillStyle(color);
            graphics.fillRect(x, y, 2, 2);
        }
        
        graphics.generateTexture('starfield', 800, 600);
        graphics.destroy();
    }

    /**
     * Get loading statistics
     */
    getLoadingStats() {
        return {
            loaded: this.loadedAssets.size,
            failed: this.failedAssets.size,
            total: this.loadedAssets.size + this.failedAssets.size
        };
    }

    /**
     * Check if all assets are loaded
     */
    isLoadingComplete() {
        return this.scene.load.totalComplete === this.scene.load.totalToLoad;
    }
}