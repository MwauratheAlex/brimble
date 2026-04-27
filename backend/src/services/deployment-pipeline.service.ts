import fs from 'node:fs';
import path from 'node:path';
import { DeploymentRepository } from '../repositories/deployment.repository';
import { runCommand } from './run-command';
import { deploymentEvents } from './deployment-events.service';

type RunOptions = {
    allowFailure?: boolean;
    env?: NodeJS.ProcessEnv;
};

export class DeploymentPipelineService {
    private repository: DeploymentRepository;

    constructor() {
        this.repository = new DeploymentRepository();
    }

    async deployGit(deploymentId: string) {
        const deployment = this.repository.getById(deploymentId);

        if (!deployment) {
            throw new Error(`Deployment ${deploymentId} not found`);
        }

        if (!deployment.gitUrl) {
            throw new Error(`Deployment ${deploymentId} is missing gitUrl`);
        }

        const slug = this.slugify(deployment.id);

        const workspaceDir = path.resolve(
            process.cwd(),
            'workspaces',
            deployment.id
        );

        const sourceDir = path.join(workspaceDir, 'source');

        const imageTag = `brimble/${slug}:${deployment.id.slice(0, 8)}`;
        const containerName = `brimble-${slug}`;
        const routePath = `/d/${slug}`;
        const liveUrl = `${
            process.env.PUBLIC_BASE_URL ?? 'http://localhost:8080'
        }${routePath}`;

        fs.rmSync(workspaceDir, { recursive: true, force: true });
        fs.mkdirSync(workspaceDir, { recursive: true });

        try {
            this.log(deployment.id, 'Starting deployment');

            this.updateStatus(deployment.id, 'building');

            await this.run(deployment.id, 'git', [
                'clone',
                '--depth',
                '1',
                '--branch',
                deployment.branch,
                deployment.gitUrl,
                sourceDir
            ]);

            this.log(deployment.id, `Building image ${imageTag} with Railpack`);

            await this.run(
                deployment.id,
                'railpack',
                ['build', '--name', imageTag, '--progress', 'plain', sourceDir],
                {
                    env: {
                        BUILDKIT_HOST:
                            process.env.BUILDKIT_HOST ??
                            'docker-container://buildkit'
                    }
                }
            );

            this.repository.updateImage(deployment.id, imageTag);

            this.updateStatus(deployment.id, 'deploying');

            const networkName = process.env.DEPLOY_NETWORK ?? 'brimble';

            await this.run(
                deployment.id,
                'docker',
                ['network', 'create', networkName],
                {
                    allowFailure: true
                }
            );

            await this.run(
                deployment.id,
                'docker',
                ['rm', '-f', containerName],
                {
                    allowFailure: true
                }
            );

            await this.run(deployment.id, 'docker', [
                'run',
                '-d',
                '--name',
                containerName,
                '--network',
                networkName,
                '-e',
                `PORT=${deployment.port}`,
                '-e',
                'HOST=0.0.0.0',
                '-e',
                'HOSTNAME=0.0.0.0',

                imageTag
            ]);

            this.repository.updateRuntime(deployment.id, {
                imageTag,
                containerName,
                liveUrl,
                routePath,
                status: 'running'
            });
            deploymentEvents.emitStatus(deployment.id, 'running');

            await this.reloadCaddy(deployment.id);

            this.log(deployment.id, `Deployment running at ${liveUrl}`);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);

            this.updateStatus(deployment.id, 'failed');
            this.log(deployment.id, `Deployment failed: ${message}`);

            throw error;
        }
    }

    private async run(
        deploymentId: string,
        command: string,
        args: string[],
        options: RunOptions = {}
    ) {
        this.log(deploymentId, `$ ${command} ${args.join(' ')}`);

        await runCommand(command, args, {
            allowFailure: options.allowFailure,
            env: options.env,
            onLine: (line) => {
                this.log(deploymentId, line);
            }
        });
    }

    private updateStatus(
        deploymentId: string,
        status: 'pending' | 'building' | 'deploying' | 'running' | 'failed'
    ) {
        this.repository.updateStatus(deploymentId, status);
        deploymentEvents.emitStatus(deploymentId, status);
    }

    private log(deploymentId: string, message: string) {
        const log = this.repository.addLog(deploymentId, message);
        deploymentEvents.emitLog(deploymentId, log);
    }

    private async reloadCaddy(deploymentId: string) {
        const deployments = this.repository.listRoutableDeployments();

        const routes = deployments
            .map((deployment) => {
                return `
  handle_path ${deployment.routePath}/* {
    reverse_proxy ${deployment.containerName}:${deployment.port}
  }`;
            })
            .join('\n');

        const caddyfile = `:80 {
${routes || '  respond "No deployments yet"'}
}
`;

        const caddyfilePath =
            process.env.CADDYFILE_PATH ??
            path.resolve(process.cwd(), '../caddy/Caddyfile');

        fs.mkdirSync(path.dirname(caddyfilePath), { recursive: true });
        fs.writeFileSync(caddyfilePath, caddyfile);

        const caddyContainer =
            process.env.CADDY_CONTAINER_NAME ?? 'brimble-caddy';

        await this.run(deploymentId, 'docker', [
            'exec',
            caddyContainer,
            'caddy',
            'validate',
            '--config',
            '/etc/caddy/Caddyfile'
        ]);

        await this.run(deploymentId, 'docker', [
            'exec',
            caddyContainer,
            'caddy',
            'reload',
            '--config',
            '/etc/caddy/Caddyfile'
        ]);
    }

    private slugify(value: string) {
        return value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
