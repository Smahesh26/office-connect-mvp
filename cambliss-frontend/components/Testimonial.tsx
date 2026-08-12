export function Testimonial() {
  return (
    <div className="relative overflow-hidden bg-brand-strong py-32">
      {/* Background decoration */}
      <div className="absolute -right-64 -top-64 h-[600px] w-[600px] rounded-full bg-brand-soft/20 blur-3xl pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <blockquote className="mb-10 text-2xl font-semibold leading-relaxed tracking-tight text-white md:text-3xl lg:text-4xl">
          "We replaced four separate tools with Office Connect in a single afternoon. HRM and CRM alone paid for the switch — the 90 days free just made the decision easy."
        </blockquote>
        
        <div className="flex items-center justify-center gap-4">
          <div className="h-12 w-12 rounded-full bg-brand-soft"></div>
          <div className="text-left">
            <div className="font-bold text-white">Dana Whitfield</div>
            <div className="text-sm text-brand-soft/80">Head of Operations, Gridworks</div>
          </div>
        </div>
      </div>
    </div>
  );
}
