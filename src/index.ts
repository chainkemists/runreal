import { VERSION } from './version.ts'
import { Command } from '/deps.ts'

import { debug } from './commands/debug.ts'
import { build } from './commands/build.ts'
import { engine } from './commands/engine/index.ts'
import { init } from './commands/init.ts'
import { uat } from './commands/uat.ts'
import { ubt } from './commands/ubt.ts'
import { pkg } from './commands/pkg.ts'
import { mergeConfig } from './lib/config.ts'

export type GlobalOptions = typeof cmd extends
	Command<void, void, void, [], infer Options extends Record<string, unknown>> ? Options
	: never

const cmd = new Command()
	.option('-v, --verbose', 'Verbose')
	.globalOption('-c, --config-path <configPath:string>', 'Path to config file', {
		action: ({ configPath }) => {
			if (!configPath) return
			const cfg = mergeConfig(configPath)
			// console.log(cfg)
		},
	})
	.globalOption('--engine-path <enginePath:string>', 'Path to engine folder', {
		// default: 'E:\\RX\\UnrealEngine',
	})
	.globalOption('--project-path <projectPath:string>', 'Path to project folder', {
		// default: 'E:\\RX\\Obsidian',
	})

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
	.parse(Deno.args)
