export type DeploymentStatus =
    | 'pending'
    | 'building'
    | 'deploying'
    | 'running'
    | 'failed';

export type Deployment = {
    id: string;
    gitUrl: string | null;
    filename: string | null;
    branch: string;
    type: 'git' | 'upload';
    port: number;
    status: DeploymentStatus;
    imageTag: string | null;
    liveUrl: string | null;
    containerName: string | null;
    routePath: string | null;
    createdAt: string;
    updatedAt: string;
};

export type UploadDeployRequest = {
    file: File;
    port: string;
};

export type GitDeployRequest = {
    gitUrl: string;
    branch?: string;
    port: string;
};

export type DeploymentLog = {
    id: string;
    deploymentId: string;
    message: string;
    createdAt: string;
};
