import { Request, Response } from 'express';
import { DeploymentRepository } from '../repositories/deployment.repository';
import { DeploymentPipelineService } from '../services/deployment-pipeline.service';
import { deploymentEvents } from '../services/deployment-events.service';

export class DeploymentController {
    private repository: DeploymentRepository;
    private pipeline: DeploymentPipelineService;

    constructor() {
        this.repository = new DeploymentRepository();
        this.pipeline = new DeploymentPipelineService();
    }

    async createGit(req: Request, res: Response) {
        const { gitUrl, branch, port = 3000 } = req.body;

        if (!gitUrl) {
            return res.status(400).json({
                error: 'gitUrl is required'
            });
        }

        if (!branch) {
            return res.status(400).json({
                error: 'branch is required'
            });
        }

        const deployment = this.repository.createGit({
            gitUrl,
            branch,
            port: Number(port)
        });

        void this.pipeline.deployGit(deployment.id).catch((error) => {
            console.log('Deployment pipeline failed', error);
        });

        return res.status(201).json({ deployment });
    }

    async getAll(_: Request, res: Response) {
        const deployments = this.repository.listAllDeployments();
        return res.status(200).json({
            deployments
        });
    }

    streamLogs(req: Request, res: Response) {
        const deploymentId = req.params.id as string;

        const deployment = this.repository.getById(deploymentId);

        if (!deployment) {
            return res.status(404).json({
                error: 'Deployment not found'
            });
        }

        const streamingStatuses = ['pending', 'building', 'deploying'];

        if (!streamingStatuses.includes(deployment.status)) {
            return res.status(409).json({
                error: 'Deployment is no longer streaming'
            });
        }

        deploymentEvents.connect(deploymentId, res);

        const logs = this.repository.listLogs(deploymentId);

        for (const log of logs) {
            res.write(`event: log\n`);
            res.write(`data: ${JSON.stringify(log)}\n\n`);
        }

        return;
    }

    getAllLogs(req: Request, res: Response) {
        const deploymentId = req.params.id as string;

        const deployment = this.repository.getById(deploymentId);

        if (!deployment) {
            return res.status(404).json({
                error: 'Deployment not found'
            });
        }

        const logs = this.repository.listLogs(deploymentId);

        return res.status(200).json({
            logs
        });
    }

    async createUpload(req: Request, res: Response) {}
}
