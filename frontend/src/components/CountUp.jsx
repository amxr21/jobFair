import { useEffect, useState, useRef } from 'react';

const CountUp = ({
    end,
    duration = 2000,
    suffix = '',
    prefix = '',
    decimals = 0,
    className = ''
}) => {
    const [count, setCount] = useState(0);
    const countRef = useRef(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        // Reset if end value changes
        if (end === 0 || end === undefined || end === null) {
            setCount(0);
            return;
        }

        // Don't re-animate if already done for this value
        if (hasAnimated.current && count === end) return;

        const startTime = performance.now();
        const startValue = 0;
        const endValue = typeof end === 'string' ? parseFloat(end) : end;

        if (isNaN(endValue)) {
            setCount(end);
            return;
        }

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const easeOut = 1 - Math.pow(1 - progress, 3);

            const currentValue = startValue + (endValue - startValue) * easeOut;

            if (decimals > 0) {
                setCount(currentValue.toFixed(decimals));
            } else {
                setCount(Math.floor(currentValue));
            }

            if (progress < 1) {
                countRef.current = requestAnimationFrame(animate);
            } else {
                hasAnimated.current = true;
                if (decimals > 0) {
                    setCount(endValue.toFixed(decimals));
                } else {
                    setCount(endValue);
                }
            }
        };

        countRef.current = requestAnimationFrame(animate);

        return () => {
            if (countRef.current) {
                cancelAnimationFrame(countRef.current);
            }
        };
    }, [end, duration, decimals]);

    return (
        <span className={className}>
            {prefix}{count}{suffix}
        </span>
    );
};

export default CountUp;
