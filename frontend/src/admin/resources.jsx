import { SERVICE_ICONS, ServiceIcon } from '../components/cards'

const sortOrder = {
  name: 'sort_order',
  label: 'Sort order',
  type: 'number',
  default: 0,
  hint: 'Lower numbers are shown first.',
}

export const skillsConfig = {
  title: 'Skills',
  singular: 'Skill',
  subtitle: 'Shown as rings and progress bars on the Home and Skills pages.',
  path: '/skills',
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'level', label: 'Level', render: (v) => `${v}%` },
    { key: 'sort_order', label: 'Order' },
  ],
  fields: [
    { name: 'name', label: 'Name', required: true, maxLength: 100 },
    { name: 'category', label: 'Category', required: true, default: 'General', maxLength: 100, hint: 'e.g. Frontend, Backend, DevOps' },
    { name: 'level', label: 'Level (0–100)', type: 'number', min: 0, max: 100, default: 80, required: true },
    sortOrder,
  ],
}

export const servicesConfig = {
  title: 'Services',
  singular: 'Service',
  subtitle: 'What you offer. Clients can pick one from the contact form.',
  path: '/services',
  columns: [
    { key: 'icon', label: 'Icon', render: (v) => <ServiceIcon name={v} /> },
    { key: 'title', label: 'Title' },
    { key: 'cost', label: 'Price' },
    { key: 'sort_order', label: 'Order' },
  ],
  fields: [
    { name: 'title', label: 'Title', required: true, maxLength: 150, full: true },
    { name: 'description', label: 'Description', type: 'textarea', required: true, full: true },
    { name: 'cost', label: 'Price', required: true, maxLength: 100, placeholder: 'From $500 / Custom quote' },
    {
      name: 'icon',
      label: 'Icon',
      type: 'select',
      required: true,
      default: 'code',
      options: Object.keys(SERVICE_ICONS).map((k) => ({ value: k, label: k })),
    },
    sortOrder,
  ],
}

export const projectsConfig = {
  title: 'Projects',
  singular: 'Project',
  subtitle: 'Your portfolio. Featured projects appear on the home page.',
  path: '/projects',
  columns: [
    {
      key: 'image_url',
      label: '',
      render: (v) => (v ? <img className="thumb-sm" src={v} alt="" /> : <span className="thumb-sm" style={{ display: 'inline-block' }} />),
    },
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'featured', label: 'Featured', render: (v) => (v ? <span className="badge green">Featured</span> : '—') },
    { key: 'sort_order', label: 'Order' },
  ],
  fields: [
    { name: 'title', label: 'Title', required: true, maxLength: 150 },
    { name: 'category', label: 'Category', required: true, default: 'Web App', maxLength: 100, hint: 'Used for the portfolio filter.' },
    { name: 'description', label: 'Description', type: 'textarea', required: true, full: true, rows: 7 },
    { name: 'github_url', label: 'GitHub URL', type: 'url', required: true, placeholder: 'https://github.com/…' },
    { name: 'live_url', label: 'Live URL', type: 'url', placeholder: 'https://…' },
    { name: 'image_url', label: 'Cover image', type: 'image', full: true },
    { name: 'tech_stack', label: 'Tech stack', maxLength: 300, full: true, placeholder: 'FastAPI, React, PostgreSQL', hint: 'Comma-separated.' },
    { name: 'featured', label: 'Feature on home page', type: 'checkbox' },
    sortOrder,
  ],
}
