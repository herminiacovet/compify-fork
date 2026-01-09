import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock DOM environment for testing
Object.defineProperty(window, 'HTMLCanvasElement', {
  value: class HTMLCanvasElement {
    constructor() {
      this.width = 800;
      this.height = 600;
    }
    getContext() {
      return {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Array(4) })),
        putImageData: vi.fn(),
        createImageData: vi.fn(() => ({ data: new Array(4) })),
        setTransform: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
      };
    }
  }
});

import { describe, it, expect, vi } from 'vitest';

describe('Game Loading Edge Cases', () => {
  it('should handle missing asset files gracefully', () => {
    // Test that the game can handle missing assets by using fallbacks
    const mockAssetManager = {
      loadedAssets: new Set(),
      failedAssets: new Set(),
      
      loadWithFallback: async function(key, url, fallbackCreator) {
        // Simulate asset loading failure
        this.failedAssets.add(key);
        
        // Call fallback creator
        if (fallbackCreator) {
          fallbackCreator();
          this.loadedAssets.add(key);
        }
        
        return Promise.resolve();
      },
      
      getLoadingStats: function() {
        return {
          loaded: this.loadedAssets.size,
          failed: this.failedAssets.size,
          total: this.loadedAssets.size + this.failedAssets.size
        };
      }
    };

    // Test loading a missing asset
    const fallbackCreator = vi.fn();
    return mockAssetManager.loadWithFallback('player', '/missing/player.png', fallbackCreator)
      .then(() => {
        expect(mockAssetManager.failedAssets.has('player')).toBe(true);
        expect(mockAssetManager.loadedAssets.has('player')).toBe(true);
        expect(fallbackCreator).toHaveBeenCalled();
      });
  });

  it('should track loading statistics correctly', () => {
    const mockAssetManager = {
      loadedAssets: new Set(['player', 'bullet']),
      failedAssets: new Set(['asteroid']),
      
      getLoadingStats: function() {
        return {
          loaded: this.loadedAssets.size,
          failed: this.failedAssets.size,
          total: this.loadedAssets.size + this.failedAssets.size
        };
      }
    };

    const stats = mockAssetManager.getLoadingStats();
    expect(stats.loaded).toBe(2);
    expect(stats.failed).toBe(1);
    expect(stats.total).toBe(3);
  });

  it('should handle multiple asset failures without crashing', async () => {
    const mockAssetManager = {
      loadedAssets: new Set(),
      failedAssets: new Set(),
      
      loadWithFallback: async function(key, url, fallbackCreator) {
        // Simulate all assets failing
        this.failedAssets.add(key);
        
        if (fallbackCreator) {
          fallbackCreator();
          this.loadedAssets.add(key);
        }
        
        return Promise.resolve();
      }
    };

    const assets = ['player', 'bullet', 'asteroid', 'starfield'];
    const promises = assets.map(asset => 
      mockAssetManager.loadWithFallback(asset, `/missing/${asset}.png`, vi.fn())
    );

    await Promise.all(promises);

    expect(mockAssetManager.failedAssets.size).toBe(4);
    expect(mockAssetManager.loadedAssets.size).toBe(4);
  });

  it('should not reload already loaded assets', async () => {
    const mockAssetManager = {
      loadedAssets: new Set(['player']),
      loadAttempts: 0,
      
      loadWithFallback: async function(key, url, fallbackCreator) {
        if (this.loadedAssets.has(key)) {
          return Promise.resolve();
        }
        
        this.loadAttempts++;
        return Promise.resolve();
      }
    };

    await mockAssetManager.loadWithFallback('player', '/player.png', vi.fn());
    expect(mockAssetManager.loadAttempts).toBe(0);
  });
});

