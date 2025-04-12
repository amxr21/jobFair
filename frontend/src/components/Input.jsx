const Input = ({Id, Type, Value, handleChange, Name}) => {
    return <input
        id={Id}
        type={Type}
        value={Value}
        onChange={handleChange}
        placeholder={Name}
        className="w-full p-3 text-lg border rounded-2xl mb-1 font-regular"
    />
}


export default Input