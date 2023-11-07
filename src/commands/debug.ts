import { Command } from '/deps.ts'
import { mergeWithCliOptions, validateConfig } from '/lib/config.ts'
import { GlobalOptions } from '/index.ts'
import { CliOptions } from '/lib/types.ts'

export type DebugOptions = typeof debug extends Command<any, any, infer Options, any, any> ? Options
	: never

export const debug = new Command<GlobalOptions>()
	.option('-d, --dry-run', 'Dry run')
	.option('-q, --quiet', 'Quiet')
	.description('run')
	.action(async (options) => {
		const { dryRun, quiet } = options as DebugOptions
		const cfg = validateConfig(mergeWithCliOptions(options as CliOptions))

		console.log(cfg)
		console.log('dryrun:', dryRun)
		console.log('quiet:', quiet)

		await Promise.resolve()
	})