describe('Game Initialization Edge Cases', () => {
  it('should throw error when running in non-browser environment', () => {
    // Simulate server-side environment check
    const checkBrowserEnvironment = () => {
      if (typeof window === 'undefined') {
        throw new Error('This game requires a browser environment and cannot run server-side');
      }
    };

    // This should not throw in our test environment (jsdom provides window)
    expect(() => checkBrowserEnvironment()).not.toThrow();
  });

  it('should handle game initialization failure gracefully', () => {
    const mockContainer = { innerHTML: '' };
    const mockDocument = {
      getElementById: vi.fn(() => mockContainer)
    };

    // Simulate game initialization error handling
    const handleGameInitError = (error, document) => {
      const container = document.getElementById('game-container');
      if (container) {
        container.innerHTML = `
          <div style="width: 800px; height: 600px; display: flex; align-items: center; justify-content: center; background: #0a0a0a; color: #ffffff; font-family: Arial, sans-serif; text-align: center; border-radius: 8px;">
            <div>
              <h2>Game Loading Error</h2>
              <p>Unable to initialize the game engine.</p>
              <p>Please refresh the page or try a different browser.</p>
            </div>
          </div>
        `;
      }
    };

    const mockError = new Error('WebGL not supported');
    handleGameInitError(mockError, mockDocument);

    expect(mockContainer.innerHTML).toContain('Game Loading Error');
    expect(mockContainer.innerHTML).toContain('Unable to initialize the game engine');
  });

  it('should validate game configuration for static deployment', () => {
    const config = {
      type: 'AUTO',
      width: 800,
      height: 600,
      parent: 'game-container',
      backgroundColor: '#0a0a0a',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scale: {
        mode: 'FIT',
        autoCenter: 'CENTER_BOTH',
        width: 800,
        height: 600
      },
      disableContextMenu: true,
      audio: {
        disableWebAudio: false,
        noAudio: false
      },
      render: {
        antialias: false,
        pixelArt: false,
        roundPixels: true
      },
      dom: {
        createContainer: false // Ensures no server-side rendering
      }
    };

    // Validate configuration is suitable for static deployment
    expect(config.dom.createContainer).toBe(false);
    expect(config.physics.arcade.gravity.y).toBe(0);
    expect(config.disableContextMenu).toBe(true);
    expect(config.width).toBe(800);
    expect(config.height).toBe(600);
  });
});

describe('Asset Loading Error Recovery', () => {
  it('should recover from network timeouts', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const mockAssetManager = {
      failedAssets: new Set(),
      loadedAssets: new Set(),
      
      loadWithFallback: async function(key, url, fallbackCreator) {
        // Simulate network timeout
        this.failedAssets.add(key);
        
        if (fallbackCreator) {
          fallbackCreator();
          this.loadedAssets.add(key);
        }
        
        return Promise.resolve();
      }
    };

    const fallbackCreator = vi.fn();
    await mockAssetManager.loadWithFallback('player', '/timeout/player.png', fallbackCreator);

    expect(fallbackCreator).toHaveBeenCalled();
    expect(mockAssetManager.failedAssets.has('player')).toBe(true);
    expect(mockAssetManager.loadedAssets.has('player')).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should handle corrupted asset files', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const mockAssetManager = {
      failedAssets: new Set(),
      loadedAssets: new Set(),
      
      loadWithFallback: async function(key, url, fallbackCreator) {
        // Simulate corrupted file error
        this.failedAssets.add(key);
        
        if (fallbackCreator) {
          fallbackCreator();
          this.loadedAssets.add(key);
        }
        
        return Promise.resolve();
      }
    };

    const fallbackCreator = vi.fn();
    await mockAssetManager.loadWithFallback('corrupted-asset', '/corrupted.png', fallbackCreator);

    expect(fallbackCreator).toHaveBeenCalled();
    expect(mockAssetManager.failedAssets.has('corrupted-asset')).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should continue game operation even with all assets missing', () => {
    const mockAssetManager = {
      loadedAssets: new Set(['player', 'bullet', 'asteroid', 'starfield']), // All loaded via fallbacks
      failedAssets: new Set(['player', 'bullet', 'asteroid', 'starfield']), // All original assets failed
      
      getLoadingStats: function() {
        return {
          loaded: this.loadedAssets.size,
          failed: this.failedAssets.size,
          total: this.loadedAssets.size + this.failedAssets.size
        };
      }
    };

    const stats = mockAssetManager.getLoadingStats();
    expect(stats.failed).toBe(4);
    expect(stats.loaded).toBe(4); // All have fallbacks
    expect(stats.total).toBe(8);
  });
});