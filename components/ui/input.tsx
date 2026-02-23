import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, onChange, onFocus, onBlur, ...props }, ref) => {
    const isNumber = type === "number";

    // For number inputs: maintain a local string buffer so the user can freely
    // clear the field (e.g. backspace over "0") without the value snapping back.
    // The parent's numeric state still drives the display when the field is not focused.
    const [displayValue, setDisplayValue] = React.useState<string>(() => {
      if (!isNumber) return "";
      return value !== undefined && value !== null && value !== "" ? String(value) : "";
    });

    const isFocused = React.useRef(false);

    // Sync parent value → display whenever the field is not actively being edited
    React.useEffect(() => {
      if (!isNumber || isFocused.current) return;
      const next =
        value !== undefined && value !== null && value !== ""
          ? String(value)
          : "";
      setDisplayValue(next);
    }, [value, isNumber]);

    if (isNumber) {
      return (
        <input
          {...props}
          type="number"
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          value={displayValue}
          onChange={(e) => {
            setDisplayValue(e.target.value);
            onChange?.(e);
          }}
          onFocus={(e) => {
            isFocused.current = true;
            onFocus?.(e);
          }}
          onBlur={(e) => {
            isFocused.current = false;
            // If left empty after editing, show "0" so the field never appears blank
            if (displayValue === "") {
              setDisplayValue("0");
            }
            onBlur?.(e);
          }}
        />
      );
    }

    return (
      <input
        {...props}
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    );
  }
)
Input.displayName = "Input"

export { Input }
