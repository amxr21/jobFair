import { PieChart } from '@mui/x-charts/PieChart';

import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const ResponsesPieChart = ({data, res, unres}) => {

    const { t } = useTranslation()

    const companiesNumber = data ? useRef(data?.length)?.current : []

    const companiesResponded = data ? useRef(data?.filter((comp) => comp.surveyResult.length != 0))?.current.length : []


    let colors = ["#0E7F41", "#E5FFE5"]
    return (
        <div className="bg-surface-card text-fg rounded-xl px-4 py-4 flex flex-row items-center gap-4 border border-line h-full">
            <PieChart
                height={180}
                width={180}
                colors={colors}
                series={[
                {
                    data: [
                        { id: 0, value: res, label: t("survey.responded") },
                        { id: 1, value: unres, label: t("survey.didntRespond") },
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
                    <span className="text-sm font-medium">{t("survey.responded")}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[1] }}></div>
                    <span className="text-sm font-medium">{t("survey.didntRespond")}</span>
                </div>
            </div>
        </div>
    )
}


export default ResponsesPieChart