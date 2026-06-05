import { Component } from 'react';

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

            return (
                <div className="flex flex-col items-center justify-center flex-1 min-h-0 gap-4 p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                    </div>

                    <div className="max-w-md">
                        <p className="text-sm font-semibold text-gray-800 mb-1">Something went wrong</p>
                        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                            An unexpected error occurred{component ? ` in <${component.replace(/^at /, '')}>` : ''}.
                        </p>

                        {/* Error detail box */}
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 mb-4 text-left">
                            <p className="text-[10px] font-mono text-red-600 break-words leading-relaxed">{msg}</p>
                        </div>

                        <p className="text-xs text-gray-400 mb-4">
                            Try reloading. If the problem persists, contact{' '}
                            <a href="mailto:support@sharjah.ac.ae" className="text-blue-500 hover:underline">support@sharjah.ac.ae</a>
                            {' '}and include the error above.
                        </p>

                        <button
                            onClick={() => window.location.reload()}
                            className="text-xs px-4 py-2 rounded bg-[#0E7F41] text-white hover:bg-[#0a5f31] transition-colors font-medium"
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
