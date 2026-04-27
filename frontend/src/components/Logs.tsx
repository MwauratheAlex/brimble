import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDeploymentLogs } from '../hooks/use-deployment-logs';
import type { Deployment } from '../types/deployment';

export function Logs({ deployment }: { deployment: Deployment | null }) {
    const queryClient = useQueryClient();
    const logPaneRef = useRef<HTMLDivElement | null>(null);

    const [clearedCounts, setClearedCounts] = useState<Record<string, number>>(
        {}
    );

    const logsQuery = useDeploymentLogs(deployment);

    const deploymentId = deployment?.id ?? null;
    const allLogs = logsQuery.logs;

    const clearedCount = deploymentId ? (clearedCounts[deploymentId] ?? 0) : 0;

    const visibleLogs = allLogs.slice(clearedCount);

    useEffect(() => {
        logPaneRef.current?.scrollTo({
            top: logPaneRef.current.scrollHeight
        });
    }, [visibleLogs.length, deploymentId]);

    function clearVisibleLogs() {
        if (!deploymentId) return;

        setClearedCounts((current) => ({
            ...current,
            [deploymentId]: allLogs.length
        }));
    }

    function replayLogs() {
        if (!deploymentId) return;

        setClearedCounts((current) => ({
            ...current,
            [deploymentId]: 0
        }));

        queryClient.invalidateQueries({
            queryKey: ['deployment-logs', deploymentId]
        });
    }

    return (
        <section
            id="logs"
            className="flex min-h-105 flex-col rounded-4xl border 
            border-zinc-200 bg-zinc-950 p-4 shadow-apple sm:p-5 lg:min-h-0"
        >
            <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3 px-1">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Selected stream
                    </p>

                    <h2 className="text-xl font-semibold tracking-tight text-white">
                        Live logs
                    </h2>

                    <p className="mt-1 text-sm text-zinc-400">
                        {deployment
                            ? deployment.id.slice(0, 8)
                            : 'No deployment selected'}
                        {' · '}
                        {logsQuery.isStreaming ? (
                            <span className="text-emerald-400">Streaming</span>
                        ) : (
                            <span>Persisted logs</span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={clearVisibleLogs}
                        disabled={!deployment}
                        className="rounded-full border border-white/10 px-3 py-1.5
                        text-xs font-semibold 
                        text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed
                        disabled:opacity-40"
                    >
                        Clear
                    </button>

                    <button
                        type="button"
                        onClick={replayLogs}
                        disabled={!deployment}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold
                        text-zinc-950 transition hover:bg-zinc-200
                        disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Replay
                    </button>
                </div>
            </div>

            <div
                ref={logPaneRef}
                className="min-h-80 flex-1 overflow-y-auto rounded-3xl
                border border-white/10 bg-black p-4 font-mono text-[13px] 
                leading-6 text-zinc-300 lg:min-h-0"
            >
                {!deployment && (
                    <p className="text-zinc-500">
                        Select a deployment to view logs.
                    </p>
                )}

                {deployment && logsQuery.isPending && (
                    <p className="text-zinc-500">Loading logs...</p>
                )}

                {deployment && logsQuery.isError && (
                    <p className="text-rose-400">
                        {logsQuery.error instanceof Error
                            ? logsQuery.error.message
                            : 'Could not load logs'}
                    </p>
                )}

                {deployment &&
                    !logsQuery.isPending &&
                    visibleLogs.length === 0 && (
                        <p className="text-zinc-500">No logs yet.</p>
                    )}

                {visibleLogs.map((log) => (
                    <div key={log.id}>
                        <span className="text-zinc-500">
                            [{new Date(log.createdAt).toLocaleTimeString()}]
                        </span>{' '}
                        {log.message}
                    </div>
                ))}
            </div>
        </section>
    );
}
