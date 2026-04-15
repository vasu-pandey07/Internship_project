import { Link } from 'react-router-dom';
import { FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';

const Footer = () => {
  const socials = [
    { Icon: FiGithub, href: '#' },
    { Icon: FiTwitter, href: '#' },
    { Icon: FiLinkedin, href: '#' },
  ];

  return (
    <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-default)', marginTop: 'auto' }}>
      <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-8)' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-4)' }}>
              <div style={{
                width: 30, height: 30, borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: 13,
              }}>E</div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>EduPlatform</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', lineHeight: 1.7, maxWidth: '260px' }}>
              Learn from the best instructors worldwide. Build skills, earn certificates, advance your career.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>Platform</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {['Courses', 'About', 'Pricing', 'Contact'].map((item) => (
                <Link key={item} to={`/${item.toLowerCase()}`} style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', transition: 'color var(--duration-fast)' }}
                  onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-tertiary)'}
                >{item}</Link>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>Categories</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {['Web Development', 'Data Science', 'Mobile Development', 'Cloud Computing'].map((item) => (
                <span key={item} style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>{item}</span>
              ))}
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>Connect</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              {socials.map(({ Icon, href }, i) => (
                <a key={i} href={href} className="btn btn-icon btn-secondary btn-sm" aria-label="Social link">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="divider" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
            © {new Date().getFullYear()} EduPlatform. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
            {['Privacy', 'Terms', 'Cookies'].map((item) => (
              <a key={item} href="#" style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', transition: 'color var(--duration-fast)' }}
                onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-tertiary)'}
              >{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
