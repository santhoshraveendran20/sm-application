import { useEffect, useRef } from "react";

function IndeterminateCheckbox({ indeterminate, ...props }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return <input type="checkbox" ref={ref} {...props} />;
}

export default IndeterminateCheckbox;
