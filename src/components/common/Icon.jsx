import React from "react";
import * as LucideIcons from "lucide-react";

/**
 * Lucide icon wrapper to keep icon usage consistent and swappable.
 *
 * Usage:
 * <Icon name="Pencil" size={16} />
 */
function Icon({ name, size = 20, strokeWidth = 2.5, className = "", ...rest }) {
  const LucideIcon = LucideIcons[name] || LucideIcons.HelpCircle;
  return <LucideIcon size={size} strokeWidth={strokeWidth} className={className} {...rest} />;
}

export default Icon;

