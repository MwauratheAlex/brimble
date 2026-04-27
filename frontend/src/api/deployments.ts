import type {
    GitDeployRequest,
    UploadDeployRequest,
    Deployment
} from '../types/deployment';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:6492';

export async function fetchDeployments(): Promise<Deployment[]> {
    const response = await fetch(`${BACKEND_URL}/api/deployments`);

    if (!response.ok) {
        throw new Error(`Could not fetch deployments: ${response.status}`);
    }

    const data: { deployments: Deployment[] } = await response.json();

    return data.deployments;
}

export async function deployGit(data: GitDeployRequest): Promise<Deployment> {
    const response = await fetch(`${BACKEND_URL}/api/deployments/git`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error('Deploy failed');
    }

    const result: { deployment: Deployment } = await response.json();

    return result.deployment;
}

export async function deployUpload(
    data: UploadDeployRequest
): Promise<Deployment> {
    const formData = new FormData();

    formData.append('file', data.file);
    formData.append('port', data.port);

    const response = await fetch(`${BACKEND_URL}/api/deployments/upload`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Deploy failed');
    }

    const result: { deployment: Deployment } = await response.json();

    return result.deployment;
}
