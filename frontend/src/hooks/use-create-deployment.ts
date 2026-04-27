import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deployGit, deployUpload } from '../api/deployments';

export function useCreateGitDeployment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deployGit,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['deployments']
            });
        }
    });
}

export function useCreateUploadDeployment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deployUpload,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['deployments']
            });
        }
    });
}
