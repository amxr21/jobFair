import { PieChart } from '@mui/x-charts/PieChart';

import { useRef } from 'react';

const ResponsesPieChart = ({data, res, unres}) => {

    const companiesNumber = data ? useRef(data?.length)?.current : []

    const companiesResponded = data ? useRef(data?.filter((comp) => comp.surveyResult.length != 0))?.current.length : []


    let colors = ["#0E7F41", "#E5FFE5"]
    return (
        <div className="bg-white rounded-xl px-4 py-4 flex flex-row items-center gap-4 border h-full">
            <PieChart
                height={180}
                width={180}
                colors={colors}
                series={[
                {
                    data: [
                        { id: 0, value: res, label: 'Responded' },
                        { id: 1, value: unres, label: "Didn't respond" },
                    ],
                    innerRadius: 35,
                    outerRadius: 75,
                    paddingAngle: 4,
                    cornerRadius: 4,
                    startAngle: 0,
                    endAngle: 360,
                    cx: 90, cy: 90,

                }
            ]}
            legend={{ hidden: true }}
            />
            <div className='flex flex-col gap-3'>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[0] }}></div>
                    <span className="text-sm font-medium">Responded</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[1] }}></div>
                    <span className="text-sm font-medium">Didn't respond</span>
                </div>
            </div>
        </div>
    )
}


export default ResponsesPieChart