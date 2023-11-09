import { Command, EnumType, ValidationError } from '/deps.ts'
import { mergeWithCliOptions, validateConfig } from '/lib/config.ts'
import { cmd, GlobalOptions } from '/index.ts'
import { CliOptions } from '/lib/types.ts'
import { randomBuildkiteEmoji } from '/lib/utils.ts'

export type ExecOptions = typeof exec extends Command<any, any, infer Options, any, any> ? Options
	: never

// Object containing the allowed substitutions
const substitutions = {
	'build.id': '12345',
	'build.output': 'artifact.zip',
}

// Sanitize the input values to prevent command injection
// We'll just ensure the value is a string and escape special characters
function sanitizeInput(value: string) {
	return String(value).replace(/[^a-zA-Z0-9_.-]/g, '')
}

// This helper function will take a command string with placeholders and a substitutions object
// It will replace all placeholders in the command with their corresponding values
function interpolateCommand(commandWithPlaceholders: string, substitutions: Record<string, string>) {
	// This regular expression matches all occurrences of ${placeholder}
	const placeholderRegex = /\$\{([^}]+)\}/g
	return commandWithPlaceholders.replace(placeholderRegex, (_, key) => {
		// If the key is not found in substitutions, keep the original placeholder
		return key in substitutions ? sanitizeInput(substitutions[key]) : _
	})
}

enum Mode {
	Local = 'local',
	Buildkite = 'buildkite',
}

async function localExecutor(commands: string[]) {
	for await (const command of commands) {
		const isRunrealCommand = command.startsWith('runreal')
		if (isRunrealCommand) {
			console.log('[workflow] exec =>', command)
			await cmd.parse(command.split(' ').slice(1))
		} else {
			// TODO(xenon): Run utils.exec here
			console.log('skipping execution...')
		}
	}
}

async function buildkiteExecutor(commands: string[]) {
	for await (const command of commands) {
		const isRunrealCommand = command.startsWith('runreal')
		if (isRunrealCommand) {
			console.log(`--- ${randomBuildkiteEmoji()} ${command}`)
			await cmd.parse(command.split(' ').slice(1))
		} else {
			// TODO(xenon): Run utils.exec here
			console.log('skipping execution...')
		}
	}
}

export const exec = new Command<GlobalOptions>()
	.option('-d, --dry-run', 'Dry run')
	.type('mode', new EnumType(Mode))
	.option('-m, --mode <mode:mode>', 'Execution mode', { default: Mode.Local })
	.description('run')
	.arguments('<workflow>')
	.action(async (options, workflow) => {
		const { dryRun, mode } = options as ExecOptions
		const cfg = validateConfig(mergeWithCliOptions(options as CliOptions)) as any

		const run = cfg.workflows.find((w: any) => w.name === workflow)
		if (!run) {
			throw new ValidationError(`Workflow ${workflow} not found`)
		}

		const commands = []
		for await (const step of run.steps) {
			const command = interpolateCommand(step, substitutions)
			commands.push(command)
		}

		if (dryRun) {
			commands.forEach((command) => {
				console.log('>', command)
			})
			return
		}

		// Stop cliffy for exiting the process after running single command
		cmd.noExit()
		if (mode === Mode.Local) {
			await localExecutor(commands)
		} else if (mode === Mode.Buildkite) {
			await buildkiteExecutor(commands)
		}
	})
