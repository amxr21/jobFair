const ModeButton = ({text = '', func, extraClasses = '', destination}) => {
    return (
        <button className={` px-2 py-3 ${extraClasses}`} onClick={() => {func(destination)}}>{text}</button>
    )
}

export default ModeButton;