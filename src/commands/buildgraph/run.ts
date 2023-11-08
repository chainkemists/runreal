import { Command } from '/deps.ts'
import { mergeWithCliOptions, validateConfig } from '/lib/config.ts'
import { GlobalOptions } from '/index.ts'
import { CliOptions } from '/lib/types.ts'
import { createEngine } from '/lib/engine.ts'

export type RunOptions = typeof run extends Command<any, any, infer Options, any, any> ? Options
	: never

export const run = new Command<GlobalOptions>()
	.description('run buildgraph script')
	.arguments('<buildGraphScript:file> <buildGraphArgs...>')
	.stopEarly()
	.action(async (options, buildGraphScript: string, ...buildGraphArgs: Array<string>) => {
		const { engine: { path: enginePath } } = validateConfig(mergeWithCliOptions(options as CliOptions))
		const engine = await createEngine(enginePath)
		await engine.runBuildGraph(buildGraphScript, buildGraphArgs)
	})
