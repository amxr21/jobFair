import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import useStatsticsFilter from "../Hooks/useStatsticsFilter"

const FieldFilter = ({dataCategory}) => {
  
  const { statsticType, updateFilter, categoryType, updateCategory } = useStatsticsFilter()

  const [dataType, setDataType] = useState('Applicants');
  const [dataCategoryType, setDataCategoryType] = useState('cities');

  const handleChange = (event) => {
    setDataType(event.target.value);
    updateFilter(event.target.value)
  };

  const handleChange2 = (event) => {
    setDataCategoryType(event.target.value);
    updateCategory(event.target.value);
  };


  

  return (
    <Box sx={{ minWidth: 100 }}>
      <FormControl fullWidth size="small">
        {
          dataCategory == 'applicants_companies'
          ?
          <>
            <InputLabel id="demo-simple-select-label" sx={{ fontSize: '0.8rem' }}>Data</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={dataType}
              label="Data"
              onChange={handleChange}
              sx={{ height: 36, fontSize: '0.85rem' }}
            >
              <MenuItem value={'Applicants'} sx={{ fontSize: '0.85rem' }}>Applicants</MenuItem>
              <MenuItem value={'Managers'} sx={{ fontSize: '0.85rem' }}>Managers</MenuItem>
            </Select>
          </>
          :
          <>
            <InputLabel id="demo-simple-select-label" sx={{ fontSize: '0.8rem' }}>Type</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={dataCategoryType}
              label="Type"
              onChange={handleChange2}
              sx={{ height: 36, fontSize: '0.85rem' }}
            >
              <MenuItem value={'cities'} sx={{ fontSize: '0.85rem' }}>Cities</MenuItem>
              <MenuItem value={'sectors'} sx={{ fontSize: '0.85rem' }}>Sectors</MenuItem>
            </Select>
          </>
        }
      </FormControl>
    </Box>
  );
}


export default FieldFilter