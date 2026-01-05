import * as React from 'react';
import { useRef, useState, useEffect } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { ChartTitle } from './index';


const BarChartElement = ({dataset}) => {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 550, height: 300 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                // Account for padding (p-5 = 20px on each side)
                setDimensions({
                    width: Math.max(width - 40, 100),
                    height: Math.max(height - 80, 150) // Leave room for title
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        // Use ResizeObserver for more accurate container tracking
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener('resize', updateDimensions);
            resizeObserver.disconnect();
        };
    }, []);

    const colorsCodes = [
        '#0066CC', '#0E7F41', '#CC0000', '#EBC600',
        '#00B4D8', '#2ebf52', '#30be50', '#32bd4e',
        '#34bc4c', '#36bb4a'
      ]

    return(
        <div ref={containerRef} className="col-span-1 lg:col-span-6 bg-white rounded-xl p-3 md:p-5 flex flex-col gap-x-0 w-full h-full overflow-hidden min-h-[280px]">
            <BarChart
                width={dimensions.width}
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
                height={dimensions.height}
                borderRadius={5}

                barLabel="value"
            />
            <ChartTitle title={'Companies By Sector'} padding={''} />
        </div>
    )
}


export default BarChartElement