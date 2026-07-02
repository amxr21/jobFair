import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from '../components/Toast';

function TriggerButton({ message, options }) {
    const toast = useToast();
    return <button onClick={() => toast(message, options)}>fire</button>;
}

function CallsUseToastAlone() {
    useToast();
    return null;
}

describe('Toast', () => {
    it('useToast throws when called outside a ToastProvider', () => {
        // React logs the thrown error to the console during render; that's expected
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<CallsUseToastAlone />)).toThrow(/must be used inside ToastProvider/);
        spy.mockRestore();
    });

    it('renders a toast message after firing', async () => {
        render(
            <ToastProvider>
                <TriggerButton message="Saved successfully" options={{ type: 'success' }} />
            </ToastProvider>
        );
        act(() => {
            screen.getByText('fire').click();
        });
        expect(await screen.findByText('Saved successfully')).toBeInTheDocument();
    });

    it('dismisses the toast when clicked', async () => {
        render(
            <ToastProvider>
                <TriggerButton message="Click to dismiss" options={{ duration: 60000 }} />
            </ToastProvider>
        );
        act(() => {
            screen.getByText('fire').click();
        });
        const toastEl = await screen.findByText('Click to dismiss');

        act(() => {
            toastEl.click();
        });

        await waitFor(() => {
            expect(screen.queryByText('Click to dismiss')).not.toBeInTheDocument();
        }, { timeout: 1000 });
    });
});
