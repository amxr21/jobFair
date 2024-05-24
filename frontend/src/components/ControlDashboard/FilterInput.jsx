import { useContext, useReducer, useRef } from "react";
import { FiltersContext, useFiltersContext, FiltersProvider } from "../../Context/FiltersContext"

const FilterInput = ({label}) => {

    const { filter, updateFilter } = useFiltersContext();
    const checkIt = useRef();



    //NOT WORLING NOW, MOVE TO CREATE A PAGE FOR EACH COMPANY. NOT WORLING NOW, MOVE TO CREATE A PAGE FOR EACH COMPANY.
    //NOT WORLING NOW, MOVE TO CREATE A PAGE FOR EACH COMPANY. NOT WORLING NOW, MOVE TO CREATE A PAGE FOR EACH COMPANY.
    //NOT WORLING NOW, MOVE TO CREATE A PAGE FOR EACH COMPANY. NOT WORLING NOW, MOVE TO CREATE A PAGE FOR EACH COMPANY.
    const filterChecked = () => {
        let checkedFilter = checkIt.current;
        if(checkedFilter.checked){
            updateFilter(checkedFilter.id)
        }
        console.log(filter);
    }


    return (
        <div className="filter-input mx-2 z-39">
            <input ref={checkIt} onChange={filterChecked} className="" type="checkbox" name={label} id={label} />
            <label className="ml-2" htmlFor={label}>{label}</label>
        </div>
    )
}

export default FilterInput;




// import { useFiltersContext } from "./MainBanner";
// import { useContext } from "react";

// const FilterInput = ({label}) => {
//     const { filters, updateFilters } = useFiltersContext();

//     const filter = () => {
//         const checkedFilters = [...document.getElementsByClassName("filter-input")].filter(filter => filter.firstElementChild.checked);
//         const filterValues = checkedFilters.map(filter => filter.firstElementChild.id);
//         updateFilters(filterValues);
//         console.log(filters);
//     }

//     return (
//         <div className="filter-input mx-2 z-[9999]">
//             <input onChange={filter} className="" type="checkbox" name={label} id={label} />
//             <label className="ml-2" htmlFor={label}>{label}</label>
//         </div>
//     );
// }

// export default FilterInput;
