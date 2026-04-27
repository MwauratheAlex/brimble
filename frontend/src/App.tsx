import { useState } from 'react';
import { DeployForm } from './components/DeployForm';
import { Deployments } from './components/Deployments';
import { Header } from './components/Header';
import { Logs } from './components/Logs';
import { useDeployments } from './hooks/use-deployments';
import { DeploymentDetailsCard } from './components/DeploymentDetailsCard';

function App() {
    const [selectedDeploymentId, setSelectedDeploymentId] = useState<
        string | null
    >(null);

    const deploymentsQuery = useDeployments();
    const deployments = deploymentsQuery.data ?? [];

    const selectedDeployment =
        deployments.find(
            (deployment) => deployment.id === selectedDeploymentId
        ) ??
        deployments[0] ??
        null;

    return (
        <div
            className="min-h-screen bg-[#f5f5f7] font-sans text-zinc-950 antialiased 
            lg:h-screen lg:overflow-hidden"
        >
            <div
                className="mx-auto flex min-h-screen w-full max-w-375 flex-col 
                px-4 py-4 sm:px-6 lg:h-screen lg:min-h-0 lg:px-8 pb-0"
            >
                <Header />
                <main className="min-h-0 flex-1 py-5">
                    <section
                        className="grid gap-5 lg:h-full lg:min-h-0 
                        lg:grid-cols-[360px_minmax(0,1fr)_440px]"
                    >
                        <Deployments
                            deployments={deployments}
                            isLoading={deploymentsQuery.isPending}
                            error={deploymentsQuery.error}
                            selectedDeploymentId={
                                selectedDeployment?.id ?? null
                            }
                            onSelectDeployment={setSelectedDeploymentId}
                        />

                        <section className="space-y-5 lg:overflow-y-auto lg:pr-1">
                            <DeployForm />
                            <DeploymentDetailsCard
                                deployment={selectedDeployment}
                            />
                        </section>
                        <Logs deployment={selectedDeployment} />
                    </section>
                </main>
            </div>
        </div>
    );
}

export default App;
