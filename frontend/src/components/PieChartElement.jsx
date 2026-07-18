import { PieChart } from '@mui/x-charts/PieChart';
import { ChartTitle } from './index';

import { FieldFilter } from "./index"
import useStatsticsFilter from '../hooks/useStatsticsFilter';

const PieChartElement = ({title, dataset, colorsPair, dataCategory}) => {

    const { statsticType, categoryType } = useStatsticsFilter()

    // Get current data and colors based on category
    const getCurrentData = () => {
        if (dataCategory === 'applicants_companies') {
            return {
                data: statsticType === "Managers" ? dataset[1] : dataset[0],
                colors: statsticType === "Managers" ? colorsPair[0] : colorsPair[1]
            };
        } else {
            const isCities = categoryType === "cities";
            return {
                data: isCities ? dataset[0] : dataset[1],
                colors: isCities
                    ? ["#0E7F41", "#22A05B", "#34C775", "#5DD993", "#8FE7B5"]
                    : ["#0066CC", "#3388DD", "#66AAEE", "#99CCFF"]
            };
        }
    };

    const { data: currentData, colors: currentColors } = getCurrentData();

    return (
        <div className="bg-surface-card rounded-lg p-2 md:p-3 flex flex-col w-full h-full overflow-hidden min-h-[240px]">
            {/* Header with title and filter in same row */}
            <div className="flex items-center justify-between mb-1">
                <h2 className="text-xs font-medium text-gray-700 dark:text-gray-300">{title}</h2>
                <FieldFilter dataCategory={dataCategory} />
            </div>

            <div className="flex flex-col items-center justify-center flex-1 min-h-0 overflow-hidden">
                {/* Chart */}
                <div className="flex-shrink-0">
                    <PieChart
                        sx={{ "& .MuiChartsLegend-root": { display: "none" }}}
                        height={190}
                        width={190}
                        colors={currentColors}
                        series={[
                            {
                                data: currentData,
                                innerRadius: 34,
                                outerRadius: 80,
                                paddingAngle: 4,
                                cornerRadius: 4,
                                startAngle: 90,
                                endAngle: 450,
                                cx: 95,
                                cy: 95,
                            }
                        ]}
                        tooltip={{ trigger: 'none' }}
                        skipAnimation={true}
                    />
                </div>

                {/* Legend below chart */}
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 mt-1 px-1">
                    {currentData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded flex-shrink-0"
                                style={{ backgroundColor: currentColors[index % currentColors.length] }}
                            />
                            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{item.label}: {item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}



export default PieChartElement