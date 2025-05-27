import { PieChart } from '@mui/x-charts/PieChart';

import { LegendLabel } from "./index"
import { useRef } from 'react';

const ResponsesPieChart = ({data}) => {
    
    const companiesNumber = data ? useRef(data?.length)?.current : []
 
    const companiesResponded = data ? useRef(data?.filter((comp) => comp.surveyResult.length != 0))?.current.length : []
    

    console.log(companiesNumber,companiesResponded);
    

    let colors = ["#0E7F41", "#E5FFE5"]
    return (
        <div className="bg-white rounded-xl py-0 flex items-center border min-w-[30rem]">
            <PieChart
                height={240}
                 
                colors={colors}
                className="min-w-64 flex items-start"
                series={[
                {
                    data: [
                        { id: 0, value: companiesResponded, label: 'Option 1' },
                        { id: 1, value: companiesNumber, label: 'Option 2' }, 
                    ],
                    innerRadius: 40,
                    outerRadius: 100,
                    paddingAngle: 4,
                    cornerRadius: 4,
                    startAngle: 0,
                    endAngle: 360,
                    color: 'red',
                    cx: 120, cy : 110,
                    
                }
            ]}
            legend={{ hidden: true }}
            />
            <div className='flex flex-col gap-2 w-full pr-6'>
                <LegendLabel legendText={"Responded"} colors={colors[0]} />
                <LegendLabel legendText={"Didn't respond"} colors={colors[1]} />

            </div>

        </div>
    )
}


export default ResponsesPieChart