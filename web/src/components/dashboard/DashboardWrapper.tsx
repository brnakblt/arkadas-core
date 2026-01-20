export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-50 relative">
            <div className="md:pl-64 flex flex-col min-h-screen">
                <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 animate-fade-in">
                    {children}
                </main>
            </div>
        </div>
    );
}
