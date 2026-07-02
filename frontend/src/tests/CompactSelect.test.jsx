import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CompactSelect from '../components/CompactSelect';

describe('CompactSelect', () => {
    const options = ['Low', 'Medium', 'High'];

    it('shows the placeholder when nothing is selected', () => {
        render(<CompactSelect value="" onChange={() => {}} options={options} placeholder="Choose…" />);
        expect(screen.getByText('Choose…')).toBeInTheDocument();
    });

    it('shows the selected option label', () => {
        render(<CompactSelect value="Medium" onChange={() => {}} options={options} />);
        expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('opens the dropdown on click and lists all options', () => {
        render(<CompactSelect value="" onChange={() => {}} options={options} />);
        fireEvent.click(screen.getByRole('button', { name: /select/i }));
        options.forEach((opt) => {
            expect(screen.getByText(opt)).toBeInTheDocument();
        });
    });

    it('calls onChange with the picked value in a target.value shape', () => {
        const onChange = vi.fn();
        render(<CompactSelect value="" onChange={onChange} options={options} />);
        fireEvent.click(screen.getByRole('button', { name: /select/i }));
        fireEvent.click(screen.getByText('High'));
        expect(onChange).toHaveBeenCalledWith({ target: { value: 'High' } });
    });

    it('supports { value, label } option objects', () => {
        const objOptions = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
        render(<CompactSelect value="a" onChange={() => {}} options={objOptions} />);
        expect(screen.getByText('Alpha')).toBeInTheDocument();
    });
});
