import type React from 'react';
import { useState } from 'react';
import { useGithubBranches } from '../hooks/use-github-branches';
import {
    useCreateGitDeployment,
    useCreateUploadDeployment
} from '../hooks/use-create-deployment';

export function DeployForm() {
    const [gitUrl, setGitUrl] = useState('');
    const [branchChoice, setBranchChoice] = useState<string | null>(null);
    const [deployType, setDeployType] = useState<'Git' | 'Upload'>('Git');
    const [uploadFileName, setUploadFileName] = useState<string | null>(null);

    const branchesQuery = useGithubBranches(gitUrl);
    const isValidGithubUrl = branchesQuery.isValidGithubUrl;
    const gitMutation = useCreateGitDeployment();
    const uploadMutation = useCreateUploadDeployment();

    const branches = branchesQuery.branches;

    const selectedBranch =
        branchChoice && branches.includes(branchChoice)
            ? branchChoice
            : (branches[0] ?? 'main');

    function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        const port = formData.get('port');
        if (typeof port !== 'string' || !port.trim()) {
            throw new Error('Port is required');
        }

        if (deployType === 'Git') {
            gitMutation.mutate({
                gitUrl,
                branch: selectedBranch,
                port
            });

            return;
        }

        const file = formData.get('projectUpload');

        if (!(file instanceof File) || file.size === 0) {
            throw new Error('Please choose a project archive');
        }

        uploadMutation.mutate({
            file,
            port
        });
    }

    return (
        <section className="rounded-4xl border border-zinc-200 bg-white p-5 sm:p-6">
            <div className="mb-6">
                <h2 className="text-xl font-semibold tracking-tight">
                    Create deployment
                </h2>
            </div>

            <div
                className="mb-5 grid rounded-2xl bg-zinc-100 p-1 text-sm font-medium 
            text-zinc-600 sm:grid-cols-2"
            >
                <button
                    className={`rounded-xl px-4 py-2 text-zinc-950 shadow-soft
                        ${deployType === 'Git' && 'bg-white'}
                        `}
                    onClick={() => setDeployType('Git')}
                >
                    Git URL
                </button>
                <button
                    className={`rounded-xl px-4 py-2 text-zinc-950 shadow-soft
                        ${deployType === 'Upload' && 'bg-white'}
                        `}
                    onClick={() => setDeployType('Upload')}
                >
                    Upload project
                </button>
            </div>
            <form id="deployForm" className="space-y-4" onSubmit={handleSubmit}>
                <div className="min-h-19 max-h-19">
                    {deployType === 'Git' ? (
                        <div id="gitField">
                            <label
                                className="mb-2 block text-sm font-medium text-zinc-700"
                                htmlFor="gitUrl"
                            >
                                Repository
                            </label>

                            <input
                                id="gitUrl"
                                name="gitUrl"
                                type="url"
                                value={gitUrl}
                                className="w-full rounded-2xl border border-zinc-200 bg-white 
                    px-4 py-3 text-sm text-zinc-950 outline-none transition 
                    placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                                placeholder="https://github.com/acme/app"
                                onChange={(event) => {
                                    setGitUrl(event.target.value);
                                    setBranchChoice(null);
                                }}
                            />
                        </div>
                    ) : (
                        <div id="uploadField">
                            <label
                                className="mb-2 block text-sm font-medium text-zinc-700"
                                htmlFor="projectUpload"
                            >
                                Project archive
                            </label>

                            <label className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm transition hover:bg-zinc-100 focus-within:border-zinc-400 focus-within:ring-4 focus-within:ring-zinc-100">
                                <input
                                    id="projectUpload"
                                    name="projectUpload"
                                    type="file"
                                    className="sr-only"
                                    accept=".zip,.tar,.gz"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        setUploadFileName(
                                            file ? file.name : null
                                        );
                                    }}
                                />

                                <span
                                    id="uploadName"
                                    className="min-w-0 truncate text-zinc-500"
                                >
                                    {uploadFileName ??
                                        'Choose a .zip or .tar.gz file'}
                                </span>

                                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-soft">
                                    Browse
                                </span>
                            </label>
                        </div>
                    )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label
                            className="mb-2 block text-sm font-medium text-zinc-700"
                            htmlFor="branch"
                        >
                            Branch
                        </label>

                        <div className="select-wrap">
                            <select
                                id="branch"
                                name="branch"
                                value={selectedBranch}
                                onChange={(event) =>
                                    setBranchChoice(event.target.value)
                                }
                                disabled={
                                    !isValidGithubUrl ||
                                    branchesQuery.isPending ||
                                    branchesQuery.isError ||
                                    branches.length === 0
                                }
                                className="custom-select"
                            >
                                {!isValidGithubUrl && deployType === 'Git' && (
                                    <option value="main">
                                        Enter repo URL first
                                    </option>
                                )}
                                {deployType === 'Upload' && (
                                    <option value="main">
                                        Only works with Github Urls
                                    </option>
                                )}

                                {isValidGithubUrl &&
                                    branchesQuery.isPending && (
                                        <option value="main">
                                            Loading branches...
                                        </option>
                                    )}

                                {isValidGithubUrl && branchesQuery.isError && (
                                    <option value="main">
                                        Could not load branches
                                    </option>
                                )}

                                {branches.map((branch) => (
                                    <option key={branch} value={branch}>
                                        {branch}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {branchesQuery.isFetching && (
                            <p className="mt-2 text-sm text-zinc-500">
                                Checking repository branches...
                            </p>
                        )}

                        {branchesQuery.isError && (
                            <p className="mt-2 text-sm text-rose-600">
                                {branchesQuery.error instanceof Error
                                    ? branchesQuery.error.message
                                    : 'Could not fetch branches'}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            className="mb-2 block text-sm font-medium text-zinc-700"
                            htmlFor="port"
                        >
                            Container port
                        </label>

                        <input
                            id="port"
                            name="port"
                            placeholder="3000"
                            defaultValue="3000"
                            inputMode="numeric"
                            className="w-full rounded-2xl border border-zinc-200 bg-white 
                        px-4 py-3 text-sm outline-none transition 
                        focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                        />
                    </div>
                </div>

                <button
                    className="group flex w-full items-center justify-center 
                gap-2 rounded-2xl bg-zinc-950 px-5 py-3.5 
                text-sm font-semibold text-white shadow-soft 
                transition hover:bg-zinc-800 active:scale-[0.99] 
                disabled:cursor-not-allowed disabled:bg-zinc-400"
                    type="submit"
                    disabled={
                        (gitMutation.isPending && deployType === 'Git') ||
                        (uploadMutation.isPending && deployType === 'Upload') ||
                        (!isValidGithubUrl && deployType === 'Git') ||
                        (branchesQuery.isPending && deployType === 'Git') ||
                        (branchesQuery.isError && deployType === 'Git')
                    }
                >
                    {gitMutation.isPending || uploadMutation.isPending
                        ? 'Starting deployment...'
                        : 'Start deployment'}
                    <span className="transition group-hover:translate-x-0.5">
                        →
                    </span>
                </button>
            </form>
        </section>
    );
}
