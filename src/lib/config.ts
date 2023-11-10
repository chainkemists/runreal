import { deepmerge, path, ValidationError } from '/deps.ts'
import { CliOptions, RunrealConfig } from '/lib/types.ts'
import { execSync } from '/lib/utils.ts'

// TODO(xenon): setup async init of config on startup to populate initial values
// then merge with the provided config file and cli options
const commit = execSync('git', ['rev-parse', 'HEAD'], {quiet: true}).output.trim()
const commitShort = execSync('git', ['rev-parse', '--short', 'HEAD'], {quiet: true}).output.trim()
const branch = execSync('git', ['branch', '--show-current'], {quiet: true}).output.trim()
const branchSafe = branch.replace(/[^a-z0-9]/gi, '-')
const id = `${branchSafe}-${commitShort}`

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
		id,
		branch,
		branchSafe,
		commit,
		commitShort,
	},
	buildkite: {
		branch: Deno.env.get('BUILDKITE_BRANCH') || branch,
		buildNumber: Deno.env.get('BUILDKITE_BUILD_NUMBER') || '0',
		buildCheckoutPath: Deno.env.get('BUILDKITE_BUILD_CHECKOUT_PATH') || Deno.cwd(),
		buildPipelineSlug: Deno.env.get('BUILDKITE_PIPELINE_SLUG') || '',
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
