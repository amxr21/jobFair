import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { useTranslation } from "react-i18next";


const LoadingIn = () => {
    const { t } = useTranslation();
    return (
        <div className="absolute top-0 start-0 bg-surface-card text-fg w-full h-full p-10 flex flex-col gap-y-16 items-center justify-center text-5xl font-bold">
            <h2>{t("common.signingYouIn")}</h2>
            <Box sx={{ width: '16rem' }}>
                <LinearProgress color='success' />
            </Box>
        </div>
    )
}


export default LoadingIn