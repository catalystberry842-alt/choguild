export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-6 text-sm text-body">
      <span
        className="size-4 animate-spin rounded-full border-2 border-line border-t-sand"
        aria-hidden="true"
      />
      {label}
    </div>
  );
}
