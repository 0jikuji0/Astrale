import React from "react";
import clsx from "clsx";

export type BadgeVariant = "solid" | "outline" | "subtle";
export type BadgeColor = "transparent" | "blue" | "fuchsia" | "pink";

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
    solid: "bg-[#2E96F5]",
    outline: "border-blue-500 text-blue-500",
    subtle: "bg-blue-100 text-blue-800",
  },
  fuchsia: {
    solid: "bg-fuchsia-500 text-white",
    outline: "border-fuchsia-200 text-fuchsia-500",
    subtle: "bg-fuchsia-100 text-fuchsia-800",
  },
  pink: {
    solid: "bg-pink-500 text-white",
    outline: "border-pink-500 text-pink-500",
    subtle: "bg-pink-100 text-pink-800",
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
