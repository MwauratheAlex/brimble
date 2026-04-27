import { DeploymentCard } from './DeploymentCard';
import { useState, type Dispatch, type SetStateAction } from 'react';
import type { Deployment, DeploymentStatus } from '../types/deployment';

interface DeploymentProps {
    deployments: Deployment[];
    isLoading: boolean;
    error: Error | null;
    selectedDeploymentId: string;
    onSelectDeployment: Dispatch<SetStateAction<string | null>>;
}

export function Deployments(props: DeploymentProps) {
    const [statusFilter, setStatusFilter] = useState<'all' | DeploymentStatus>(
        'all'
    );

    if (props.isLoading) {
        return <p className="text-sm text-zinc-500">Loading deployments...</p>;
    }

    if (props.error) {
        return <p className="text-sm text-rose-600">{props.error.message}</p>;
    }

    const visibleDeployments =
        statusFilter === 'all'
            ? props.deployments
            : props.deployments.filter(
                  (deployment) => deployment.status === statusFilter
              );

    const selectedDeployment =
        props.deployments.find(
            (deployment) => deployment.id === props.selectedDeploymentId
        ) ??
        props.deployments[0] ??
        null;

    const runningCount = props.deployments.filter(
        (deployment) => deployment.status === 'running'
    ).length;

    const activeCount = props.deployments.filter((deployment) =>
        ['pending', 'building', 'deploying'].includes(deployment.status)
    ).length;

    return (
        <aside
            id="deployments"
            className="flex min-h-0 flex-col rounded-[2rem] border border-zinc-200 
            bg-white shadow-soft"
        >
            <div className="shrink-0 border-b border-zinc-100 p-5">
                <div
                    className="mb-5 flex items-start justify-between gap-4 items-center 
                    "
                >
                    <div>
                        <h1
                            className="text-2xl font-semibold tracking-[-0.035em] 
                            text-zinc-950"
                        >
                            Deployments
                        </h1>
                    </div>

                    <span
                        className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold 
                    text-zinc-600 my-auto"
                    >
                        {props.deployments.length} total
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-zinc-50 p-3">
                        <p className="text-2xl font-semibold tracking-tight">
                            {runningCount}
                        </p>
                        <p className="text-xs text-zinc-500">Running</p>
                    </div>

                    <div className="rounded-2xl bg-zinc-50 p-3">
                        <p className="text-2xl font-semibold tracking-tight">
                            {activeCount}
                        </p>
                        <p className="text-xs text-zinc-500">Active</p>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <label className="sr-only" htmlFor="statusFilter">
                        Filter deployments
                    </label>

                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value as 'all' | DeploymentStatus
                            )
                        }
                        className="w-full rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                    >
                        <option value="all">All deployments</option>
                        <option value="running">Running</option>
                        <option value="building">Building</option>
                        <option value="deploying">Deploying</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            <div className="max-h-[420px] min-h-0 flex-1 space-y-3 overflow-y-auto p-4 lg:max-h-none">
                {visibleDeployments.map((deployment) => (
                    <DeploymentCard
                        key={deployment.id}
                        deployment={deployment}
                        selected={deployment.id === selectedDeployment?.id}
                        onClick={() => props.onSelectDeployment(deployment.id)}
                    />
                ))}

                {visibleDeployments.length === 0 && (
                    <p className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-500">
                        No deployments match this filter.
                    </p>
                )}
            </div>
        </aside>
    );
}
