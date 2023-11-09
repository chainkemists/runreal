import { GlobalOptions } from '/index.ts'
import { DebugOptions } from '../commands/debug.ts'

import { CacheOptions } from '/commands/engine/cache.ts'
import { RestoreOptions } from '/commands/engine/restore.ts'
import { SetupOptions } from '/commands/engine/setup.ts'
import { InstallOptions } from '/commands/engine/install.ts'
import { UpdateOptions } from '/commands/engine/update.ts'

export type CliOptions = Partial<
	& GlobalOptions
	& DebugOptions
	& CacheOptions
	& RestoreOptions
	& SetupOptions
	& InstallOptions
	& UpdateOptions
>

export interface EngineConfig {
	path: string
	branch?: string
	cachePath?: string
}

export interface ProjectConfig {
	name: string
	path: string
}

export interface GitConfig {
	dependenciesCachePath: string
	mirrors: boolean
	mirrorsPath: string
}

export interface BuildConfig {
	path: string
}

export interface RunrealConfig {
	engine: EngineConfig
	project: ProjectConfig
	git: GitConfig
	build: BuildConfig
}

export interface UeDepsManifestData {
	Name: string
	Hash: string
	ExpectedHash: string
	Timestamp: string
}

export interface UeDepsManifest {
	WorkingManifest: {
		Files: {
			File: {
				'_attributes': UeDepsManifestData
			}[]
		}
	}
}

export interface GitIgnoreFiles {
	files: string[]
	dirs: string[]
}
