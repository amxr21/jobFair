import { createContext, useContext, useEffect, useRef, useState } from "react";

import { StudentIcon, CompanyIcon, FieldIcon, SeekerIcon } from "./Icons";

const sample = [
    {
        header: "81",
        subheader: "Registered Students",
        icon: StudentIcon
    },
    {
        header: "36",
        subheader: "Companies",
        icon: CompanyIcon
    },
    {
        header: "8",
        subheader: "CEO’s & Talent seekers",
        icon: SeekerIcon
    },
    {
        header: "10",
        subheader: "Tech fields",
        icon: FieldIcon
    },
            
]



const StatisticsElement = ({data, type}) => {

    const [ icon, setIcon ] = useState(sample[0].icon)
    const [ header, setHeader ] = useState(sample[0].header)
    const [ subheader, setSubheader ] = useState(sample[0].subheader)

    // let managersNumber = 0

    // data['managers'].forEach((manager) => {
    //     managersNumber += manager.representitives?.split(',').length
    // })
    

    const managersNumber = data['managers'].reduce((acc, manager) => {
        return acc + (typeof manager.representitives === 'string'
          ? manager.representitives.split(',').length
          : 0);
      }, 0);
      






    let fieldsNumber = 0
    let unique = new Set([])
    data['managers']?.forEach((company) => {
        if(company.fields != 'Office and Students Fairs'){
            const fieldsArray = company.fields?.split(',').map(field => field.toLowerCase().trim());
        
            console.log(unique);
            fieldsArray?.forEach(field => {
                if (field !== 'Office and Students Fairs') {
                    const normalized = field.replace(/\s+/g, '');
                    unique.add(normalized);
                }
            });

        }
    });
    
    fieldsNumber = unique.size;
    


    useEffect(() => {
        switch(type){
            case 'students':
                setIcon(StudentIcon)
                setHeader(data['applicants'].length)
                setSubheader('Registered Students')
                break;
            
            case 'companies':
                setIcon(CompanyIcon)
                setHeader(data['managers'].length)
                setSubheader('Companies')
                break;
            
            case 'seekers':
                setIcon(SeekerIcon)
                setHeader(managersNumber)
                setSubheader('CEO’s & Talent seekers')
                break;
            
            case 'fields':
                setIcon(FieldIcon)
                setHeader(fieldsNumber)
                setSubheader('Tech fields')
                break;
    
    
        }

    }, [data])




    return (
        <div className="statistics-element col-span-3 flex gap-5 bg-white p-4 rounded-xl">
            <div className="icon">
                <img src={icon} alt={icon} />
            </div>
            <div className="text flex flex-col gap-y-1">
                <h2 className="number text-4xl font-bold">{header}+</h2>
                <h6 className="subtitle text-sm font-medium">{subheader}</h6>
            </div>
        </div>
    )
}


export default StatisticsElement