interface Props {
  isLightMode: boolean;
}

function Shimmer({ isLightMode, className }: { isLightMode: boolean; className: string }) {
  return (
    <div
      className={`${className} ${isLightMode ? 'bg-neutral-200' : 'bg-neutral-800'} rounded-xl overflow-hidden relative`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export function FeaturedSkeleton({ isLightMode }: Props) {
  return (
    <div className="flex-shrink-0 w-[280px] snap-start">
      <div className={`rounded-3xl overflow-hidden ${isLightMode ? 'bg-neutral-200' : 'bg-neutral-800'} relative`}>
        <Shimmer isLightMode={isLightMode} className="h-[320px] w-full rounded-none" />
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <Shimmer isLightMode={isLightMode} className="h-4 w-20" />
          <Shimmer isLightMode={isLightMode} className="h-6 w-48" />
          <Shimmer isLightMode={isLightMode} className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

export function EventRowSkeleton({ isLightMode }: Props) {
  return (
    <div className={`flex gap-3 p-3 rounded-2xl ${isLightMode ? 'bg-neutral-100' : 'bg-neutral-900'}`}>
      <Shimmer isLightMode={isLightMode} className="w-20 h-20 flex-shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2 py-1">
        <Shimmer isLightMode={isLightMode} className="h-4 w-16" />
        <Shimmer isLightMode={isLightMode} className="h-5 w-full" />
        <Shimmer isLightMode={isLightMode} className="h-4 w-3/4" />
      </div>
    </div>
  );
}
