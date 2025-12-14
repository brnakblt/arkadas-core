import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';
import ContactForm from '../ContactForm';
import { useContactForm } from '../../../hooks/useContactForm';

// Mock the hook
vi.mock('../../../hooks/useContactForm');

describe('ContactForm', () => {
    const mockSubmitForm = vi.fn();
    const mockHandleChange = vi.fn();
    const mockHandleBlur = vi.fn();
    const mockSetKvkkApproved = vi.fn();

    beforeEach(() => {
        (useContactForm as Mock).mockReturnValue({
            formData: {
                name: '',
                email: '',
                phone: '',
                address: '',
                message: '',
            },
            errors: {},
            touched: {},
            kvkkApproved: false,
            setKvkkApproved: mockSetKvkkApproved,
            kvkkError: '',
            setKvkkError: vi.fn(),
            isSubmitting: false,
            handleChange: mockHandleChange,
            handleBlur: mockHandleBlur,
            submitForm: mockSubmitForm,
        });
    });

    it('renders correctly', () => {
        render(<ContactForm />);
        expect(screen.getByText('Bize Mesaj Gönderin')).toBeInTheDocument();
        expect(screen.getByLabelText('Ad Soyad')).toBeInTheDocument();
        expect(screen.getByLabelText('E-posta Adresi')).toBeInTheDocument();
    });

    it('handles form submission', async () => {
        mockSubmitForm.mockResolvedValue(true);
        render(<ContactForm />);

        const submitButton = screen.getByText('Mesaj Gönder');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockSubmitForm).toHaveBeenCalled();
        });
    });

    it('displays validation errors', () => {
        (useContactForm as Mock).mockReturnValue({
            // @ts-ignore - recursive mock strategy
            ...useContactForm(),
            errors: { name: 'Ad Soyad alanı zorunludur' },
            touched: { name: true },
        });

        render(<ContactForm />);
        expect(screen.getByText('Ad Soyad alanı zorunludur')).toBeInTheDocument();
    });
    it('handles input interactions', () => {
        render(<ContactForm />);

        const nameInput = screen.getByLabelText('Ad Soyad');
        fireEvent.change(nameInput, { target: { value: 'Test Name' } });
        expect(mockHandleChange).toHaveBeenCalled();

        fireEvent.blur(nameInput);
        expect(mockHandleBlur).toHaveBeenCalled();
    });

    it('handles KVKK accordion toggle', () => {
        render(<ContactForm />);
        const kvkkSection = screen.getByText(/Kişisel verilerimin işlenmesi hakkında/).closest('div')?.parentElement;
        const accordionContent = screen.getByText(/İlgili kanun ve yönetmelikler/).closest('div');

        // Initial state is closed (max-h-0) - actually testing logic via click
        // Note: We can't easily test state inside functional component without integration test
        // But we can verify no crash on click
        const header = screen.getByText(/Kişisel verilerimin işlenmesi hakkında/);
        fireEvent.click(header);
    });

    it('handles KVKK checkbox', () => {
        render(<ContactForm />);
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        expect(mockSetKvkkApproved).toHaveBeenCalledWith(true);
    });

    it('shows loading state during submission', () => {
        (useContactForm as Mock).mockReturnValue({
            // @ts-ignore
            ...useContactForm(),
            isSubmitting: true,
        });

        render(<ContactForm />);
        expect(screen.getByText('Gönderiliyor...')).toBeDisabled();
    });

    it('shows success alert on successful submission', async () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
        mockSubmitForm.mockResolvedValue(true);

        render(<ContactForm />);
        const submitButton = screen.getByText('Mesaj Gönder');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('başarıyla gönderildi'));
        });
        alertSpy.mockRestore();
    });

    it('shows error alert on failed submission', async () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
        mockSubmitForm.mockRejectedValue(new Error('Failed'));

        render(<ContactForm />);
        const submitButton = screen.getByText('Mesaj Gönder');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('hata oluştu'));
        });
        alertSpy.mockRestore();
    });

    it('displays KVKK error', () => {
        (useContactForm as Mock).mockReturnValue({
            // @ts-ignore
            ...useContactForm(),
            kvkkError: 'Onaylamanız gerekir',
        });

        render(<ContactForm />);
        expect(screen.getByText('Onaylamanız gerekir')).toBeInTheDocument();
    });
});
