import { useQuery } from '@tanstack/react-query';
import { fetchDeployments } from '../api/deployments';

export function useDeployments() {
    return useQuery({
        queryKey: ['deployments'],
        queryFn: fetchDeployments,
        refetchInterval: 3000
    });
}
