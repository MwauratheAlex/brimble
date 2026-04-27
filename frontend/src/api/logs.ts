import type { DeploymentLog } from '../types/deployment';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:6492';

export async function fetchDeploymentLogs(
    deploymentId: string
): Promise<DeploymentLog[]> {
    const response = await fetch(
        `${BACKEND_URL}/api/deployments/${deploymentId}/logs`
    );

    if (!response.ok) {
        throw new Error(`Could not fetch logs: ${response.status}`);
    }

    const data: { logs: DeploymentLog[] } = await response.json();

    return data.logs;
}

export function deploymentLogStreamUrl(deploymentId: string) {
    return `${BACKEND_URL}/api/deployments/${deploymentId}/logs/stream`;
}
