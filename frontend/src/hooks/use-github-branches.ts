import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGithubBranches, parseGithubRepoUrl } from '../api/github';
import { useDebouncedValue } from './use-debounced-value';

export function useGithubBranches(gitUrl: string) {
    const debouncedGitUrl = useDebouncedValue(gitUrl, 500);

    const parsedRepo = useMemo(() => {
        return parseGithubRepoUrl(debouncedGitUrl);
    }, [debouncedGitUrl]);

    const isValidGithubUrl = Boolean(parsedRepo);

    const query = useQuery({
        queryKey: ['github-branches', parsedRepo?.normalizedUrl],
        queryFn: () => getGithubBranches(parsedRepo!.normalizedUrl),
        enabled: isValidGithubUrl,
        retry: false,
        staleTime: 1000 * 60 * 5
    });

    return {
        ...query,
        branches: query.data ?? [],
        parsedRepo,
        isValidGithubUrl
    };
}
