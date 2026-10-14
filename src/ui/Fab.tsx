// design.md + Button: 48px circle, 18px from the right edge, 74px from the bottom.
export function Fab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Add"
      onClick={onClick}
      className="fixed right-[max(18px,calc((100vw-480px)/2+18px))] bottom-[calc(74px+env(safe-area-inset-bottom))] z-30 flex size-12 items-center justify-center rounded-full bg-brand text-[26px] leading-none font-normal text-btn-ink shadow-fab"
    >
      +
    </button>
  )
}
