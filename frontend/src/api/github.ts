export type ParsedGithubRepo = {
    owner: string;
    repo: string;
    normalizedUrl: string;
};

export function parseGithubRepoUrl(value: string): ParsedGithubRepo | null {
    try {
        const url = new URL(value.trim());

        const isGithub =
            url.hostname === 'github.com' || url.hostname === 'www.github.com';

        if (!isGithub) return null;

        const parts = url.pathname
            .replace(/^\/|\/$/g, '')
            .split('/')
            .filter(Boolean);

        if (parts.length < 2) return null;

        const owner = parts[0];
        const repo = parts[1].replace(/\.git$/, '');

        if (!owner || !repo) return null;

        return {
            owner,
            repo,
            normalizedUrl: `https://github.com/${owner}/${repo}`
        };
    } catch {
        return null;
    }
}

export async function getGithubBranches(repoUrl: string): Promise<string[]> {
    const parsed = parseGithubRepoUrl(repoUrl);

    if (!parsed) {
        throw new Error('Enter a valid public GitHub repo URL');
    }

    const response = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/branches?per_page=100`,
        {
            headers: {
                Accept: 'application/vnd.github+json'
            }
        }
    );

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Repository not found or not public');
        }

        throw new Error('Could not fetch branches');
    }

    const branches: Array<{ name: string }> = await response.json();

    return branches.map((branch) => branch.name);
}
