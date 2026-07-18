import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import useStatsticsFilter from "../hooks/useStatsticsFilter"

const FieldFilter = ({dataCategory}) => {
  const { t } = useTranslation();

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
            <InputLabel id="demo-simple-select-label" sx={{ fontSize: '0.8rem' }}>{t("statistics.filter.dataLabel")}</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={dataType}
              label={t("statistics.filter.dataLabel")}
              onChange={handleChange}
              sx={{ height: 36, fontSize: '0.85rem' }}
            >
              <MenuItem value={'Applicants'} sx={{ fontSize: '0.85rem' }}>{t("statistics.filter.applicants")}</MenuItem>
              <MenuItem value={'Managers'} sx={{ fontSize: '0.85rem' }}>{t("statistics.filter.managers")}</MenuItem>
            </Select>
          </>
          :
          <>
            <InputLabel id="demo-simple-select-label" sx={{ fontSize: '0.8rem' }}>{t("statistics.filter.typeLabel")}</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={dataCategoryType}
              label={t("statistics.filter.typeLabel")}
              onChange={handleChange2}
              sx={{ height: 36, fontSize: '0.85rem' }}
            >
              <MenuItem value={'cities'} sx={{ fontSize: '0.85rem' }}>{t("statistics.filter.cities")}</MenuItem>
              <MenuItem value={'sectors'} sx={{ fontSize: '0.85rem' }}>{t("statistics.filter.sectors")}</MenuItem>
            </Select>
          </>
        }
      </FormControl>
    </Box>
  );
}


export default FieldFilter