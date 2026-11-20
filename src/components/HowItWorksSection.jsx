import { MessageSquarePlus, GitBranch, CheckCircle2 } from 'lucide-react';

const LPU_STEPS = [
  {
    step: '01',
    icon: MessageSquarePlus,
    iconColor: '#1F47E8',
    iconBg: '#EFF6FF',
    iconBorder: '#BFDBFE',
    title: 'Report Your Campus Issue',
    description:
      'Describe what happened in Hinglish, Hindi, or English. Specify your LPU campus Block (BH, GH, or Academic), Floor, and Room Number.',
    details: ['Academic Blocks', 'Boys Hostels (BH)', 'Girls Hostels (GH)'],
  },
  {
    step: '02',
    icon: GitBranch,
    iconColor: '#2563EB',
    iconBg: '#F0F9FF',
    iconBorder: '#BAE6FD',
    title: 'Automated Department Routing',
    description:
      'The platform classifies your complaint into one of the 6 official departments: Plumbing, Electrical, Wi-Fi, Mess, Academic, or Other.',
    details: ['6 Dedicated Desks', 'Priority Tagging', 'Zero Lost Tickets'],
  },
  {
    step: '03',
    icon: CheckCircle2,
    iconColor: '#059669',
    iconBg: '#ECFDF5',
    iconBorder: '#A7F3D0',
    title: 'Track Resolution on Campus',
    description:
      'Monitor status updates directly on your portal. When LPU maintenance staff resolve the ticket, you receive notification and confirmation remarks.',
    details: ['Real-Time Timeline', 'Status Badges', 'Escalation Support'],
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative py-20 lg:py-28 bg-white"
      aria-labelledby="how-it-works-heading"
    >
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">

        {/* Section header */}
        <div className="text-center mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-blue-pale border border-blue-200 mb-4">
            <span className="text-[0.75rem] font-bold uppercase tracking-wider text-brand-blue">
              LPU Redressal Workflow
            </span>
          </div>

          <h2
            id="how-it-works-heading"
            className="font-heading font-extrabold text-content-heading tracking-tight mb-4"
            style={{
              fontSize: 'clamp(1.85rem, 4vw, 2.5rem)',
              letterSpacing: '-0.025em',
            }}
          >
            How Grievances Move on Campus
          </h2>

          <p
            className="text-content-secondary max-w-lg mx-auto"
            style={{ fontSize: '1.0625rem', lineHeight: '1.75' }}
          >
            A direct, trackable 3-step workflow connecting LPU campus residents with responsible maintenance desks.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">

          {LPU_STEPS.map(({ step, icon: Icon, iconColor, iconBg, iconBorder, title, description, details }) => (
            <div
              key={step}
              className="relative flex flex-col p-8 rounded-2xl bg-slate-50/70 border border-border-ui-subtle transition-all duration-200 hover:bg-white hover:border-blue-200 shadow-card"
            >
              {/* Step number badge + icon */}
              <div className="flex items-center justify-between mb-6">
                <div
                  className="w-13 h-13 p-3 rounded-xl flex items-center justify-center border"
                  style={{
                    background: iconBg,
                    borderColor: iconBorder,
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: iconColor }} aria-hidden="true" />
                </div>
                <span className="font-heading font-extrabold text-[1.25rem] text-slate-300">
                  {step}
                </span>
              </div>

              <h3 className="font-heading font-bold text-content-heading text-[1.15rem] mb-3 leading-snug">
                {title}
              </h3>

              <p className="text-[0.9375rem] text-content-secondary leading-relaxed mb-6 flex-1">
                {description}
              </p>

              {/* Detail tags */}
              <div className="flex flex-wrap gap-1.5 pt-4 border-t border-border-ui-subtle">
                {details.map(tag => (
                  <span
                    key={tag}
                    className="text-[0.6875rem] font-semibold px-2.5 py-1 rounded-md bg-white border border-border-ui-subtle text-content-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
