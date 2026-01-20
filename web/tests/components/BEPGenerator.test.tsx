
import { render, screen } from '@testing-library/react';
import BEPGenerator from '@/components/dashboard/BEPGenerator';
import { describe, it, expect } from 'vitest';

describe('BEPGenerator Component', () => {
    it('should render the basic form fields', () => {
        render(<BEPGenerator />);
        expect(screen.getByLabelText(/Öğrenci Seçimi/i)).toBeDefined();
        expect(screen.getByLabelText(/Gözlem ve Notlar/i)).toBeDefined();
    });

    it('should render the new enhanced input fields', () => {
        render(<BEPGenerator />);
        expect(screen.getByLabelText(/Güçlü Yönler/i)).toBeDefined();
        expect(screen.getByLabelText(/Gelişimsel İhtiyaçlar/i)).toBeDefined();
    });
});
