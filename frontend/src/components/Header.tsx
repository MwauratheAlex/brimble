export function Header() {
    return (
        <header className="shrink-0 border-b border-zinc-200/80 pb-4">
            <nav className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl bg-zinc-950 text-sm font-semibold text-white shadow-soft">
                        B
                    </div>
                    <div>
                        <p className="text-sm font-semibold tracking-tight text-zinc-950">
                            Brimble
                        </p>
                        <p className="text-xs text-zinc-500">
                            Quick and Easy Deployment Pipeline
                        </p>
                    </div>
                </div>
            </nav>
        </header>
    );
}
