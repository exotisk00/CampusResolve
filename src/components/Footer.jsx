import { Link } from 'react-router-dom';
import { GraduationCap, Mail, Phone, MapPin } from 'lucide-react';

const LPU_FOOTER_NAV = {
  'Campus Desks': [
    { label: 'Plumbing Desk', href: '#departments' },
    { label: 'Electrical Desk', href: '#departments' },
    { label: 'Wi-Fi & Network', href: '#departments' },
    { label: 'Mess & Food Hygiene', href: '#departments' },
    { label: 'Academic Infrastructure', href: '#departments' },
    { label: 'Other Facilities', href: '#departments' },
  ],
  'Location Coverage': [
    { label: 'Academic Blocks (32, 34, 38)', href: '#' },
    { label: 'Boys Hostels (BH-1 to BH-8)', href: '#' },
    { label: 'Girls Hostels (GH-1 to GH-6)', href: '#' },
    { label: 'Uni-Mall & Food Courts', href: '#' },
    { label: 'Central Library & Labs', href: '#' },
  ],
  'Student Support': [
    { label: 'Submit a Complaint', href: '/submit-complaint' },
    { label: 'Track Existing Ticket', href: '/track-complaint' },
    { label: 'Urgent Hostel Assistance', href: '#support' },
    { label: 'Grievance Guidelines', href: '#how-it-works' },
  ],
};

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Use', href: '#' },
  { label: 'Campus Guidelines', href: '#' },
];

export default function Footer() {
  return (
    <footer
      id="support"
      className="relative bg-white border-t border-border-ui-subtle"
      aria-label="Site footer"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 pt-16 pb-12">

        {/* Main footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 mb-14">

          {/* Brand & Campus Info */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <a href="/" className="inline-flex items-center gap-2.5 w-fit group" aria-label="CampusResolve AI">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1F47E8 0%, #2D56F5 100%)' }}
              >
                <GraduationCap className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="font-heading font-extrabold text-content-heading text-[1.125rem] tracking-tight leading-none">
                CampusResolve <span className="text-brand-blue">AI</span>
              </span>
            </a>

            <p className="text-[0.9375rem] text-content-secondary leading-relaxed max-w-sm">
              One Campus. One Platform. Smarter Complaint Resolution.
              <br />
              Exclusively dedicated to Lovely Professional University (LPU), Phagwara campus students and staff.
            </p>

            {/* Campus Location Details */}
            <div className="flex flex-col gap-2 pt-2 text-[0.8125rem] text-content-secondary">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-brand-blue flex-shrink-0" aria-hidden="true" />
                <span>LPU Campus, Jalandhar - Delhi G.T. Road, Phagwara, Punjab 144411</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-blue flex-shrink-0" aria-hidden="true" />
                <span>support@campusresolve.ai</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-blue flex-shrink-0" aria-hidden="true" />
                <span>Campus Helpline: Intercom Support Available</span>
              </div>
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(LPU_FOOTER_NAV).map(([heading, links]) => (
            <div key={heading} className="flex flex-col gap-4">
              <h3 className="font-heading font-bold text-content-heading text-[0.875rem] uppercase tracking-wider">
                {heading}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith('#') ? (
                      <a
                        href={href}
                        className="text-[0.875rem] text-content-secondary hover:text-brand-blue transition-colors duration-150"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        to={href}
                        className="text-[0.875rem] text-content-secondary hover:text-brand-blue transition-colors duration-150"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Institutional Scope Notice (no fake endorsements) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-border-ui-subtle mb-10 text-[0.8125rem] text-content-secondary">
          <p className="font-semibold text-content-heading mb-0.5">
            Institutional Scope Notice:
          </p>
          <p>
            CampusResolve AI is custom-built exclusively for students, hostel residents, faculty, and maintenance staff of Lovely Professional University (LPU), Phagwara campus. This platform provides automated grievance categorization for Plumbing, Electrical, Wi-Fi, Mess, Academic, and Other campus services.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border-ui-subtle">
          <p className="text-[0.8125rem] text-content-muted text-center sm:text-left">
            © {new Date().getFullYear()} CampusResolve AI · Lovely Professional University (LPU), Phagwara Campus.
          </p>

          <nav aria-label="Legal navigation">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-1">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-[0.8125rem] text-content-muted hover:text-content-primary transition-colors duration-150"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

      </div>
    </footer>
  );
}
