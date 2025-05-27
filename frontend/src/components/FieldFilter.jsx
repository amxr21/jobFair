import * as React from 'react';
import { useEffect } from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import useStatsticsFilter from "../Hooks/useStatsticsFilter"

const FieldFilter = () => {
  
  const { statsticType, updateFilter } = useStatsticsFilter()

  const [age, setAge] = React.useState('Applicants');

  const handleChange = (event) => {
    setAge(event.target.value);
    
    updateFilter(event.target.value)


  };

  useEffect(() => {
    console.log(statsticType);
    
  }, [statsticType])


  console.log(statsticType);
  


  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Age</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={age}
          label="Age"
          onChange={handleChange}
        >
          <MenuItem value={'Applicants'}>Applicants</MenuItem>
          <MenuItem value={'Managers'}>Managers</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}


export default FieldFilter