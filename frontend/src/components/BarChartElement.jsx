import { useRef, useState, useEffect } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';

// This category is an artifact of the registration form, not a real industry field
const EXCLUDED_FIELD = 'office and students fairs';

const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

const BarChartElement = ({ dataset }) => {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 550, height: 300 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setDimensions({
                    width: Math.max(width - 24, 100),
                    height: Math.max(height - 48, 150), // leave room for the header
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener('resize', updateDimensions);
            resizeObserver.disconnect();
        };
    }, []);

    const entries = Object.entries(dataset || {})
        .filter(([label]) => label.toLowerCase() !== EXCLUDED_FIELD)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const labels = entries.map(([label]) => {
        const clean = titleCase(label);
        return clean.length > 24 ? clean.slice(0, 22) + '…' : clean;
    });
    const values = entries.map(([, value]) => value);

    return (
        <div ref={containerRef} className="bg-white rounded-lg p-2 md:p-3 flex flex-col w-full h-full overflow-hidden min-h-[280px]">
            <div className="flex items-center justify-between mb-1">
                <h2 className="text-xs font-medium text-gray-700">Companies by Industry Field</h2>
                <span className="text-[10px] text-gray-400">Top {entries.length}</span>
            </div>
            <div className="flex-1 min-h-0">
                <BarChart
                    layout="horizontal"
                    width={dimensions.width}
                    height={dimensions.height}
                    yAxis={[{
                        scaleType: 'band',
                        data: labels,
                        tickLabelStyle: { fontSize: 11 },
                    }]}
                    xAxis={[{
                        tickMinStep: 1,
                        valueFormatter: (v) => (Number.isInteger(v) ? String(v) : ''),
                        tickLabelStyle: { fontSize: 11 },
                    }]}
                    series={[{
                        data: values,
                        color: '#0E7F41',
                        valueFormatter: (v) => `${v} ${v === 1 ? 'company' : 'companies'}`,
                    }]}
                    margin={{ left: 150, right: 24, top: 8, bottom: 24 }}
                    borderRadius={4}
                    slotProps={{ legend: { hidden: true } }}
                />
            </div>
        </div>
    );
};

export default BarChartElement;
