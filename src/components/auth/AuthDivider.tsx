export function AuthDivider({ text = 'or' }: { text?: string }) {
  return (
    <div className="relative flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[#E2DAD0]" />
      <span className="text-xs font-medium text-[#9A8F84] px-1 uppercase tracking-widest">{text}</span>
      <div className="flex-1 h-px bg-[#E2DAD0]" />
    </div>
  )
}
