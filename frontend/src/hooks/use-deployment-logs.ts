import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deploymentLogStreamUrl, fetchDeploymentLogs } from '../api/logs';
import type {
    Deployment,
    DeploymentLog,
    DeploymentStatus
} from '../types/deployment';

const streamingStatuses: DeploymentStatus[] = [
    'pending',
    'building',
    'deploying'
];

function isStreamingDeployment(deployment: Deployment | null) {
    return Boolean(deployment && streamingStatuses.includes(deployment.status));
}

function appendUniqueLog(
    logs: DeploymentLog[],
    nextLog: DeploymentLog
): DeploymentLog[] {
    if (logs.some((log) => log.id === nextLog.id)) {
        return logs;
    }

    return [...logs, nextLog];
}

export function useDeploymentLogs(deployment: Deployment | null) {
    const queryClient = useQueryClient();

    const deploymentId = deployment?.id ?? null;
    const shouldStream = isStreamingDeployment(deployment);

    const logsQuery = useQuery({
        queryKey: ['deployment-logs', deploymentId],
        queryFn: () => fetchDeploymentLogs(deploymentId!),
        enabled: Boolean(deploymentId),
        staleTime: shouldStream ? 0 : 30_000
    });

    useEffect(() => {
        if (!deploymentId || !shouldStream) return;

        const source = new EventSource(deploymentLogStreamUrl(deploymentId));

        function handleLog(event: MessageEvent) {
            const log = JSON.parse(event.data) as DeploymentLog;

            queryClient.setQueryData<DeploymentLog[]>(
                ['deployment-logs', deploymentId],
                (oldLogs = []) => appendUniqueLog(oldLogs, log)
            );
        }

        function handleStatus(event: MessageEvent) {
            const payload = JSON.parse(event.data) as {
                status: DeploymentStatus;
            };

            queryClient.invalidateQueries({
                queryKey: ['deployments']
            });

            if (payload.status === 'running' || payload.status === 'failed') {
                source.close();

                queryClient.invalidateQueries({
                    queryKey: ['deployment-logs', deploymentId]
                });
            }
        }

        source.addEventListener('log', handleLog);
        source.addEventListener('status', handleStatus);

        source.onerror = () => {
            // Browser may retry automatically while EventSource is open.
            // Avoid throwing here; just let the UI keep showing DB logs.
        };

        return () => {
            source.removeEventListener('log', handleLog);
            source.removeEventListener('status', handleStatus);
            source.close();
        };
    }, [deploymentId, shouldStream, queryClient]);

    return {
        ...logsQuery,
        logs: logsQuery.data ?? [],
        isStreaming: shouldStream
    };
}
