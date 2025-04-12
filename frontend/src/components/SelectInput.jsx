const SelectInput = ({ Id, Name, options = [], value, handleChange }) => {
    return (
      <div className="w-full">
        <label htmlFor={Id} className="text-sm text-gray-600 ml-1">
          {Name}
        </label>
        <select
          id={Id}
          value={value}
          onChange={handleChange}
          className="w-full p-3 text-lg border rounded-2xl mb-1 font-regular"
        >
          <option value="" disabled>
            Select {Name}
          </option>
          {options.map((opt, idx) => (
            <option key={idx} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  };
  
  export default SelectInput;
  