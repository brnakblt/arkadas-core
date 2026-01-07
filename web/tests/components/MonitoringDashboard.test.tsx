
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MonitoringPage from '@/app/dashboard/monitoring/page';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';

// Mock Fetch
global.fetch = vi.fn();

// Mock Next Navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}));

// Mock Dashboard Context
vi.mock('@/context/DashboardContext', () => ({
    useDashboard: vi.fn(),
}));

// Mock Card Component
vi.mock('@/components/ui/Card', () => ({
    default: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>
}));

const mockStats = {
    cpu: {
        manufacturer: 'Intel',
        brand: 'Core i9',
        cores: 16,
        load: '45.50'
    },
    memory: {
        total: 32000000000,
        free: 16000000000,
        used: 16000000000,
        active: 10000000000,
        available: 16000000000
    },
    disk: [
        {
            fs: '/dev/sda1',
            type: 'ext4',
            size: 500000000000,
            used: 250000000000,
            use: 50.00,
            mount: '/'
        }
    ],
    timestamp: new Date().toISOString()
};

const mockHealth = {
    database: 'connected',
    redis: 'connected',
    uptime: 1000,
    timestamp: new Date().toISOString()
};

describe.skip('MonitoringPage', () => {
    const mockPush = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();
        (useRouter as unknown as Mock).mockReturnValue({ push: mockPush });
    });

    it('redirects if user is not logged in', () => {
        (useDashboard as unknown as Mock).mockReturnValue({
            user: null,
            loading: false
        });

        render(<MonitoringPage />);
        expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('redirects if user is not admin', () => {
        (useDashboard as unknown as Mock).mockReturnValue({
            user: { username: 'teacher1', role: { type: 'teacher' } },
            loading: false
        });

        render(<MonitoringPage />);
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('renders loading state initially', () => {
        (useDashboard as unknown as Mock).mockReturnValue({
            user: { username: 'admin', role: { type: 'admin' } },
            loading: false
        });

        // Mock fetch to return a promise that doesn't resolve immediately
        (global.fetch as any).mockImplementation(() => new Promise(() => { }));

        render(<MonitoringPage />);
        expect(screen.getByText(/Loading monitoring data/i)).toBeInTheDocument();
    });

    it('renders dashboard for admin user', async () => {
        (useDashboard as unknown as Mock).mockReturnValue({
            user: { username: 'admin', role: { type: 'admin' } },
            loading: false
        });

        (global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockStats,
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockHealth,
            });

        render(<MonitoringPage />);

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText(/Server Monitoring/i)).toBeInTheDocument();
        });

        // Check CPU
        expect(screen.getByText(/Core i9/i)).toBeInTheDocument();
        expect(screen.getByText(/45.50%/i)).toBeInTheDocument();

        // Check Health
        expect(screen.getByText('Database (Postgres)')).toBeInTheDocument();
        expect(screen.getAllByText('connected')[0]).toBeInTheDocument();

        expect(mockPush).not.toHaveBeenCalled();
    });

    it('renders error state on failure', async () => {
        (useDashboard as unknown as Mock).mockReturnValue({
            user: { username: 'admin' },
            loading: false
        });

        (global.fetch as any).mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        render(<MonitoringPage />);

        await waitFor(() => {
            expect(screen.getByText(/Error:/i)).toBeInTheDocument();
        });
    });
});
