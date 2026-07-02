import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import axios from 'axios';
import { EventOpsProvider, useEventOps } from '../context/EventOpsContext';

vi.mock('axios');

// Regression test for a real bug: a freshly-mounted provider (a "new tab")
// that fires update() before its own GET /event-ops hydration lands used to
// read-modify-write from its local, pre-hydration `attendanceStaff` (empty),
// silently dropping every staffer another session had already created —
// because the PUT sent that whole stale array back to the server.
const SERVER_STAFF = [{ id: 1, name: 'Existing Staffer', email: 'a@test.local', code: 'EXIST1', status: 'active' }];

function AddStafferProbe({ onReady }) {
    const { addStaffer } = useEventOps();
    onReady(addStaffer);
    return null;
}

describe('EventOpsContext update() race safety', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('re-baselines against the server before writing, instead of the pre-hydration local state', async () => {
        // GET /event-ops resolves with the server's real attendanceStaff, but
        // slowly enough that a naive implementation would already have fired
        // its PUT from empty local state before this resolves
        let resolveGet;
        axios.get.mockImplementation((url) => {
            if (url.includes('/event-ops')) {
                return new Promise((resolve) => { resolveGet = () => resolve({ data: { booths: [], attendanceStaff: SERVER_STAFF } }); });
            }
            return Promise.resolve({ data: [] });
        });
        let putBody = null;
        axios.put.mockImplementation((url, body) => {
            putBody = body;
            return Promise.resolve({ data: body });
        });

        let addStaffer;
        render(
            <EventOpsProvider>
                <AddStafferProbe onReady={(fn) => { addStaffer = fn; }} />
            </EventOpsProvider>
        );

        // Fire the mutation BEFORE the GET resolves — this is the race
        await act(async () => {
            addStaffer('New Staffer', 'new@test.local');
            // let the update() function's internal GET (triggered because
            // hydratedRef is still false) get issued
            await Promise.resolve();
        });

        // Now let the slow GET resolve
        resolveGet();
        await waitFor(() => expect(putBody).not.toBeNull());

        const savedStaff = putBody.attendanceStaff;
        expect(savedStaff).toBeTruthy();
        // The pre-existing server-side staffer must survive
        expect(savedStaff.some((s) => s.code === 'EXIST1')).toBe(true);
        // The newly-added one must also be present
        expect(savedStaff.some((s) => s.name === 'New Staffer')).toBe(true);
    });
});
