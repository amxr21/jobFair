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

// Regression test for the booth-assignment revert bug: update() is memoized
// on [employee.name, persist], so it used to close over the `data` from the
// render it was created in. Every edit was then applied to that page-load
// snapshot instead of the current state — assign booth A, assign booth B,
// and A visibly snaps back to Available (and the revert is persisted).
function BoothProbe({ onReady }) {
    const { data, update } = useEventOps();
    onReady({ update, booths: data.booths });
    return null;
}

describe('EventOpsContext update() successive edits', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('keeps the first booth assignment when a second booth is edited afterwards', async () => {
        const SERVER_BOOTHS = [
            { id: 1, number: 'B01', zone: 'A', ring: 'outer', company: null, type: 'Standard', status: 'Available' },
            { id: 2, number: 'B02', zone: 'A', ring: 'outer', company: null, type: 'Standard', status: 'Available' },
        ];
        axios.get.mockImplementation((url) => {
            if (url.includes('/event-ops')) {
                return Promise.resolve({ data: { booths: SERVER_BOOTHS } });
            }
            return Promise.resolve({ data: [] });
        });
        let lastPut = null;
        axios.put.mockImplementation((url, body) => {
            lastPut = body;
            return Promise.resolve({ data: body });
        });

        let probe;
        render(
            <EventOpsProvider>
                <BoothProbe onReady={(p) => { probe = p; }} />
            </EventOpsProvider>
        );
        // Let hydration land so both edits run against hydrated state
        await waitFor(() => expect(probe.booths.some((b) => b.number === 'B01')).toBe(true));

        const assign = (boothId, company) =>
            probe.update('booths', 'booths.assigned', { number: boothId, label: company }, (rows, who) =>
                rows.map((b) => (b.id === boothId ? { ...b, company, status: 'Assigned', ...who } : b)));

        await act(async () => { await assign(1, 'First Co'); });
        await act(async () => { await assign(2, 'Second Co'); });

        // Both assignments must survive in local state…
        const b01 = probe.booths.find((b) => b.number === 'B01');
        const b02 = probe.booths.find((b) => b.number === 'B02');
        expect(b01?.company).toBe('First Co');
        expect(b02?.company).toBe('Second Co');

        // …and in what gets persisted to the server
        await waitFor(() => expect(lastPut?.booths).toBeTruthy(), { timeout: 3000 });
        expect(lastPut.booths.find((b) => b.number === 'B01')?.company).toBe('First Co');
        expect(lastPut.booths.find((b) => b.number === 'B02')?.company).toBe('Second Co');
    });
});
