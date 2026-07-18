import { useRef, useState, useEffect } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { INDUSTRY_FIELDS } from './MultiSelectInput';
import { tIndustryField } from '../i18n/translateEnum';

// This category is an artifact of the registration form, not a real industry field
const EXCLUDED_FIELD = 'office and students fairs';

const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

// The dataset's keys are lowercased/cleaned free text, so match them back to
// the canonical INDUSTRY_FIELDS casing (case-insensitive) before translating —
// a naive titleCase() can't recover multi-word/acronym casing like "IT Consulting".
const CANONICAL_BY_LOWER = new Map(INDUSTRY_FIELDS.map((f) => [f.toLowerCase(), f]));
const resolveLabel = (rawLabel) => {
    const canonical = CANONICAL_BY_LOWER.get(rawLabel.toLowerCase());
    return canonical ? tIndustryField(canonical) : titleCase(rawLabel);
};

const BarChartElement = ({ dataset }) => {
    const { t, i18n } = useTranslation();
    const { isDark } = useTheme();
    const isRtl = i18n.dir() === 'rtl';
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
        const clean = resolveLabel(label);
        return clean.length > 24 ? clean.slice(0, 22) + '…' : clean;
    });
    const values = entries.map(([, value]) => value);

    return (
        <div ref={containerRef} className="bg-surface-card rounded-lg p-2 md:p-3 flex flex-col w-full h-full overflow-hidden min-h-[280px]">
            <div className="flex items-center justify-between mb-1">
                <h2 className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("statistics.companiesByIndustryField")}</h2>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">{t("statistics.topN", { count: entries.length })}</span>
            </div>
            <div className="flex-1 min-h-0">
                <BarChart
                    layout="horizontal"
                    width={dimensions.width}
                    height={dimensions.height}
                    yAxis={[{
                        scaleType: 'band',
                        data: labels,
                        position: isRtl ? 'right' : 'left',
                        tickLabelStyle: { fontSize: 11, fill: isDark ? '#cbd5e1' : '#374151' },
                    }]}
                    xAxis={[{
                        tickMinStep: 1,
                        reverse: isRtl,
                        valueFormatter: (v) => (Number.isInteger(v) ? String(v) : ''),
                        tickLabelStyle: { fontSize: 11, fill: isDark ? '#cbd5e1' : '#374151' },
                    }]}
                    series={[{
                        data: values,
                        color: isDark ? '#34C775' : '#0E7F41',
                        valueFormatter: (v) => t("statistics.companyCount", { count: v }),
                    }]}
                    margin={isRtl ? { left: 24, right: 150, top: 8, bottom: 24 } : { left: 150, right: 24, top: 8, bottom: 24 }}
                    borderRadius={4}
                    slotProps={{ legend: { hidden: true } }}
                />
            </div>
        </div>
    );
};

export default BarChartElement;
