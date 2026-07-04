// Hardcoded placeholder avatars — simple flat shapes, meant to be replaced later.
// Each is a self-contained inline SVG (viewBox only; size is driven by CSS).

export interface Avatar {
  id: string
  svg: string
}

export const AVATARS: Avatar[] = [
  {id: 'circle', svg: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="#4a9edd"/></svg>'},
  {id: 'square', svg: '<svg viewBox="0 0 40 40"><rect x="7" y="7" width="26" height="26" rx="6" fill="#22c55e"/></svg>'},
  {id: 'triangle', svg: '<svg viewBox="0 0 40 40"><polygon points="20,6 34,32 6,32" fill="#f59e0b"/></svg>'},
  {id: 'diamond', svg: '<svg viewBox="0 0 40 40"><polygon points="20,5 35,20 20,35 5,20" fill="#a855f7"/></svg>'},
  {id: 'ring', svg: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="13" fill="none" stroke="#ef4444" stroke-width="7"/></svg>'},
  {id: 'hexagon', svg: '<svg viewBox="0 0 40 40"><polygon points="20,5 33,12.5 33,27.5 20,35 7,27.5 7,12.5" fill="#14b8a6"/></svg>'},
  {id: 'pentagon', svg: '<svg viewBox="0 0 40 40"><polygon points="20,5 34.3,15.4 28.8,32.1 11.2,32.1 5.7,15.4" fill="#6366f1"/></svg>'},
  {id: 'star', svg: '<svg viewBox="0 0 40 40"><polygon points="20,5 23.5,15.1 34.3,15.4 25.7,21.9 28.8,32.1 20,26 11.2,32.1 14.3,21.9 5.7,15.4 16.5,15.1" fill="#eab308"/></svg>'},
  {id: 'plus', svg: '<svg viewBox="0 0 40 40"><rect x="15" y="6" width="10" height="28" rx="2" fill="#ec4899"/><rect x="6" y="15" width="28" height="10" rx="2" fill="#ec4899"/></svg>'},
  {id: 'ellipse', svg: '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="15" ry="10" fill="#06b6d4"/></svg>'},
]

export const AVATAR_IDS = AVATARS.map(a => a.id)
