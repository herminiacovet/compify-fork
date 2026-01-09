import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';

// Ensure we're running in a browser environment (no server dependencies)
if (typeof window === 'undefined') {
    throw new Error('This game requires a browser environment and cannot run server-side');
}

// Phaser game configuration optimized for static deployment
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // No gravity for space shooter
            debug: false
        }
    },
    scene: [MenuScene, GameScene, GameOverScene],
    // Optimize for web deployment
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    // Disable context menu
    disableContextMenu: true,
    // Audio configuration (no audio files for MVP)
    audio: {
        disableWebAudio: false,
        noAudio: false
    },
    // Performance optimizations
    render: {
        antialias: false,
        pixelArt: false,
        roundPixels: true
    },
    // Ensure no server-side rendering
    dom: {
        createContainer: false
    }
};

// Initialize the game with error handling
let game;
try {
    game = new Phaser.Game(config);
    
    // Add global error handling
    game.events.on('ready', () => {
        console.log('Compify Game Sandbox loaded successfully');
    });
    
} catch (error) {
    console.error('Failed to initialize game:', error);
    
    // Show fallback error message
    const container = document.getElementById('game-container');
    if (container) {
        container.innerHTML = `
            <div style="
                width: 800px; 
                height: 600px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                background: #0a0a0a; 
                color: #ffffff; 
                font-family: Arial, sans-serif;
                text-align: center;
                border-radius: 8px;
            ">
                <div>
                    <h2>Game Loading Error</h2>
                    <p>Unable to initialize the game engine.</p>
                    <p>Please refresh the page or try a different browser.</p>
                </div>
            </div>
        `;
    }
}

// Export for potential future use (but ensure no server-side usage)
export default game;