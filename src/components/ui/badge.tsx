import React from "react";
import clsx from "clsx";

export type BadgeVariant = "solid" | "outline" | "subtle";

export interface BadgeProps {
  text: string;
  color?: "transparent" | "Purple" | "blue" | "green" | "red";
  variant?: BadgeVariant;
  className?: string;
}

const baseStyles =
  "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-200";

const variantStyles: Record<BadgeVariant, string> = {
  solid: "text-white",
  outline: "bg-transparent border",
  subtle: "text-gray-800 bg-gray-200",
};

const colorMap: Record<string, Record<BadgeVariant, string>> = {
  transparent: {
    solid: "bg-gray-500",
    outline: "bg-transparent border-gray-500",
    subtle: "bg-gray-100",
  },
  blue: {
    solid: "bg-blue-500",
    outline: "bg-transparent border-blue-500",
    subtle: "bg-blue-100",
  },
  purpe: {
    solid: "bg-purple-500",
    outline: "bg-transparent border-purple-500",
    subtle: "bg-purple-100",
  },
  green: {
    solid: "bg-green-500",
    outline: "bg-transparent border-green-500",
    subtle: "bg-green-100",
  },
  red: {
    solid: "bg-red-500",
    outline: "bg-transparent border-red-500",
    subtle: "bg-red-100",
  },
};

const Badge: React.FC<BadgeProps> = ({
  text,
  color = "transparent",
  variant = "solid",
  className = "",
}) => {
  const colorStyle = colorMap[color]?.[variant] || "";
  const variantStyle = variantStyles[variant];

  return (
    <span className={clsx(baseStyles, variantStyle, colorStyle, className)}>
      {text}
    </span>
  );
};

export default Badge;
