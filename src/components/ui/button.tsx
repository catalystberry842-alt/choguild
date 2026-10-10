import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-[background-color,box-shadow,filter,transform] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "btn-glow bg-action text-on-accent",
        secondary: "border border-line bg-elevated/60 text-ink hover:border-sand/50 hover:bg-secondary",
        ghost: "bg-transparent text-body hover:bg-elevated hover:text-ink",
      },
      size: {
        md: "min-h-11 px-4 text-sm",
        compact: "min-h-9 px-3 text-sm",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type })}
      {...props}
    />
  );
}
