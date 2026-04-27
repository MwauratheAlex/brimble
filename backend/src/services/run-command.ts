import { spawn } from 'node:child_process';

type RunCommandOptions = {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    allowFailure?: boolean;
    onLine?: (line: string) => void;
};

export function runCommand(
    command: string,
    args: string[],
    options: RunCommandOptions = {}
): Promise<void> {
    return new Promise((resolve, reject) => {
        const recentLines: string[] = [];

        const child = spawn(command, args, {
            cwd: options.cwd,
            env: {
                ...process.env,
                ...options.env
            },
            shell: false
        });

        function remember(line: string) {
            recentLines.push(line);
            if (recentLines.length > 40) recentLines.shift();

            options.onLine?.(line);
        }

        function pipeOutput(chunk: Buffer, prefix: 'stdout' | 'stderr') {
            const lines = chunk
                .toString()
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean);

            for (const line of lines) {
                remember(`[${prefix}] ${line}`);
            }
        }

        child.stdout.on('data', (chunk) => {
            pipeOutput(chunk, 'stdout');
        });

        child.stderr.on('data', (chunk) => {
            pipeOutput(chunk, 'stderr');
        });

        child.on('error', reject);

        child.on('close', (code) => {
            if (code === 0 || options.allowFailure) {
                resolve();
                return;
            }

            reject(
                new Error(
                    `${command} ${args.join(
                        ' '
                    )} exited with code ${code}\n\nLast output:\n${recentLines.join(
                        '\n'
                    )}`
                )
            );
        });
    });
}
