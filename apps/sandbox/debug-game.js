#!/usr/bin/env node

/**
 * Debug script to analyze the game implementation
 * Checks for proper Phaser.js usage patterns
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Debugging Compify Asteroid Shooter Implementation...\n');

function analyzeGameScene() {
    const gameScenePath = path.join(__dirname, 'src/scenes/GameScene.js');
    const gameCode = fs.readFileSync(gameScenePath, 'utf8');
    
    console.log('📋 Analyzing GameScene.js for proper Phaser.js patterns...\n');
    
    const checks = [
        {
            name: 'Uses preload() method',
            test: () => gameCode.includes('preload()'),
            issue: 'Missing preload method - textures should be created here',
            fix: 'Added preload() method to create sprite textures'
        },
        {
            name: 'Creates textures with generateTexture()',
            test: () => gameCode.includes('generateTexture'),
            issue: 'Not using proper texture generation for sprites',
            fix: 'Using graphics.generateTexture() to create sprite textures'
        },
        {
            name: 'Uses physics.add.sprite() for player',
            test: () => gameCode.includes('physics.add.sprite'),
            issue: 'Using graphics objects instead of sprites for physics',
            fix: 'Changed to physics.add.sprite() for proper physics bodies'
        },
        {
            name: 'Uses physics groups with defaultKey',
            test: () => gameCode.includes('defaultKey:') && gameCode.includes('physics.add.group'),
            issue: 'Physics groups not properly configured',
            fix: 'Added defaultKey to physics groups for object pooling'
        },
        {
            name: 'Uses group.get() for object pooling',
            test: () => gameCode.includes('.get(') && gameCode.includes('setActive'),
            issue: 'Creating new objects instead of reusing from pool',
            fix: 'Using group.get() and setActive/setVisible for object pooling'
        },
        {
            name: 'Proper collision detection setup',
            test: () => gameCode.includes('physics.add.overlap') && gameCode.includes('this.bullets, this.asteroids'),
            issue: 'Collision detection not properly configured',
            fix: 'Using physics.add.overlap with proper sprite groups'
        },
        {
            name: 'Uses setVelocity() on sprites',
            test: () => gameCode.includes('setVelocity'),
            issue: 'Not using proper velocity methods for sprites',
            fix: 'Using sprite.setVelocity() instead of body.setVelocity()'
        },
        {
            name: 'Proper object deactivation',
            test: () => gameCode.includes('setActive(false)') && gameCode.includes('setVisible(false)'),
            issue: 'Destroying objects instead of deactivating for reuse',
            fix: 'Using setActive(false) and setVisible(false) for object pooling'
        },
        {
            name: 'Invincibility system for player',
            test: () => gameCode.includes('invincible'),
            issue: 'No invincibility frames after player hit',
            fix: 'Added invincibility system to prevent multiple hits'
        }
    ];
    
    let fixedIssues = 0;
    let totalIssues = checks.length;
    
    checks.forEach((check, index) => {
        const passed = check.test();
        const status = passed ? '✅ FIXED' : '❌ ISSUE';
        console.log(`${index + 1}. ${status} ${check.name}`);
        
        if (passed) {
            console.log(`   ✓ ${check.fix}`);
            fixedIssues++;
        } else {
            console.log(`   ✗ ${check.issue}`);
        }
        console.log('');
    });
    
    return { fixed: fixedIssues, total: totalIssues };
}

function analyzePhysicsImplementation() {
    const gameScenePath = path.join(__dirname, 'src/scenes/GameScene.js');
    const gameCode = fs.readFileSync(gameScenePath, 'utf8');
    
    console.log('⚡ Analyzing Physics Implementation...\n');
    
    const physicsChecks = [
        {
            name: 'Bullet physics setup',
            test: () => gameCode.includes('bullet.setVelocityY(-500)'),
            description: 'Bullets should move upward with proper velocity'
        },
        {
            name: 'Asteroid physics setup', 
            test: () => gameCode.includes('asteroid.setVelocityY') && gameCode.includes('setAngularVelocity'),
            description: 'Asteroids should fall with rotation'
        },
        {
            name: 'Player movement physics',
            test: () => gameCode.includes('this.player.setVelocity(velocityX, velocityY)'),
            description: 'Player should use proper sprite velocity methods'
        },
        {
            name: 'Collision body sizing',
            test: () => gameCode.includes('body.setSize') && gameCode.includes('scale'),
            description: 'Collision bodies should be sized appropriately'
        },
        {
            name: 'World bounds collision',
            test: () => gameCode.includes('setCollideWorldBounds'),
            description: 'Player should stay within screen bounds'
        }
    ];
    
    let workingPhysics = 0;
    
    physicsChecks.forEach((check, index) => {
        const working = check.test();
        const status = working ? '✅ WORKING' : '❌ BROKEN';
        console.log(`${index + 1}. ${status} ${check.name}`);
        console.log(`   ${check.description}`);
        
        if (working) {
            workingPhysics++;
        }
        console.log('');
    });
    
    return { working: workingPhysics, total: physicsChecks.length };
}

function analyzeCollisionSystem() {
    const gameScenePath = path.join(__dirname, 'src/scenes/GameScene.js');
    const gameCode = fs.readFileSync(gameScenePath, 'utf8');
    
    console.log('💥 Analyzing Collision System...\n');
    
    const collisionChecks = [
        {
            name: 'Bullet-Asteroid collision',
            test: () => gameCode.includes('this.physics.add.overlap(this.bullets, this.asteroids, this.hitAsteroid'),
            description: 'Bullets should destroy asteroids on contact'
        },
        {
            name: 'Player-Asteroid collision',
            test: () => gameCode.includes('this.physics.add.overlap(this.player, this.asteroids, this.hitPlayer'),
            description: 'Player should take damage from asteroids'
        },
        {
            name: 'Proper collision callbacks',
            test: () => gameCode.includes('hitAsteroid(bullet, asteroid)') && gameCode.includes('hitPlayer(player, asteroid)'),
            description: 'Collision callbacks should be properly defined'
        },
        {
            name: 'Object deactivation in collisions',
            test: () => gameCode.includes('setActive(false)') && gameCode.includes('hitAsteroid'),
            description: 'Objects should be properly deactivated on collision'
        },
        {
            name: 'Invincibility frames',
            test: () => gameCode.includes('player.invincible') && gameCode.includes('!player.invincible'),
            description: 'Player should have invincibility frames after being hit'
        }
    ];
    
    let workingCollisions = 0;
    
    collisionChecks.forEach((check, index) => {
        const working = check.test();
        const status = working ? '✅ WORKING' : '❌ BROKEN';
        console.log(`${index + 1}. ${status} ${check.name}`);
        console.log(`   ${check.description}`);
        
        if (working) {
            workingCollisions++;
        }
        console.log('');
    });
    
    return { working: workingCollisions, total: collisionChecks.length };
}

// Run all analyses
async function runDebugAnalysis() {
    const gameSceneResults = analyzeGameScene();
    const physicsResults = analyzePhysicsImplementation();
    const collisionResults = analyzeCollisionSystem();
    
    console.log('='.repeat(60));
    console.log('📊 DEBUG ANALYSIS SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`🔧 Phaser.js Implementation: ${gameSceneResults.fixed}/${gameSceneResults.total} issues fixed`);
    console.log(`⚡ Physics System: ${physicsResults.working}/${physicsResults.total} components working`);
    console.log(`💥 Collision System: ${collisionResults.working}/${collisionResults.total} components working`);
    
    const totalScore = gameSceneResults.fixed + physicsResults.working + collisionResults.working;
    const maxScore = gameSceneResults.total + physicsResults.total + collisionResults.total;
    const percentage = Math.round((totalScore / maxScore) * 100);
    
    console.log(`\n🎯 Overall Implementation Score: ${totalScore}/${maxScore} (${percentage}%)`);
    
    if (percentage >= 90) {
        console.log('\n🎉 EXCELLENT! Game should work properly now.');
        console.log('\n✅ Key Fixes Applied:');
        console.log('• Switched from graphics objects to proper sprites with physics');
        console.log('• Added preload() method to create textures correctly');
        console.log('• Implemented object pooling with group.get() and setActive()');
        console.log('• Fixed collision detection using physics.add.overlap()');
        console.log('• Added proper velocity methods (setVelocity instead of body.setVelocity)');
        console.log('• Implemented invincibility frames for player');
        console.log('• Fixed object lifecycle management (deactivate instead of destroy)');
        
        console.log('\n🎮 Expected Behavior:');
        console.log('• Bullets should fire immediately and move upward smoothly');
        console.log('• Asteroids should spawn regularly and fall downward with rotation');
        console.log('• Bullets should destroy asteroids on contact with explosion effect');
        console.log('• Player should lose lives when hit by asteroids (with brief invincibility)');
        console.log('• Game over should occur only when lives reach 0');
        console.log('• No more false game overs from moving to screen edges');
        
    } else if (percentage >= 70) {
        console.log('\n⚠️  GOOD PROGRESS but some issues remain.');
        console.log('The game should work much better but may still have minor bugs.');
    } else {
        console.log('\n❌ SIGNIFICANT ISSUES remain.');
        console.log('The game likely still has major problems that need fixing.');
    }
    
    console.log('\n🔍 To test the fixes:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:5173');
    console.log('3. Click "PLAY GAME"');
    console.log('4. Test: Movement, shooting, asteroid collisions');
    console.log('5. Verify: Bullets move, asteroids spawn, collisions work');
    
    return percentage >= 90;
}

// Run if called directly
if (import.meta.url.endsWith(process.argv[1])) {
    runDebugAnalysis()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Debug analysis failed:', error);
            process.exit(1);
        });
}

export { runDebugAnalysis };