import { deepmerge, path, ValidationError } from '/deps.ts'
import { CliOptions, RunrealConfig } from '/lib/types.ts'

export let config: Partial<RunrealConfig> = {
	engine: {
		path: '',
	},
	project: {
		name: '',
		path: '',
	},
	build: {
		path: '',
	},
}

export function searchForConfigFile(): string | null {
	const cwd = Deno.cwd()
	const configPath = path.join(cwd, 'runreal.config.json')
	try {
		if (Deno.statSync(configPath).isFile) {
			return configPath
		}
	} catch (e) {
		// Ignore
	}
	return null
}

export function readConfigFile(configPath: string): Partial<RunrealConfig> | null {
	try {
		const data = Deno.readTextFileSync(path.resolve(configPath))
		return JSON.parse(data) as RunrealConfig
	} catch (e) {
		return null
	}
}

export function mergeConfig(configPath: string): Partial<RunrealConfig> {
	const cfg = readConfigFile(configPath)
	if (!cfg) return config
	config = deepmerge(config, cfg)
	return config
}

const cliOptionToConfigMap = {
	'enginePath': 'engine.path',
	'branch': 'engine.branch',
	'cachePath': 'engine.cachePath',
	'projectPath': 'project.path',
	'buildPath': 'build.path',
	'gitDependenciesCachePath': 'git.dependenciesCachePath',
	'gitMirrors': 'git.mirrors',
	'gitMirrorsPath': 'git.mirrorsPath',
}

export function mergeWithCliOptions(cliOptions: CliOptions): Partial<RunrealConfig> {
	const picked: Partial<RunrealConfig> = {}

	for (const [cliOption, configPath] of Object.entries(cliOptionToConfigMap)) {
		if (cliOptions[cliOption as keyof CliOptions]) {
			const [section, property] = configPath.split('.')
			if (!picked[section as keyof RunrealConfig]) {
				picked[section as keyof RunrealConfig] = {} as any
			}
			;(picked[section as keyof RunrealConfig] as any)[property] = cliOptions[cliOption as keyof CliOptions]
		}
	}

	config = deepmerge(config, picked)
	return config
}

export function resolvePaths(config: Partial<RunrealConfig>) {
	if (config.engine && config.engine.path) {
		config.engine.path = path.resolve(config.engine.path)
	}

	if (config.engine && config.engine.cachePath) {
		config.engine.cachePath = path.resolve(config.engine.cachePath)
	}

	if (config.project && config.project.path) {
		config.project.path = path.resolve(config.project.path)
	}

	if (config.build && config.build.path) {
		config.build.path = path.resolve(config.build.path)
	}

	if (config.git && config.git.dependenciesCachePath) {
		config.git.dependenciesCachePath = path.resolve(config.git.dependenciesCachePath)
	}

	if (config.git && config.git.mirrorsPath) {
		config.git.mirrorsPath = path.resolve(config.git.mirrorsPath)
	}

	return config
}

export function validateConfig(config: Partial<RunrealConfig>): RunrealConfig {
	config = resolvePaths(config)

	if (!config.engine || !config.engine.path) {
		throw new ValidationError('Invalid config: Missing engine path')
	}

	if (!config.project || !config.project.path) {
		throw new ValidationError('Invalid config: Missing project path')
	}

	return config as RunrealConfig
}
