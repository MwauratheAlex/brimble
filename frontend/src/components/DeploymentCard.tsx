import type { Deployment, DeploymentStatus } from '../types/deployment';

export const statusStyles: Record<DeploymentStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 border border-amber-100',
    building: 'bg-blue-50 text-blue-700 border border-blue-100',
    deploying: 'bg-violet-50 text-violet-700 border border-violet-100',
    running: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    failed: 'bg-rose-50 text-rose-700 border border-rose-100'
};

export function titleCase(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDeploymentSource(deployment: Deployment) {
    if (deployment.type === 'git') return deployment.gitUrl ?? 'Git repository';
    return deployment.filename ?? 'Uploaded project';
}

function getImageShortTag(imageTag: string | null) {
    if (!imageTag) return 'no image yet';
    return imageTag.split(':').pop() ?? imageTag;
}

export function DeploymentCard({
    deployment,
    selected,
    onClick
}: {
    deployment: Deployment;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-3xl border p-4 text-left transition hover:bg-zinc-50 ${
                selected
                    ? 'border-zinc-950 bg-zinc-50'
                    : 'border-zinc-200 bg-white'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-950">
                        {deployment.id.slice(0, 8)}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                        {formatDeploymentSource(deployment)}
                    </p>
                </div>

                <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        statusStyles[deployment.status]
                    }`}
                >
                    {titleCase(deployment.status)}
                </span>
            </div>

            <div className="mt-4 grid gap-2 text-xs text-zinc-500 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <span className="truncate rounded-full bg-zinc-100 px-3 py-1.5 font-mono">
                    {getImageShortTag(deployment.imageTag)}
                </span>

                <span className="truncate rounded-full bg-zinc-100 px-3 py-1.5">
                    {new Date(deployment.updatedAt).toLocaleTimeString()}
                </span>
            </div>
        </button>
    );
}
