import { Component } from 'react';
import { createPortal } from 'react-dom';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        this.setState({ errorInfo: info });
        console.error('[ErrorBoundary] Caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            const msg = this.state.error?.message || 'Unknown error';
            const component = this.state.errorInfo?.componentStack
                ?.trim()
                ?.split('\n')[1]
                ?.trim() || null;

            // Portaled to <body> so it escapes the route-transition container,
            // which has a CSS transform — a fixed element inside a transformed
            // ancestor is positioned relative to that ancestor, not the
            // viewport, so without the portal the overlay couldn't cover the
            // navbar. The portal makes `fixed inset-0` truly full-viewport.
            return createPortal(
                <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-white/40 dark:bg-black/50 backdrop-blur-md animate-fadeIn">
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-2xl p-6 md:p-8 text-center flex flex-col items-center gap-4 animate-scaleIn">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                            </svg>
                        </div>

                        <div className="w-full">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Something went wrong</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                                An unexpected error occurred{component ? ` in <${component.replace(/^at /, '')}>` : ''}.
                            </p>

                            {/* Error detail box */}
                            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 mb-4 text-left">
                                <p className="text-[10px] font-mono text-red-600 dark:text-red-400 break-words leading-relaxed">{msg}</p>
                            </div>

                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                                Try reloading. If the problem persists, contact{' '}
                                <a href="mailto:support@sharjah.ac.ae" className="text-blue-500 hover:underline">support@sharjah.ac.ae</a>
                                {' '}and include the error above.
                            </p>

                            <button
                                onClick={() => window.location.reload()}
                                className="text-xs px-4 py-2 rounded-lg bg-[#0E7F41] text-white hover:bg-[#0a5f31] transition-colors font-medium"
                            >
                                Reload page
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            );
        }
        return this.props.children;
    }
}
