import * as React from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { ArrowRight } from "lucide-react";

interface URLInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onSubmit"> {
  onSubmit?: (url: string) => void;
  buttonText?: string;
  showButton?: boolean;
  containerClassName?: string;
}

const URLInput = React.forwardRef<HTMLInputElement, URLInputProps>(
  (
    {
      className,
      containerClassName,
      onSubmit,
      buttonText = "Transform",
      showButton = true,
      placeholder = "Paste any URL...",
      ...props
    },
    ref
  ) => {
    const [value, setValue] = React.useState("");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (value.trim() && onSubmit) {
        onSubmit(value.trim());
      }
    };

    return (
      <form
        onSubmit={handleSubmit}
        className={cn("flex gap-3 w-full", containerClassName)}
      >
        <div className="relative flex-1">
          <Input
            ref={ref}
            type="url"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "h-12 px-4 text-[15px] font-semibold font-mono",
              className
            )}
            {...props}
          />
        </div>
        {showButton && (
          <Button
            type="submit"
            size="default"
            disabled={!value.trim()}
            className="gap-2"
          >
            {buttonText}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </form>
    );
  }
);

URLInput.displayName = "URLInput";

export { URLInput };
