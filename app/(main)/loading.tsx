import { Header } from "@/components/layout/Header"

export default function MainLoading() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden animate-in fade-in duration-150">
      <Header />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-32 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-64 rounded-md bg-muted/80 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              <div className="h-8 w-14 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="h-5 w-24 rounded bg-muted animate-pulse" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-24 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
