import React, { useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const data = {
  bySector: {
    labels: ['Sector A', 'Sector B', 'Sector C'],
    datasets: [{
      data: [300, 50, 100],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
    }],
  },
  byTypeB: {
    labels: ['Type B1', 'Type B2', 'Type B3'],
    datasets: [{
      data: [200, 150, 50],
      backgroundColor: ['#FF5733', '#33FF57', '#3357FF'],
    }],
  },
  byColleges: {
    labels: ['College X', 'College Y', 'College Z'],
    datasets: [{
      data: [400, 300, 200],
      backgroundColor: ['#FF5733', '#33FF57', '#3357FF'],
    }],
  },
};

const ChartWithFilter = () => {
  const [filter, setFilter] = useState('bySector');

  const handleChange = (event) => {
    setFilter(event.target.value);
  };

  return (
    <div>
      <FormControl fullWidth>
        <InputLabel>Filter</InputLabel>
        <Select
          value={filter}
          label="Filter"
          onChange={handleChange}
        >
          <MenuItem value="bySector">By Sector</MenuItem>
          <MenuItem value="byTypeB">By Type B</MenuItem>
          <MenuItem value="byColleges">By Colleges</MenuItem>
        </Select>
      </FormControl>
      <Pie data={data[filter]} className='bg-red-500 max-w-40 max-h-40' />
    </div>
  );
};

export default ChartWithFilter;
