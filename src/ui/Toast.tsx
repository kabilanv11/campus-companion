// design.md Toast: Ink pill, Canvas text, the action in bold.
export function ToastPill({
  message,
  action,
  onAction,
}: {
  message: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div
      role="status"
      className="mx-auto flex w-max max-w-[calc(100vw-36px)] items-center gap-3 rounded-full bg-ink px-[18px] py-2.5 text-[13px] text-canvas"
    >
      <span>{message}</span>
      {action && (
        <button type="button" onClick={onAction} className="font-bold">
          {action}
        </button>
      )}
    </div>
  )
}
