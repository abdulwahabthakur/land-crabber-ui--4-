type MapRunner = {
  id: string
  name: string
  color: string
  distance: number
  avatar: string
}

type RunnerMarker3DProps = {
  runner: MapRunner
  isLeader?: boolean
}

export const RunnerMarker3D = ({ runner, isLeader = false }: RunnerMarker3DProps) => (
  <div className="relative group cursor-pointer" style={{ transform: "translate(-50%, -100%)" }}>
    {/* Pulse effect for the leader or active runner */}
    <div
      className="absolute inset-0 rounded-full bg-white opacity-0 animate-ping"
      style={{ animationDuration: "2s" }}
    />

    {/* Dynamic Ground Shadow that scales with the bobbing animation */}
    <div
      className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-8 h-2 bg-black/20 rounded-[100%] blur-[2px] transition-transform duration-[2000ms] animate-pulse"
      style={{ zIndex: -2 }}
    />

    {/* Bouncing Container */}
    <div className="animate-float" style={{ animationDuration: "2s" }}>
      {/* 3D Pin Body - Made thicker and more distinct */}
      <div
        className="relative w-14 h-14 rounded-full flex items-center justify-center bg-white shadow-[0_4px_0_rgba(0,0,0,0.2),0_8px_16px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-2"
        style={{
          border: `5px solid ${runner.color}`,
          backgroundColor: "white",
        }}
      >
        <span className="text-3xl filter drop-shadow-sm transform group-hover:scale-110 transition-transform">
          {runner.avatar}
        </span>

        {/* 3D Shine reflection */}
        <div className="absolute top-2 right-2 w-4 h-2 bg-white/40 rounded-full -rotate-45" />
      </div>

      {/* Triangle/Arrow pointing down */}
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-white rotate-45 border-r-[5px] border-b-[5px] rounded-sm"
        style={{
          borderColor: runner.color,
          zIndex: -1,
          boxShadow: "2px 2px 2px rgba(0,0,0,0.1)",
        }}
      />
    </div>

    {/* Name Tag (Visible on Hover) */}
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/20 z-50">
      {runner.name}
    </div>
  </div>
)
