import type { Deployment } from '../types/deployment';
import { statusStyles, titleCase } from './DeploymentCard';

export function DeploymentDetailsCard({
    deployment
}: {
    deployment: Deployment | null;
}) {
    const route = deployment?.routePath
        ? `${deployment.routePath}/* {
  reverse_proxy ${deployment.containerName}:${deployment.port}
}`
        : 'No route yet';

    if (!deployment) {
        return (
            <article
                className="rounded-4xl border border-zinc-200 bg-white 
                p-5 shadow-soft sm:p-6"
            >
                <p className="text-sm text-zinc-500">No deployment selected.</p>
            </article>
        );
    }

    return (
        <article
            className="rounded-4xl border border-zinc-200 bg-white p-5 
            shadow-soft sm:p-6"
        >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-zinc-500">
                        Selected deployment
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                        {deployment.id.slice(0, 8)}
                    </h2>
                </div>

                <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold 
                    ${statusStyles[deployment.status]}`}
                >
                    {titleCase(deployment.status)}
                </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-zinc-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Live URL
                    </p>

                    {deployment.liveUrl ? (
                        <a
                            href={deployment.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block truncate text-sm font-semibold 
                            text-zinc-950 underline decoration-zinc-300 underline-offset-4"
                        >
                            {deployment.liveUrl}
                        </a>
                    ) : (
                        <p className="mt-2 text-sm text-zinc-500">
                            Not available yet
                        </p>
                    )}
                </div>

                <div className="rounded-3xl bg-zinc-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Image tag
                    </p>

                    <p
                        className="mt-2 truncate font-mono text-sm font-semibold 
                        text-zinc-950"
                    >
                        {deployment.imageTag ?? 'Not built yet'}
                    </p>
                </div>
            </div>

            <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-950">
                            Ingress route
                        </h3>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(route)}
                        className="rounded-full border border-zinc-200 px-3 py-1.5 
                        text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    >
                        Copy
                    </button>
                </div>

                <pre
                    className="max-h-56 overflow-auto rounded-3xl bg-zinc-950 
                    p-4 text-sm leading-6 text-zinc-100"
                >
                    {route}
                </pre>
            </div>
        </article>
    );
}
