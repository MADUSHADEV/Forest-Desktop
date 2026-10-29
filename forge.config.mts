import type { ForgeConfig } from '@electron-forge/shared-types';
import path from 'node:path';
import fs from 'node:fs';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'Forest Desktop',
    executableName: 'ForestDesktop',
    icon: './assets/icon',
    asar: {
      unpack: '**/*.{node,dll}',
    },
  },
  rebuildConfig: {
    onlyModules: [],
  },
  makers: [
    new MakerSquirrel({
      name: 'ForestDesktop',
      authors: 'Forest Desktop Architect',
      description: 'Stay Focused, Be Present - Desktop Focus Timer & Forest Builder',
      exe: 'ForestDesktop.exe',
      setupExe: 'Forest Desktop Setup.exe',
      setupIcon: './assets/icon.ico',
      noMsi: true,
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  hooks: {
    packageAfterCopy: async (_forgeConfig, buildPath) => {
      const targetModules = path.join(buildPath, 'node_modules');
      if (!fs.existsSync(targetModules)) {
        fs.mkdirSync(targetModules, { recursive: true });
      }

      // Copy native modules and essential runtime dependencies into package
      const modulesToCopy = [
        'better-sqlite3',
        'electron-squirrel-startup',
        'node-addon-api',
        'bindings',
        'file-uri-to-path',
      ];

      for (const mod of modulesToCopy) {
        const src = path.join(process.cwd(), 'node_modules', mod);
        const dest = path.join(targetModules, mod);
        if (fs.existsSync(src)) {
          fs.cpSync(src, dest, { recursive: true, dereference: true });
        }
      }

      // Copy assets folder into package root
      const srcAssets = path.join(process.cwd(), 'assets');
      const destAssets = path.join(buildPath, 'assets');
      if (fs.existsSync(srcAssets)) {
        fs.cpSync(srcAssets, destAssets, { recursive: true, dereference: true });
      }
    },
  },
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.mts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.mts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
