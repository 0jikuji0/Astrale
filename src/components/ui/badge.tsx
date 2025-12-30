import React from "react";
import clsx from "clsx";

export type BadgeVariant = "solid" | "outline" | "subtle";

export type BadgeColor = "transparent" | "purple" | "blue" | "green" | "red";

export interface BadgeProps {
  children?: React.ReactNode;
  text?: string;
  color?: BadgeColor;
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

const colorMap: Record<BadgeColor, Record<BadgeVariant, string>> = {
  transparent: {
    solid: "bg-gray-500",
    outline: "border-gray-500",
    subtle: "bg-gray-100",
  },
  blue: {
    solid: "bg-blue-500",
    outline: "border-blue-500 text-blue-500",
    subtle: "bg-blue-100 text-blue-800",
  },
  purple: {
    solid: "bg-purple-500",
    outline: "border-purple-500 text-purple-500",
    subtle: "bg-purple-100 text-purple-800",
  },
  green: {
    solid: "bg-green-500",
    outline: "border-green-500 text-green-500",
    subtle: "bg-green-100 text-green-800",
  },
  red: {
    solid: "bg-red-500",
    outline: "border-red-500 text-red-500",
    subtle: "bg-red-100 text-red-800",
  },
};

const Badge: React.FC<BadgeProps> = ({
  children,
  text,
  color = "transparent",
  variant = "solid",
  className = "",
}) => {
  const colorStyle = colorMap[color]?.[variant] || "";
  const variantStyle = variantStyles[variant];

  return (
    <span className={clsx(baseStyles, variantStyle, colorStyle, className)}>
      {children ?? text}
    </span>
  );
};

export default Badge;
