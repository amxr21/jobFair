import { useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";

const ALL_ROUTES = [
    { path: '/',                label: 'Applicants',        icon: 'applicants' },
    { path: '/managers',        label: 'Managers',          icon: 'managers',   adminOnly: true },
    { path: '/statistics',      label: 'Statistics',        icon: 'statistics', adminOnly: true },
    { path: '/surveyResults',   label: 'Survey Results',    icon: 'survey',     adminOnly: true },
    { path: '/company-status',  label: 'My Status',         icon: 'status',     companyOnly: true },
    { path: '/survey',          label: 'Survey',            icon: 'survey' },
    { path: '/login',           label: 'Login',             icon: null },
    { path: '/signup',          label: 'Sign Up',           icon: null },
];

function similarity(a, b) {
    const la = a.toLowerCase().replace(/[^a-z]/g, '');
    const lb = b.toLowerCase().replace(/[^a-z]/g, '');
    let matches = 0;
    for (let i = 0; i < Math.min(la.length, lb.length); i++) {
        if (la[i] === lb[i]) matches++;
    }
    return la.length === 0 ? 0 : matches / Math.max(la.length, lb.length);
}

export default function NotFound() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const isCASTO = user?.companyName === "CASTO Office" || user?.email === "casto@sharjah.ac.ae";

    const attempted = location.pathname;

    // Filter accessible routes for this user
    const accessible = ALL_ROUTES.filter(r => {
        if (r.adminOnly && !isCASTO) return false;
        if (r.companyOnly && (!user || isCASTO)) return false;
        if ((r.path === '/login' || r.path === '/signup') && user) return false;
        return true;
    });

    // Find closest match by path similarity
    const scored = accessible.map(r => ({
        ...r,
        score: similarity(attempted, r.path),
    })).sort((a, b) => b.score - a.score);

    const best = scored[0];

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-5 p-8 text-center">
            {/* 404 number */}
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
                <span className="text-2xl font-bold text-gray-400">404</span>
            </div>

            <div className="max-w-sm">
                <p className="text-sm font-semibold text-gray-800 mb-1">Page not found</p>
                <p className="text-xs text-gray-500 mb-1 leading-relaxed">
                    The path <span className="font-mono bg-gray-100 px-1 rounded text-gray-700">{attempted}</span> doesn't exist.
                </p>

                {best && best.score > 0 && (
                    <p className="text-xs text-gray-400 mb-4">
                        Did you mean <span className="font-medium text-gray-600">{best.label}</span>?
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-2 w-full max-w-xs">
                {/* Best match suggestion */}
                {best && (
                    <button
                        onClick={() => navigate(best.path)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0E7F41] hover:bg-[#0a5f31] text-white text-xs font-medium rounded-lg transition-colors"
                    >
                        Go to {best.label}
                    </button>
                )}

                {/* Secondary: go home */}
                {best?.path !== '/' && (
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-lg transition-colors"
                    >
                        Back to Applicants
                    </button>
                )}
            </div>

            {/* All accessible routes */}
            {accessible.length > 1 && (
                <div className="mt-2">
                    <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">Available pages</p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                        {accessible.filter(r => r.path !== best?.path).map(r => (
                            <button
                                key={r.path}
                                onClick={() => navigate(r.path)}
                                className="px-2.5 py-1 text-[10px] rounded border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
