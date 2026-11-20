import {
  Wrench,
  Zap,
  Wifi,
  UtensilsCrossed,
  GraduationCap,
  HelpCircle,
  Languages,
  MapPin,
  Building2,
  FileCheck2,
} from 'lucide-react';

const LPU_DEPARTMENTS = [
  {
    name: 'Plumbing',
    icon: Wrench,
    color: '#1F47E8',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    examples: 'Water supply, washroom leakage, geysers, RO purifiers in hostels & blocks',
  },
  {
    name: 'Electrical',
    icon: Zap,
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    examples: 'AC maintenance, switchboards, fans, power sockets, corridor lighting',
  },
  {
    name: 'Wi-Fi',
    icon: Wifi,
    color: '#15803D',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    examples: 'Hostel router signal, LPU portal login, bandwidth drops, dead zones',
  },
  {
    name: 'Mess',
    icon: UtensilsCrossed,
    color: '#E11D48',
    bgColor: '#FFF1F2',
    borderColor: '#FECDD3',
    examples: 'Meal quality, drinking water cleanliness, dining hall hygiene, staff support',
  },
  {
    name: 'Academic',
    icon: GraduationCap,
    color: '#7E22CE',
    bgColor: '#FAF5FF',
    borderColor: '#E9D5FF',
    examples: 'Lecture hall projectors, audio systems, lab equipment, seating arrangements',
  },
  {
    name: 'Other',
    icon: HelpCircle,
    color: '#475569',
    bgColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    examples: 'General campus maintenance, facility repairs, sanitation, lost & found',
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="departments"
      className="relative py-20 lg:py-28 bg-slate-50/70 border-t border-b border-border-ui-subtle"
      aria-labelledby="departments-heading"
    >
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">

        {/* Section header */}
        <div className="text-center mb-14 lg:mb-18">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-blue-pale border border-blue-200 mb-4">
            <span className="text-[0.75rem] font-bold uppercase tracking-wider text-brand-blue">
              LPU Department Architecture
            </span>
          </div>

          <h2
            className="font-heading font-extrabold text-content-heading mb-4 tracking-tight"
            id="departments-heading"
            style={{
              fontSize: 'clamp(1.85rem, 4vw, 2.5rem)',
              letterSpacing: '-0.025em',
            }}
          >
            Six Dedicated Departments. Zero Misrouted Tickets.
          </h2>

          <p
            className="text-content-secondary max-w-xl mx-auto"
            style={{ fontSize: '1.0625rem', lineHeight: '1.75' }}
          >
            Every complaint submitted by LPU students and staff is classified and routed directly
            to one of exactly six official campus maintenance divisions.
          </p>
        </div>

        {/* The 6 Department Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {LPU_DEPARTMENTS.map(({ name, icon: Icon, color, bgColor, borderColor, examples }) => (
            <div
              key={name}
              className="p-6 rounded-2xl bg-white border border-border-ui-subtle shadow-card flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1 hover:border-blue-200"
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: bgColor, border: `1px solid ${borderColor}` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} aria-hidden="true" />
                </div>
                <span
                  className="text-[0.6875rem] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
                  style={{ color, background: bgColor, borderColor }}
                >
                  Dept 0{LPU_DEPARTMENTS.findIndex(d => d.name === name) + 1}
                </span>
              </div>

              <h3 className="font-heading font-bold text-content-heading text-[1.125rem]">
                {name}
              </h3>

              <p className="text-[0.875rem] text-content-secondary leading-relaxed">
                {examples}
              </p>
            </div>
          ))}
        </div>

        {/* LPU Specific Highlight: Location Pinpointing + Hinglish Understanding */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-7 rounded-2xl bg-white border border-border-ui-subtle shadow-card flex gap-4 items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-brand-blue" aria-hidden="true" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-content-heading text-[1.0625rem] mb-1.5">
                Exact LPU Location Tagging
              </h4>
              <p className="text-[0.875rem] text-content-secondary leading-relaxed">
                Pinpoint your grievance down to the exact <strong>Block</strong> (e.g. Block 34, BH-1, GH-3), 
                <strong> Floor</strong>, and <strong>Room Number</strong> so maintenance staff reach the right spot immediately.
              </p>
            </div>
          </div>

          <div className="p-7 rounded-2xl bg-white border border-border-ui-subtle shadow-card flex gap-4 items-start">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
              <Languages className="w-6 h-6 text-emerald-600" aria-hidden="true" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-content-heading text-[1.0625rem] mb-1.5">
                Natural Student Hinglish Support
              </h4>
              <p className="text-[0.875rem] text-content-secondary leading-relaxed">
                Write casually in Hinglish, Hindi, or English. The AI recognizes campus terminology 
                like <em>"BH-4 mess issue"</em> or <em>"Block 38 lab AC spark ho raha hai"</em> without requiring formal jargon.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
