import { VERSION } from './version.ts'
import { Command, EnumType, ulid } from '/deps.ts'

import { debug } from './commands/debug.ts'
import { build } from './commands/build.ts'
import { engine } from './commands/engine/index.ts'
import { init } from './commands/init.ts'
import { uat } from './commands/uat.ts'
import { ubt } from './commands/ubt.ts'
import { pkg } from './commands/pkg.ts'
import { buildgraph } from './commands/buildgraph/index.ts'
import { workflow } from './commands/workflow/index.ts'
import { mergeConfig, searchForConfigFile } from './lib/config.ts'
import { logger, LogLevel } from './lib/logger.ts'

export type GlobalOptions = typeof cmd extends
	Command<void, void, void, [], infer Options extends Record<string, unknown>> ? Options
	: never

// Check Deno.cwd() for runreal.config.json
if (searchForConfigFile()) {
	mergeConfig(searchForConfigFile()!)
}

export const cmd = new Command()
	.globalOption('--session-id <sessionId:string>', 'Session Id', {
		default: ulid() as string,
		// action: ({ sessionId }) => logger.setSessionId(sessionId),
	})
	.globalType('log-level', new EnumType(LogLevel))
	.globalOption('--log-level <level:log-level>', 'Log level', {
		default: LogLevel.DEBUG,
		action: ({ logLevel }) => logger.setLogLevel(logLevel),
	})
	.globalOption('-c, --config-path <configPath:string>', 'Path to config file', {
		action: ({ configPath }) => {
			if (configPath) { const cfg = mergeConfig(configPath) }
		},
	})
	.globalOption('--engine-path <enginePath:string>', 'Path to engine folder')
	.globalOption('--project-path <projectPath:string>', 'Path to project folder')

await cmd
	.name('runreal')
	.version(VERSION)
	.description('the Unreal Engine runner')
	.command('init', init)
	.command('debug', debug)
	.command('build', build)
	.command('engine', engine)
	.command('uat', uat)
	.command('ubt', ubt)
	.command('pkg', pkg)
	.command('buildgraph', buildgraph)
	.command('workflow', workflow)
	.parse(Deno.args)
