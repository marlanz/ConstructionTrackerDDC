import * as React from "react";

interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: number;
}

export function AspectRatio({
  ratio = 1 / 1,
  className,
  style,
  children,
  ...props
}: AspectRatioProps) {
  return (
    <div
      className={`relative w-full overflow-hidden ${className || ""}`}
      style={{
        paddingBottom: `${(1 / ratio) * 100}%`,
        ...style,
      }}
      {...props}
    >
      <div className="absolute inset-0 h-full w-full">{children}</div>
    </div>
  );
}
