import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import axios from 'axios';
import { EventOpsProvider, useEventOps } from '../context/EventOpsContext';
import { NotificationsProvider } from '../context/NotificationsContext';

vi.mock('axios');

// EventOpsProvider now consumes NotificationsProvider (for the audit →
// notification watcher) and react-i18next. Wrap every render so both are present.
const renderWithProviders = (ui) =>
    render(<NotificationsProvider>{ui}</NotificationsProvider>);

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
        renderWithProviders(
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
        renderWithProviders(
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

// Regression test for the "assign a booth, it saves, then silently reverts a
// few seconds later" bug — a time-of-check/time-of-use race in
// refetchEventOps(). A poll GET issued while a booth edit was still pending
// snapshots the DB's pre-edit rows; before that slow GET resolves, the edit's
// PUT succeeds and clears the section's dirty flag. The old code checked
// dirtiness only at *response* time, so the now-"clean" booths section got
// overwritten with the stale pre-edit snapshot — reverting the assignment with
// no error toast. The fix also skips sections that were dirty when the GET was
// *issued*.
describe('EventOpsContext refetch vs. in-flight save race', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('does not let a stale in-flight poll overwrite a booth edit whose save completes mid-flight', async () => {
        const UNASSIGNED = [
            { id: 1, number: 'B01', zone: 'A', ring: 'outer', company: null, type: 'Standard', status: 'Available' },
        ];

        // First GET (initial hydration) resolves immediately with unassigned
        // booths. A later GET (the stale poll) is held open so we can resolve
        // it AFTER the edit's PUT has completed and cleared the dirty flag.
        let getCount = 0;
        let resolveStalePoll;
        axios.get.mockImplementation((url) => {
            if (url.includes('/event-ops')) {
                getCount += 1;
                if (getCount === 1) return Promise.resolve({ data: { booths: UNASSIGNED } });
                // The stale poll: still returns pre-edit (unassigned) booths,
                // because it snapshotted the DB before the write landed.
                return new Promise((resolve) => {
                    resolveStalePoll = () => resolve({ data: { booths: UNASSIGNED } });
                });
            }
            return Promise.resolve({ data: [] });
        });
        axios.put.mockResolvedValue({ data: {} });

        let probe;
        renderWithProviders(
            <EventOpsProvider>
                <BoothProbe onReady={(p) => { probe = p; }} />
            </EventOpsProvider>
        );

        // Let initial hydration land.
        await act(async () => { await Promise.resolve(); await Promise.resolve(); });
        expect(probe.booths.find((b) => b.number === 'B01')?.company).toBeNull();

        // Assign the booth (marks `booths` dirty, queues an 800ms debounced PUT).
        await act(async () => {
            await probe.update('booths', 'booths.assigned', { number: 1, label: 'Acme' }, (rows, who) =>
                rows.map((b) => (b.id === 1 ? { ...b, company: 'Acme', status: 'Assigned', ...who } : b)));
        });
        expect(probe.booths.find((b) => b.number === 'B01')?.company).toBe('Acme');

        // Fire the poll while the edit is still pending — this issues the stale
        // GET (getCount === 2) that snapshots the section as dirty at request time.
        await act(async () => { vi.advanceTimersByTime(15000); });

        // The debounced PUT now fires and succeeds, clearing the dirty flag.
        await act(async () => { vi.advanceTimersByTime(800); await Promise.resolve(); await Promise.resolve(); });

        // Only NOW does the stale poll resolve — after the flag was cleared.
        await act(async () => { resolveStalePoll(); await Promise.resolve(); await Promise.resolve(); });

        // The assignment must survive: the stale snapshot must not clobber it.
        expect(probe.booths.find((b) => b.number === 'B01')?.company).toBe('Acme');
    });
});

// The audit → notification watcher: every event-ops change (including ones made
// by another user, which arrive via the poll appending to data.audit) should
// produce a notification, without replaying the whole history on first load.
import { useNotifications } from '../context/NotificationsContext';

function AuditProbe({ onReady }) {
    const { update, data } = useEventOps();
    const { items } = useNotifications();
    onReady({ update, audit: data.audit, items });
    return null;
}

describe('EventOpsContext audit → notification watcher', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        // Logged-in user so the watcher is active (it skips logged-out visitors).
        localStorage.setItem('user', JSON.stringify({ companyName: 'CASTO Office', email: 'casto@sharjah.ac.ae', token: 't' }));
    });
    afterEach(() => {
        localStorage.clear();
    });

    it('notifies on a new change but does not replay pre-existing audit history', async () => {
        // Server already has one historical audit entry when the app loads.
        const EXISTING_AUDIT = [
            { id: 1000, at: new Date().toISOString(), by: 'Rana', section: 'booths', messageKey: 'booths.assigned', messageParams: { number: 'B01', label: 'OldCo' } },
        ];
        axios.get.mockImplementation((url) => {
            if (url.includes('/event-ops')) {
                return Promise.resolve({ data: { booths: [{ id: 1, number: 'B01', zone: 'A', ring: 'outer', company: null, type: 'Standard', status: 'Available' }], audit: EXISTING_AUDIT } });
            }
            return Promise.resolve({ data: [] });
        });
        axios.put.mockResolvedValue({ data: {} });

        let probe;
        renderWithProviders(
            <EventOpsProvider>
                <AuditProbe onReady={(p) => { probe = p; }} />
            </EventOpsProvider>
        );

        // Let hydration land — the existing entry is adopted as already-seen.
        await waitFor(() => expect(probe.audit?.some((a) => a.id === 1000)).toBe(true));
        // History must NOT have been turned into notifications.
        expect(probe.items.length).toBe(0);

        // Now make a fresh change — this must produce exactly one notification.
        await act(async () => {
            await probe.update('booths', 'booths.assigned', { number: 'B01', label: 'NewCo' }, (rows, who) =>
                rows.map((b) => (b.id === 1 ? { ...b, company: 'NewCo', status: 'Assigned', ...who } : b)));
        });

        await waitFor(() => expect(probe.items.length).toBe(1));
        // And a second identical-key change adds another (no accidental dedupe).
        await act(async () => {
            await probe.update('booths', 'booths.cleared', { number: 'B01' }, (rows, who) =>
                rows.map((b) => (b.id === 1 ? { ...b, company: null, status: 'Available', ...who } : b)));
        });
        await waitFor(() => expect(probe.items.length).toBe(2));
    });
});
