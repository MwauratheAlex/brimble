import type { Response } from 'express';

export class DeploymentEventsService {
    private clients = new Map<string, Set<Response>>();

    connect(deploymentId: string, res: Response) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();

        res.write('retry: 1000\n\n');

        const clients = this.clients.get(deploymentId) ?? new Set<Response>();
        clients.add(res);
        this.clients.set(deploymentId, clients);

        res.write(`event: connected\n`);
        res.write(
            `data: ${JSON.stringify({
                deploymentId,
                message: 'Connected to deployment stream'
            })}\n\n`
        );

        res.on('close', () => {
            clients.delete(res);

            if (clients.size === 0) {
                this.clients.delete(deploymentId);
            }

            res.end();
        });
    }

    emitLog(deploymentId: string, log: unknown) {
        this.broadcast(deploymentId, 'log', log);
    }

    emitStatus(deploymentId: string, status: string) {
        this.broadcast(deploymentId, 'status', {
            deploymentId,
            status
        });
    }

    private broadcast(deploymentId: string, event: string, data: unknown) {
        const clients = this.clients.get(deploymentId);
        if (!clients) return;

        for (const res of clients) {
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        }
    }
}

export const deploymentEvents = new DeploymentEventsService();
