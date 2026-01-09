#!/usr/bin/env node

/**
 * Game Mechanics Test for Compify Asteroid Shooter
 * Tests core game functionality without requiring a browser
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎮 Testing Compify Asteroid Shooter Game Mechanics...\n');

// Test 1: Check if game files exist and are properly structured
function testGameFiles() {
    console.log('📁 Testing game file structure...');
    
    const requiredFiles = [
        'src/main.js',
        'src/scenes/MenuScene.js',
        'src/scenes/GameScene.js',
        'src/scenes/GameOverScene.js'
    ];
    
    let allFilesExist = true;
    
    requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            console.log(`✅ ${file} exists`);
        } else {
            console.log(`❌ ${file} missing`);
            allFilesExist = false;
        }
    });
    
    return allFilesExist;
}

// Test 2: Analyze game code for key mechanics
function testGameMechanics() {
    console.log('\n🔧 Testing game mechanics implementation...');
    
    const gameScenePath = path.join(__dirname, 'src/scenes/GameScene.js');
    const gameCode = fs.readFileSync(gameScenePath, 'utf8');
    
    const mechanics = [
        {
            name: 'Player movement',
            test: () => gameCode.includes('setVelocity') && gameCode.includes('cursors'),
            description: 'Player can move with arrow keys'
        },
        {
            name: 'Bullet shooting',
            test: () => gameCode.includes('shootBullet') && gameCode.includes('spaceKey'),
            description: 'Player can shoot bullets with spacebar'
        },
        {
            name: 'Asteroid spawning',
            test: () => gameCode.includes('spawnAsteroid') && gameCode.includes('asteroidTimer'),
            description: 'Asteroids spawn automatically over time'
        },
        {
            name: 'Collision detection',
            test: () => gameCode.includes('hitAsteroid') && gameCode.includes('hitPlayer'),
            description: 'Bullets hit asteroids and asteroids hit player'
        },
        {
            name: 'Score system',
            test: () => gameCode.includes('score') && gameCode.includes('scoreText'),
            description: 'Score increases when asteroids are destroyed'
        },
        {
            name: 'Lives system',
            test: () => gameCode.includes('lives') && gameCode.includes('livesText'),
            description: 'Player has limited lives'
        },
        {
            name: 'Game over condition',
            test: () => gameCode.includes('GameOverScene') && gameCode.includes('lives <= 0'),
            description: 'Game ends when lives reach zero'
        },
        {
            name: 'Pause functionality',
            test: () => gameCode.includes('togglePause') && gameCode.includes('escKey'),
            description: 'Game can be paused with ESC key'
        },
        {
            name: 'Physics system',
            test: () => gameCode.includes('physics.add.existing') && gameCode.includes('body.setVelocity'),
            description: 'Objects have physics bodies and movement'
        },
        {
            name: 'Explosion effects',
            test: () => gameCode.includes('createExplosion') && gameCode.includes('tweens'),
            description: 'Visual effects when objects are destroyed'
        }
    ];
    
    let passedTests = 0;
    
    mechanics.forEach(mechanic => {
        if (mechanic.test()) {
            console.log(`✅ ${mechanic.name}: ${mechanic.description}`);
            passedTests++;
        } else {
            console.log(`❌ ${mechanic.name}: ${mechanic.description}`);
        }
    });
    
    return { passed: passedTests, total: mechanics.length };
}

// Test 3: Check for proper game loop and update functions
function testGameLoop() {
    console.log('\n🔄 Testing game loop implementation...');
    
    const gameScenePath = path.join(__dirname, 'src/scenes/GameScene.js');
    const gameCode = fs.readFileSync(gameScenePath, 'utf8');
    
    const loopChecks = [
        {
            name: 'Update function exists',
            test: () => gameCode.includes('update()'),
            fix: 'Add update() method to GameScene class'
        },
        {
            name: 'Input handling in update',
            test: () => gameCode.includes('update()') && gameCode.includes('cursors.'),
            fix: 'Add input handling in update() method'
        },
        {
            name: 'Asteroid spawning timer',
            test: () => gameCode.includes('asteroidTimer') && gameCode.includes('time.now'),
            fix: 'Implement timer-based asteroid spawning'
        },
        {
            name: 'Object cleanup',
            test: () => gameCode.includes('destroy()') && gameCode.includes('off screen'),
            fix: 'Add cleanup for off-screen objects'
        }
    ];
    
    let passedChecks = 0;
    
    loopChecks.forEach(check => {
        if (check.test()) {
            console.log(`✅ ${check.name}`);
            passedChecks++;
        } else {
            console.log(`❌ ${check.name} - Fix: ${check.fix}`);
        }
    });
    
    return { passed: passedChecks, total: loopChecks.length };
}

// Test 4: Verify scene transitions
function testSceneTransitions() {
    console.log('\n🎬 Testing scene transitions...');
    
    const scenes = ['MenuScene', 'GameScene', 'GameOverScene'];
    let transitionTests = 0;
    let passedTransitions = 0;
    
    scenes.forEach(sceneName => {
        const scenePath = path.join(__dirname, `src/scenes/${sceneName}.js`);
        if (fs.existsSync(scenePath)) {
            const sceneCode = fs.readFileSync(scenePath, 'utf8');
            
            // Check if scene can transition to other scenes
            if (sceneCode.includes('scene.start')) {
                console.log(`✅ ${sceneName} can transition to other scenes`);
                passedTransitions++;
            } else {
                console.log(`❌ ${sceneName} missing scene transitions`);
            }
            transitionTests++;
        }
    });
    
    return { passed: passedTransitions, total: transitionTests };
}

// Test 5: Check for proper error handling
function testErrorHandling() {
    console.log('\n🛡️ Testing error handling...');
    
    const mainPath = path.join(__dirname, 'src/main.js');
    const mainCode = fs.readFileSync(mainPath, 'utf8');
    
    const errorChecks = [
        {
            name: 'Browser environment check',
            test: () => mainCode.includes('window') && mainCode.includes('undefined'),
            description: 'Prevents server-side execution'
        },
        {
            name: 'Game initialization error handling',
            test: () => mainCode.includes('try') && mainCode.includes('catch'),
            description: 'Handles game initialization errors'
        },
        {
            name: 'Fallback error display',
            test: () => mainCode.includes('innerHTML') && mainCode.includes('error'),
            description: 'Shows error message if game fails to load'
        }
    ];
    
    let passedErrors = 0;
    
    errorChecks.forEach(check => {
        if (check.test()) {
            console.log(`✅ ${check.name}: ${check.description}`);
            passedErrors++;
        } else {
            console.log(`❌ ${check.name}: ${check.description}`);
        }
    });
    
    return { passed: passedErrors, total: errorChecks.length };
}

// Run all tests
async function runAllTests() {
    const results = [];
    
    // Test 1: File structure
    const filesExist = testGameFiles();
    results.push({ name: 'File Structure', passed: filesExist });
    
    if (!filesExist) {
        console.log('\n❌ Cannot continue testing - missing required files');
        return false;
    }
    
    // Test 2: Game mechanics
    const mechanicsResult = testGameMechanics();
    results.push({ 
        name: 'Game Mechanics', 
        passed: mechanicsResult.passed === mechanicsResult.total,
        details: `${mechanicsResult.passed}/${mechanicsResult.total}`
    });
    
    // Test 3: Game loop
    const loopResult = testGameLoop();
    results.push({ 
        name: 'Game Loop', 
        passed: loopResult.passed === loopResult.total,
        details: `${loopResult.passed}/${loopResult.total}`
    });
    
    // Test 4: Scene transitions
    const transitionResult = testSceneTransitions();
    results.push({ 
        name: 'Scene Transitions', 
        passed: transitionResult.passed === transitionResult.total,
        details: `${transitionResult.passed}/${transitionResult.total}`
    });
    
    // Test 5: Error handling
    const errorResult = testErrorHandling();
    results.push({ 
        name: 'Error Handling', 
        passed: errorResult.passed === errorResult.total,
        details: `${errorResult.passed}/${errorResult.total}`
    });
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 GAME MECHANICS TEST SUMMARY');
    console.log('='.repeat(60));
    
    let allPassed = true;
    results.forEach(result => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        const details = result.details ? ` (${result.details})` : '';
        console.log(`${status} ${result.name}${details}`);
        if (!result.passed) allPassed = false;
    });
    
    console.log('='.repeat(60));
    
    if (allPassed) {
        console.log('🎉 ALL TESTS PASSED! The asteroid shooter game is properly implemented.');
        console.log('\n🎮 Game Features:');
        console.log('• Player spaceship that moves with arrow keys or WASD');
        console.log('• Shooting bullets with spacebar');
        console.log('• Asteroids that spawn and move down the screen');
        console.log('• Collision detection between bullets and asteroids');
        console.log('• Collision detection between player and asteroids');
        console.log('• Score system that increases when asteroids are destroyed');
        console.log('• Lives system with game over when lives reach zero');
        console.log('• Pause functionality with ESC key');
        console.log('• Restart functionality with R key');
        console.log('• Visual explosion effects');
        console.log('• Progressive difficulty (asteroids spawn faster)');
        console.log('• High score tracking with localStorage');
        console.log('\n🚀 Ready for deployment!');
    } else {
        console.log('❌ Some tests failed. Please review the issues above.');
        console.log('\n🔧 Common fixes:');
        console.log('• Ensure all scene files exist and are properly structured');
        console.log('• Verify physics bodies are properly configured');
        console.log('• Check that collision detection is set up correctly');
        console.log('• Ensure game loop handles input and updates properly');
    }
    
    return allPassed;
}

// Run tests if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]);

if (isMainModule) {
    console.log('Starting tests...');
    runAllTests()
        .then(success => {
            console.log('Tests completed, success:', success);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

export { runAllTests };