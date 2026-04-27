import {
    dbCreateDeployment,
    dbCreateLog,
    dbGetDeployments,
    dbListAllDeployments,
    dbListLogs,
    dbListRoutableDeployments,
    dbUpdateDeployment
} from '../db/db';
import { Deployment, DeploymentStatus, Log } from '../db/types';

export class DeploymentRepository {
    createUpload() {}

    createGit(data: {
        gitUrl: string;
        branch: string;
        port: number;
    }): Deployment {
        const now = new Date().toISOString();

        const deployment: Deployment = {
            id: crypto.randomUUID(),
            type: 'git',
            filename: '',
            gitUrl: data.gitUrl,
            branch: data.branch,
            port: data.port,
            status: 'pending',
            imageTag: null,
            liveUrl: null,
            routePath: null,
            containerName: null,
            createdAt: now,
            updatedAt: now
        };

        dbCreateDeployment(deployment);

        return deployment;
    }

    updateImage(id: string, imageTag: string) {
        dbUpdateDeployment(id, { imageTag });
    }

    updateStatus(id: string, status: DeploymentStatus) {
        dbUpdateDeployment(id, { status });
    }

    updateRuntime(
        id: string,
        runTime: {
            imageTag: string;
            containerName: string;
            liveUrl: string;
            routePath: string;
            status: DeploymentStatus;
        }
    ) {
        dbUpdateDeployment(id, {
            imageTag: runTime.imageTag,
            containerName: runTime.containerName,
            liveUrl: runTime.liveUrl,
            routePath: runTime.routePath,
            status: runTime.status
        });
    }

    addLog(deploymentID: string, message: string): Log {
        const log = {
            id: crypto.randomUUID(),
            message,
            deploymentID,
            createdAt: new Date().toISOString()
        };
        dbCreateLog(log);
        return log;
    }

    listRoutableDeployments(): Deployment[] {
        return dbListRoutableDeployments();
    }

    listAllDeployments(): Deployment[] {
        return dbListAllDeployments();
    }

    listLogs(deploymentId: string): Log[] {
        return dbListLogs(deploymentId);
    }

    getAll() {}
    getById(id: string): Deployment | undefined {
        return dbGetDeployments(id);
    }
}
