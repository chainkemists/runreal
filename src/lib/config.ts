import { deepmerge, path } from '/deps.ts'
import { CliOptions, RunrealConfig } from '/lib/types.ts'

export let config: Partial<RunrealConfig> = {
	engine: {
		path: '',
	},
	project: {
		path: '',
	},
	build: {
		foo: 'bar',
		blah: 'hah',
		arr: [1, 2, 3],
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
	'projectPath': 'project.path',
	'branch': 'engine.branch',
	'cachePath': 'engine.binaryCachePath',
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

/*
export function mergeWithCliOptions(cliOptions: CliOptions): Partial<RunrealConfig> {
	const picked: Partial<RunrealConfig> = {}

	if (cliOptions['enginePath']) {
		picked.engine = { path: cliOptions['enginePath'] }
	}

	if (cliOptions['projectPath']) {
		picked.project = { path: cliOptions['projectPath'] }
	}

	config = deepmerge(config, picked)
	return config
}
*/

// TODO(xenon): Use cliffy validation instead?
export function validateConfig(config: Partial<RunrealConfig>): RunrealConfig {
	if (!config.engine || !config.engine.path) {
		throw new Error('Invalid config: Missing engine path')
	}

	if (!config.project || !config.project.path) {
		throw new Error('Invalid config: Missing project path')
	}

	// Add more validation rules as needed...

	return config as RunrealConfig
}
