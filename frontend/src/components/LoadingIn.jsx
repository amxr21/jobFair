import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';


const LoadingIn = () => {
    return (
        <div className="absolute top-0 left-0 bg-white w-full h-full p-10 flex flex-col gap-y-16 items-center justify-center text-5xl font-bold">
            <h2>Signing you In...</h2>
            <Box sx={{ width: '16rem' }}>
                <LinearProgress color='success' />
            </Box>
        </div>
    )
}


export default LoadingIn