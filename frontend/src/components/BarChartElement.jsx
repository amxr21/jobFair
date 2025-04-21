import * as React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { ChartTitle } from './index';


const BarChartElement = ({dataset}) => {

    const colorsCodes = [
        '#0066CC', '#0E7F41', '#CC0000', '#EBC600',
        '#00B4D8', '#2ebf52', '#30be50', '#32bd4e',
        '#34bc4c', '#36bb4a'
      ]

    return(
        <div className="col-span-6 bg-white rounded-xl p-5 flex flex-col gap-x-0 w-full overflow-hidden">
            <BarChart
                width={550} 
                xAxis=
                {
                    [{
                        scaleType: 'band', data: Object.keys(dataset).slice(1), padding: 0.1,
                        colorMap: {
                            type: 'ordinal',
                            colors: colorsCodes
                          }
                    }]
                }
                series={[{ data: Object.values(dataset).slice(1), barSize: 20 }]}
                colors = {colorsCodes}
                height={300}
                borderRadius={5}
                
                barLabel="value"
            />
            <ChartTitle title={'Companies By Sector'} padding={''} />
        </div>
    )
}


export default BarChartElement