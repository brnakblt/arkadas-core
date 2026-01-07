import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VirtualizedFileList from '../VirtualizedFileList';

// Mock FontAwesomeIcon to avoid rendering complex SVG
vi.mock('@fortawesome/react-fontawesome', () => ({
    FontAwesomeIcon: () => <span data-testid="icon" />,
}));

// Mock useVirtualizer to render all items for testing (or just simple mock)
// However, since we want to test virtualization we might need a more complex mock
// For unit testing logic, we can mock it to return all items or rely on the implementation
// Since jsdom doesn't handle layout/scroll well, virtualization tests are tricky.
// We'll trust tanstack implementation and just check if items render with correct data provided by mock.

// Actually, create a simple mock for useVirtualizer that just returns items
vi.mock('@tanstack/react-virtual', () => ({
    useVirtualizer: ({ count }: { count: number }) => ({
        getVirtualItems: () => Array.from({ length: count }).map((_, i) => ({
            index: i,
            key: i,
            size: 50,
            start: i * 50,
        })),
        getTotalSize: () => count * 50,
    }),
}));

describe('VirtualizedFileList', () => {
    const mockFiles = [
        { id: '1', name: 'Folder 1', isDirectory: true, size: 0, updatedAt: '2023-01-01' },
        { id: '2', name: 'File 1.txt', isDirectory: false, size: 1024, updatedAt: '2023-01-02' },
    ];

    it('renders list of files', () => {
        render(<VirtualizedFileList files={mockFiles} onFileClick={() => { }} />);

        expect(screen.getByText('Folder 1')).toBeDefined();
        expect(screen.getByText('File 1.txt')).toBeDefined();
        expect(screen.getByText('1 KB')).toBeDefined();
    });

    it('calls onFileClick when a file is clicked', () => {
        const handleFileClick = vi.fn();
        render(<VirtualizedFileList files={mockFiles} onFileClick={handleFileClick} />);

        fireEvent.click(screen.getByText('File 1.txt'));
        expect(handleFileClick).toHaveBeenCalledWith(mockFiles[1]);
    });
});
