import Database from 'better-sqlite3';
import {
    LogRow,
    rowtoDeployment,
    rowToLog,
    type Deployment,
    type DeploymentRow,
    type Log
} from './types';
import path from 'node:path';
import fs from 'node:fs';

const dbPath =
    process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'data/brimble.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS deployments (
    id TEXT PRIMARY KEY,
    git_url TEXT,
    filename TEXT,
    branch TEXT,
    type TEXT NOT NULL,
    port INTEGER NOT NULL,
    status TEXT NOT NULL,
    image_tag TEXT,
    live_url TEXT,
    container_name TEXT,
    route_path TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS deployment_logs (
    id TEXT PRIMARY KEY,
    deployment_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (deployment_id) REFERENCES deployments(id)
  );
`);

type DeploymentUpdate = Partial<
    Pick<
        Deployment,
        | 'status'
        | 'imageTag'
        | 'liveUrl'
        | 'port'
        | 'routePath'
        | 'containerName'
    >
>;

const deploymentUpdateColumns = {
    status: 'status',
    imageTag: 'image_tag',
    liveUrl: 'live_url',
    port: 'port',
    routePath: 'route_path',
    containerName: 'container_name'
} as const satisfies Record<keyof DeploymentUpdate, string>;

export function dbCreateDeployment(deployment: Deployment) {
    db.prepare(
        `INSERT INTO deployments (
                id,
                git_url,
                filename,
                branch,
                type,
                port,
                status,
                image_tag,
                live_url,
                created_at,
                updated_at
            ) VALUES (
                @id,
                @gitUrl,
                @filename,
                @branch,
                @type,
                @port,
                @status,
                @imageTag,
                @liveUrl,
                @createdAt,
                @updatedAt
            )`
    ).run(deployment);
}

export function dbUpdateDeployment(id: string, update: DeploymentUpdate) {
    const fields: string[] = [];
    const values: Record<string, unknown> = {
        id,
        updatedAt: new Date().toISOString()
    };

    for (const key of Object.keys(update) as Array<keyof DeploymentUpdate>) {
        const val = update[key];
        if (val === undefined) continue;

        const col = deploymentUpdateColumns[key];

        fields.push(`${col} = @${String(key)}`);
        values[String(key)] = val;
    }

    if (fields.length === 0) {
        return { changes: 0 };
    }

    fields.push('updated_at = @updatedAt');

    return db
        .prepare(
            `UPDATE deployments
             SET ${fields.join(', ')}
             WHERE id = @id`
        )
        .run(values);
}

export function dbGetDeployments(id: string): Deployment | undefined {
    const row = db
        .prepare(
            `
        SELECT *
        FROM deployments
        WHERE id = ?
        `
        )
        .get(id) as DeploymentRow | undefined;

    return row ? rowtoDeployment(row) : undefined;
}

export function dbListAllDeployments(): Deployment[] {
    const rows = db
        .prepare(
            `
            SELECT *
            FROM deployments
            `
        )
        .all() as DeploymentRow[];

    return rows.map((row) => rowtoDeployment(row));
}

export function dbListRoutableDeployments(): Deployment[] {
    const rows = db
        .prepare(
            `
            SELECT *
            FROM deployments
            WHERE status = 'running'
              AND container_name IS NOT NULL
              AND route_path IS NOT NULL
              AND port IS NOT NULL
            ORDER BY created_at ASC
            `
        )
        .all() as DeploymentRow[];

    return rows.map(rowtoDeployment);
}

export function dbListLogs(deploymentId: string): Log[] {
    const rows = db
        .prepare(
            `
            SELECT *
            FROM deployment_logs
            WHERE deployment_id = ?
            ORDER BY created_at ASC
            `
        )
        .all(deploymentId) as LogRow[];
    return rows.map(rowToLog);
}

export function dbCreateLog(log: Log) {
    db.prepare(
        `INSERT INTO  deployment_logs (
                id,
                deployment_id,
                message,
                created_at
            ) VALUES (
                @id,
                @deploymentID,
                @message,
                @createdAt
            )`
    ).run(log);
}
