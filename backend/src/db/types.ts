export type DeploymentStatus =
    | 'pending'
    | 'building'
    | 'deploying'
    | 'running'
    | 'failed';

export type Deployment = {
    id: string;
    type: 'upload' | 'git';
    filename: string;
    gitUrl: string;
    branch: string;
    port: number;
    status: DeploymentStatus;
    imageTag: string | null;
    liveUrl: string | null;
    containerName: string | null;
    routePath: string | null;
    createdAt: string;
    updatedAt: string;
};

export type DeploymentRow = {
    id: string;
    type: 'git' | 'upload';
    filename: string | null;
    git_url: string | null;
    branch: string;
    port: number;
    status: DeploymentStatus;
    image_tag: string | null;
    live_url: string | null;
    container_name: string | null;
    route_path: string | null;
    created_at: string;
    updated_at: string;
};

export function rowtoDeployment(row: DeploymentRow): Deployment {
    return {
        id: row.id,
        gitUrl: row.git_url ?? '',
        filename: row.filename ?? '',
        branch: row.branch,
        type: row.type,
        port: row.port,
        status: row.status,
        imageTag: row.image_tag,
        liveUrl: row.live_url,
        containerName: row.container_name,
        routePath: row.route_path,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

export type Log = {
    id: string;
    deploymentID: string;
    message: string;
    createdAt: string;
};

export type LogRow = {
    id: string;
    deployment_id: string;
    message: string;
    created_at: string;
};

export function rowToLog(row: LogRow): Log {
    return {
        id: row.id,
        deploymentID: row.deployment_id,
        message: row.message,
        createdAt: row.created_at
    };
}
