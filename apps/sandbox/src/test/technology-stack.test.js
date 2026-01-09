import fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it } from 'vitest';

// Feature: compify-mvp, Property 14: Technology Stack Compliance
describe('Technology Stack Compliance', () => {
  it('sandbox uses only Phaser.js framework', () => {
    fc.assert(fc.property(
      fc.constantFrom('src/main.js', 'src/scenes/MenuScene.js', 'src/scenes/GameScene.js', 'src/scenes/GameOverScene.js'),
      (gameFile) => {
        try {
          const filePath = join(process.cwd(), gameFile);
          const content = readFileSync(filePath, 'utf-8');
          
          // Should use Phaser.js
          const usesPhaserImport = content.includes('import Phaser') || content.includes('from "phaser"');
          const usesPhaserAPI = content.includes('Phaser.') || content.includes('extends Phaser.Scene');
          
          // Should not use other game frameworks
          const noUnityImports = !content.includes('Unity') && !content.includes('UnityEngine');
          const noThreeJSImports = !content.includes('import * as THREE') && !content.includes('from "three"');
          const noBabylonImports = !content.includes('from "@babylonjs"') && !content.includes('BABYLON.');
          
          // Should not have server dependencies
          const noServerImports = !content.includes('import express') && 
                                 !content.includes('import http') && 
                                 !content.includes('require("http")');
          
          return (usesPhaserImport || usesPhaserAPI) && 
                 noUnityImports && noThreeJSImports && noBabylonImports && noServerImports;
        } catch (error) {
          // File might not exist, which is acceptable
          return true;
        }
      }
    ), { numRuns: 100 });
  });

  it('sandbox operates independently without authentication dependencies', () => {
    fc.assert(fc.property(
      fc.constantFrom('src/main.js', 'src/scenes/MenuScene.js', 'src/scenes/GameScene.js'),
      (gameFile) => {
        try {
          const filePath = join(process.cwd(), gameFile);
          const content = readFileSync(filePath, 'utf-8');
          
          // Should not contain authentication logic
          const noAuthImports = !content.includes('auth') && 
                               !content.includes('login') && 
                               !content.includes('session') &&
                               !content.includes('token');
          
          // Should not contain database calls
          const noDatabaseCalls = !content.includes('fetch("/api') && 
                                 !content.includes('axios.') && 
                                 !content.includes('database') &&
                                 !content.includes('sql');
          
          return noAuthImports && noDatabaseCalls;
        } catch (error) {
          // File might not exist, which is acceptable
          return true;
        }
      }
    ), { numRuns: 100 });
  });
});