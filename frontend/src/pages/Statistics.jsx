import { createContext, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";

import { useLocation } from "react-router-dom";

import { BarChartElement, StatisticsElement } from "../components/index";
import { useAuthContext } from "../Hooks/useAuthContext";

import { TopBar, PieChartElement, TopStatistic } from "../components/index";


import { StarIcon, LightningIcon, TrendIcon } from "../components/Icons";




const Statistics = ({link}) => {


    const path = useLocation()


    const [ data, setData ] = useState({applicants: [], managers: []})
    const [ sectors, setSectors ] = useState({})
    const [ number, setNumber ] = useState(0)
    const [ isLoading, setIsLoading ] = useState(false)

    const { user } = useAuthContext()

    const [ mostCompany, setMostCompany ] = useState(['', ''])
    const [ mostField, setMostField ] = useState(['', ''])
    
    const titles = useRef(['students', 'companies', 'seekers', 'fields']).current

    let counts = {}

    const pieData = [
        { id: 0, value: data['applicants'].filter((app) => app.attended).length, label: 'Confirmed' }, 
        { id: 1, value: data['applicants'].filter((app) => !app.attended).length, label: 'Unconfirmed' }, 
    ];
    
    const pieData2 = [
        { id: 0, value: data['managers'].filter((app) => app.confirmed).length, label: 'Confirmed' }, 
        { id: 1, value: data['managers'].filter((app) => !app.confirmed).length, label: 'Unconfirmed' }, 
    ];

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const response1 = await axios.get(link+'/applicants')
                if(response1) {setData(prevData => ({...prevData, applicants: response1.data}))}

                const response2 = await axios.get(link+'/companies')
                if(response2) {setData(prevData => ({...prevData, managers: response2.data}))}


            } catch (error) {
                console.log(error.message);
                   
            }
            finally{
                setIsLoading(false)
            }
        }

        fetchData()
 
    }, [user, path.pathname]) 


    useEffect(() => {
        const countSectors = () => {
            const counts = {}
            
            data['managers'].forEach((company) => {
                company.fields.split(',').map((field) => field.trim().replace(/[^\w\s/-]/g, '').toLowerCase())
                .forEach((field) => {
                    if(Object.keys(counts).includes(field)){
                        // console.log(counts);
                        counts[field] = counts[field] + 1
                    }
                    else{
                        counts[field] = 1
                    }
                })
                 
            })
            
            
            
            
            
            return counts
        }

        console.log('==================================');
        
        
        setSectors(countSectors())
        setMostField(...Object.entries(countSectors()).filter((da) => da[1] == Math.max(...Object.values(countSectors()))))

        const reps = []
        data['managers'].map((da) => da.representitives.split(',')).forEach((d) => {reps.push(...d)})
        // console.log(reps.map((rep) => rep.trim()));


        const representitivesNumber = reps.length

        const applicantsNumber =  data['applicants'].filter((app) => app.attended).length

        const totalNumber = representitivesNumber + applicantsNumber

        
        setNumber(Math.round(totalNumber / 60 * 100))
        
        
    }, [data, user, path.pathname])
    
    
    
    
    
    useEffect(() => {
        if(data['applicants']){
            data['applicants'].forEach((coData) => {
                coData.user_id.forEach((company) => {
                    if(Object.keys(counts).includes(company)){
                        counts[company] = counts[company] + 1
                    } 
                    else{
                        counts[company] = 1
                    }
                    
                })
                
            })
            setMostCompany(Object.entries(counts).filter((entry) => {
                // console.log(entry[1], Math.max(...Object.values(counts).map((num) => parseInt(num))));
                
                return entry[1] == Math.max(...Object.values(counts).map((num) => parseInt(num)))

            })[0])
        }


    }, [data, user, path.pathname])
    


    return (
        <div className="flex flex-col gap-y-8 col-span-10 w-full mx-auto max-h-[92vh]">
            {user?.email != "casto@sharjah.ac.ae" && <TopBar user={user} />}
            <div id="Statistics" className="bg-[#F3F6FF] min-h-[76vh] h-full overflow-y-auto grow rounded-xl px-6 py-4 col-span-10 w-full mx-auto">
                <div className="flex md:flex-row flex-col justify-between items-center ">
                    {/* <h2 className="text-center text-3xl font-bold md:my-0 mb-7">Applicants list</h2> */}
                </div>

                <div className="flex flex-col gap-4 w-full h-full justify-between">
                    <div className="grid grid-cols-12 gap-x-5 h-fit rounded-lg overflow-hidden">
                        {
                            titles.map((type, i) => <StatisticsElement key={i} data={data} type={type} /> )
                        }
                    </div>


                    <div className="grid grid-cols-12 gap-x-5">
                        <PieChartElement dataset={pieData} title={"Applicants"} colorsPair={['#0066CC', '#E5F0FF']} />
                        <PieChartElement dataset={pieData2} title={"Managers"} colorsPair={['#0E7F41', '#E5FFE5']} />


                        <BarChartElement dataset={sectors}/>
                    </div>
                        

                    <div className="grid grid-cols-12 gap-x-5">
                        <TopStatistic title={'Max Capacity'} subtitle={''} data={[number, 'Capacity'] ? [number, 'Capacity'] : ['', '']} icon={<LightningIcon />} />
                        <TopStatistic title={'Top Company by Applications'} subtitle={'Applicants'} data={mostCompany ? mostCompany : ['', '']} icon={<StarIcon />} />
                        <TopStatistic title={'Top Applied Field'} subtitle={'Companies'} data={mostField ? mostField : ['', '']} icon={<TrendIcon />} />
                    </div>

                </div>
 








            </div>
        </div>
    );
};

export default Statistics;




//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG