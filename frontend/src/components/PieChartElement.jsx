import { PieChart } from '@mui/x-charts/PieChart';
import { ChartTitle } from './index';


const PieChartElement = ({title, dataset, colorsPair = ['#0066CC', '#0E7F41']}) => {
    return (
        <div className="col-span-3 bg-white rounded-xl p-4 flex flex-col gap-x-0 w-full">
            <PieChart
                sx={{ "& .MuiChartsLegend-root": { display: "none" }, display: 'flex', flexDirection: 'column', alignItems: 'center'}}
                className=""
                height={250}
                width={280}
                colors={colorsPair} 
                series={[
                    {
                        data: dataset ,
                        innerRadius: 40,
                        outerRadius: 100,
                        paddingAngle: 4,
                        cornerRadius: 4,
                        startAngle: 90,
                        endAngle: 450,
                        color: 'red',
                        cx: 135,
                        cy: 100,
                    }
                ]}
            />
            <div className="flex justify-center gap-4">
                {dataset.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: colorsPair[index] }} // Assign color
                    />
                    <span className="text-sm font-medium">{item.label}</span> {/* Show label */}
                </div>
                ))}
            </div>
            <ChartTitle title={title} />
        </div>
    )
}



export default PieChartElement