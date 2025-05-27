import { PieChart } from '@mui/x-charts/PieChart';
import { ChartTitle } from './index';

import { FieldFilter } from "./index"
import useStatsticsFilter from '../Hooks/useStatsticsFilter';

const PieChartElement = ({title, dataset, colorsPair}) => {

    const { statsticType } = useStatsticsFilter()



    return (
        <div className="col-span-3 bg-white rounded-xl p-4 flex flex-col gap-x-0 w-full">
            <FieldFilter />
            <PieChart
                sx={{ "& .MuiChartsLegend-root": { display: "none" }, display: 'flex', flexDirection: 'column', alignItems: 'center'}}
                className=""
                height={280}
                width={280}
                colors={statsticType == "Managers" ? ["#0E7F41", "#E5FFE5"] : ["#0066CC", "#E5F0FF"] } 
                series={[
                    {
                        data: statsticType == "Managers" ? dataset[1] : dataset[0] ,
                        innerRadius: 40,
                        outerRadius: 100,
                        paddingAngle: 4,
                        cornerRadius: 4,
                        startAngle: 90,
                        endAngle: 450,
                        color: 'red',
                        cx: 140, 
                    }
                ]}
            />
            <div className="flex justify-center gap-4">
                {
                    statsticType == "Managers" 
                    ?
                    dataset[0].map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                        <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: statsticType == "Managers" ? colorsPair[0][index] : colorsPair[1][index] }} // Assign color
                        />
                        <span className="text-sm font-medium">{item.label}</span> {/* Show label */}
                    </div>
                    ))
                    :
                    dataset[1].map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                        <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: statsticType == "Managers" ? colorsPair[0][index] : colorsPair[1][index] }} // Assign color
                        />
                        <span className="text-sm font-medium">{item.label}</span> {/* Show label */}
                    </div>
                    ))
                }
            </div>
            <ChartTitle title={title} />
        </div>
    )
}



export default PieChartElement