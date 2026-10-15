import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] whitespace-nowrap transition-[background-color,border-color,box-shadow,filter,transform] duration-200 hover:-translate-y-px active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "btn-accent btn-glow text-on-accent",
        secondary: "border border-white/10 bg-white/[0.04] text-ink backdrop-blur hover:border-white/20 hover:bg-white/[0.07]",
        ghost: "bg-transparent text-body hover:bg-elevated hover:text-ink",
      },
      size: {
        md: "min-h-11 px-5 text-sm",
        compact: "min-h-9 px-4 text-sm",
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
