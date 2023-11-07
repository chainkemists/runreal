import { Command, ValidationError } from '/deps.ts'
import { cloneRepo, runEngineSetup } from '/lib/utils.ts'
import { CliOptions } from '/lib/types.ts'
import { mergeWithCliOptions, validateConfig } from '/lib/config.ts'

export type InstallOptions = typeof install extends Command<any, any, infer Options, any, any> ? Options
	: never

export const install = new Command()
	.description('install engine from a source repository')
	.option('-b, --branch <branch:string>', 'git checkout (branch | tag)')
	.option('-f, --force', 'force overwrite of destination', { default: false })
	.option('-d, --dry-run', 'dry run', { default: false })
	.group('Post Clone Configuration')
	.option('-s, --setup', 'installs git dependencies (ie Setup.bat)')
	.option(
		'-g, --git-dependencies-cache-path <gitDependenciesCachePath:file>',
		'git dependencies cache folder',
		{ depends: ['setup'] },
	)
	.option('--build', 'build the engine after cloning', {
		depends: ['setup'],
	})
	.group('Git Mirror Configuration')
	.option('-m, --git-mirrors', 'use git mirrors', { default: false })
	.option('-p, --git-mirrors-path <gitMirrorsPath:file>', 'git mirrors path')
	.arguments('[source:string] [destination:file]')
	.action(async (
		options,
		source = 'https://github.com/Chainkemists/UnrealEngine-Internal',
		destination = 'E:\\RX\\UnrealEngine',
		...args
	) => {
		const {
			branch,
			force,
			dryRun,
			setup,
			// gitDependenciesCachePath,
			// gitMirrors,
			// gitMirrorsPath,
		} = options as InstallOptions
		const cfg = validateConfig(mergeWithCliOptions(options as CliOptions))
		try {
			await Deno.mkdir(destination)
		} catch (e) {
			if (e instanceof Deno.errors.AlreadyExists) {
				if (force && !dryRun) {
					console.log(`Deleting ${destination}`)
					await Deno.remove(destination, { recursive: true })
				} else {
					throw new ValidationError(
						`Destination ${destination} already exists, use --force to overwrite.`,
					)
				}
			}
		}
		const clonedPath = await cloneRepo({
			source,
			destination,
			branch,
			useMirror: cfg.git.mirrors,
			mirrorPath: cfg.git.mirrorsPath,
			dryRun,
		})
		if (setup) {
			await runEngineSetup(clonedPath, cfg.git.dependenciesCachePath)
		}
	})
