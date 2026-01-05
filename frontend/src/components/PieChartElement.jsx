import { PieChart } from '@mui/x-charts/PieChart';
import { ChartTitle } from './index';

import { FieldFilter } from "./index"
import useStatsticsFilter from '../Hooks/useStatsticsFilter';

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
        <div className="col-span-1 lg:col-span-3 bg-white rounded-xl p-3 md:p-4 flex flex-col w-full h-full overflow-hidden min-h-[280px]">
            {/* Header with title and filter in same row */}
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-gray-700">{title}</h2>
                <FieldFilter dataCategory={dataCategory} />
            </div>

            <div className="flex flex-col items-center justify-center flex-1 min-h-0 overflow-hidden">
                {/* Chart */}
                <div className="flex-shrink-0">
                    <PieChart
                        sx={{ "& .MuiChartsLegend-root": { display: "none" }}}
                        height={200}
                        width={200}
                        colors={currentColors}
                        series={[
                            {
                                data: currentData,
                                innerRadius: 35,
                                outerRadius: 85,
                                paddingAngle: 4,
                                cornerRadius: 4,
                                startAngle: 90,
                                endAngle: 450,
                                cx: 100,
                                cy: 100,
                            }
                        ]}
                        tooltip={{ trigger: 'none' }}
                        skipAnimation={true}
                    />
                </div>

                {/* Legend below chart */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 px-2">
                    {currentData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded flex-shrink-0"
                                style={{ backgroundColor: currentColors[index % currentColors.length] }}
                            />
                            <span className="text-xs font-medium">{item.label}: {item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}



export default PieChartElement