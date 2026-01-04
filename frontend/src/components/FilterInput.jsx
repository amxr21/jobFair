import { useRef } from "react";
import { useFiltersContext } from "../Context/FiltersContext"

const FilterInput = ({label}) => {
    const { updateFilter } = useFiltersContext();
    const checkIt = useRef();

    const filterChecked = () => {
        let checkedFilter = checkIt.current;
        if(checkedFilter.checked){
            updateFilter(checkedFilter.id)
        }
    }

    return (
        <div className="filter-input mx-2 z-39">
            <input ref={checkIt} onChange={filterChecked} className="" type="checkbox" name={label} id={label} />
            <label className="ml-2" htmlFor={label}>{label}</label>
        </div>
    )
}

export default FilterInput;
