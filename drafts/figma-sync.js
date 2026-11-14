// Paste into the Figma console with the 13monks file open. Icons come from images/ui-icons/*.svg (embedded below).
(async () => {
  const SVG = {
    'search': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="6" stroke="#000" stroke-width="2"/><path d="M16 16L20 20" stroke="#000" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/></svg>',
    'menu': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7H20M4 12H20M4 17H20" stroke="#000" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/></svg>',
    'arrow-left': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12H5M11 6L5 12L11 18" stroke="#000" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/></svg>',
    'arrow-right': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12H19M13 6L19 12L13 18" stroke="#000" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/></svg>',
    'cross': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3.5V20.5M6 11.5L12 8.5L18 11.5" stroke="#000" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/></svg>',
    'close': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L18 18M18 6L6 18" stroke="#000" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/></svg>',
    'map-pin': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21C12 21 5 15 5 10C5 6.13 8.13 3 12 3C15.87 3 19 6.13 19 10C19 15 12 21 12 21Z" stroke="#000" stroke-width="2" stroke-linejoin="miter"/><circle cx="12" cy="10" r="2.5" stroke="#000" stroke-width="2"/></svg>',
  };
  const DRAFT_IDS = ['149:1536', '149:1537', '149:1541', '149:1543', '149:1545', '149:1546', '149:1548', '149:1549'];
  const SIZES = { M: { h: 40, padX: 16, padY: 8 }, S: { h: 32, padX: 12, padY: 4 } };
  const CONTENTS = ['Label', 'Icon', 'Label+Icon'];
  const TYPES = {
    Primary:   { Default: ['color/text/primary', 'color/text/inverse'], Hover: ['color/action/primary-hover', 'color/text/inverse'] },
    Secondary: { Default: ['color/surface/soft', 'color/text/primary'], Hover: ['color/surface/selected', 'color/text/primary'] },
    Tertiary:  { Default: ['color/surface/base', 'color/text/primary'], Hover: ['color/surface/neutral-50', 'color/text/primary'] },
  };
  const STATES = ['Default', 'Hover'];
  const COLLECTION = '13monks design tokens';

  await figma.loadAllPagesAsync();
  const iconsPage = figma.root.children.find((p) => p.name === 'icons');
  await figma.setCurrentPageAsync(iconsPage);

  // Variables
  const coll = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === COLLECTION);
  if (!coll) throw new Error(`Variable collection "${COLLECTION}" not found`);
  const vars = await figma.variables.getLocalVariablesAsync();
  const ensureColor = (name, hex) => {
    if (vars.some((x) => x.name === name)) return;
    const v = figma.variables.createVariable(name, coll, 'COLOR');
    const n = parseInt(hex.slice(1), 16);
    v.setValueForMode(coll.defaultModeId, { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 });
    vars.push(v);
  };
  ensureColor('color/action/primary-hover', '#333333');
  ensureColor('color/text/inverse', '#FFFFFF');
  const color = (name) => {
    const v = vars.find((x) => x.name === name && x.resolvedType === 'COLOR');
    if (!v) throw new Error(`Color variable "${name}" not found`);
    return v;
  };
  const num = (name) => vars.find((x) => x.name === name && x.resolvedType === 'FLOAT');
  const paint = (name) => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', color(name));
  const primaryName = vars.some((x) => x.name === 'primary' && x.resolvedType === 'COLOR') ? 'primary' : 'color/text/primary';

  // 1. Clean up
  for (const p of figma.root.children) {
    for (const s of p.findAll((n) => n.type === 'SECTION' && n.name === 'Icons')) s.remove();
  }
  for (const id of DRAFT_IDS) (await figma.getNodeByIdAsync(id))?.remove();
  for (const p of figma.root.children) {
    for (const c of p.findAll((n) => n.type === 'COMPONENT' && n.name.startsWith('Size=') && n.parent.type !== 'COMPONENT_SET')) c.remove();
  }

  // 2. Import project SVGs as 24x24 components
  const section = figma.createSection();
  section.name = 'Icons';
  iconsPage.appendChild(section);
  const icons = {};
  let i = 0;
  for (const [name, svg] of Object.entries(SVG)) {
    const frame = figma.createNodeFromSvg(svg);
    frame.resize(24, 24);
    frame.clipsContent = false;
    frame.fills = [];
    const walk = (n) => {
      if (['VECTOR', 'LINE', 'ELLIPSE', 'BOOLEAN_OPERATION'].includes(n.type)) {
        n.fills = [];
        n.strokes = [paint(primaryName)];
        n.strokeWeight = 2;
        if ('strokeCap' in n && n.type !== 'ELLIPSE') n.strokeCap = 'SQUARE';
        if ('strokeJoin' in n) n.strokeJoin = 'MITER';
      }
      if ('children' in n) n.children.forEach(walk);
    };
    walk(frame);
    const comp = figma.createComponentFromNode(frame);
    comp.name = name;
    section.appendChild(comp);
    comp.x = 24 + i * 64; comp.y = 24;
    icons[name] = comp;
    i++;
  }
  section.resizeWithoutConstraints(24 + i * 64, 80);

  // 3. Button component set
  const old = figma.root.children.flatMap((p) => p.findAll((n) => n.type === 'COMPONENT_SET' && n.name === 'Button'))[0];
  const host = old ? old.parent : iconsPage;
  if (old) old.name = 'Button (old)';
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });

  const comps = [];
  for (const [size, s] of Object.entries(SIZES)) {
    for (const content of CONTENTS) {
      for (const type of Object.keys(TYPES)) {
        for (const state of STATES) {
          const [fillVar, textVar] = TYPES[type][state];
          const c = figma.createComponent();
          c.name = `Size=${size}, Content=${content}, Type=${type}, State=${state}`;
          c.layoutMode = 'HORIZONTAL';
          c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
          c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';
          c.resize(c.width, s.h);
          c.cornerRadius = 999;
          c.fills = [paint(fillVar)];
          if (type === 'Tertiary') { c.strokes = [paint('color/surface/selected')]; c.strokeWeight = 1; c.strokeAlign = 'INSIDE'; }
          const iconOnly = content === 'Icon';
          c.paddingLeft = c.paddingRight = iconOnly ? (s.h - 24) / 2 : s.padX;
          c.paddingTop = c.paddingBottom = s.padY;
          c.itemSpacing = 8;
          if (num('space/8')) c.setBoundVariable('itemSpacing', num('space/8'));
          if (!iconOnly && size === 'M' && num('space/16')) {
            c.setBoundVariable('paddingLeft', num('space/16')); c.setBoundVariable('paddingRight', num('space/16'));
          }
          if (content !== 'Icon') {
            const t = figma.createText();
            t.name = 'label'; t.fontName = { family: 'Inter', style: 'Medium' }; t.fontSize = 14; t.characters = 'Button';
            t.fills = [paint(textVar)];
            c.appendChild(t);
          }
          if (content !== 'Label') {
            const ic = icons['map-pin'].createInstance();
            ic.name = 'icon';
            ic.findAll((n) => 'strokes' in n && n.strokes.length).forEach((n) => { n.strokes = [paint(textVar)]; });
            c.appendChild(ic);
          }
          comps.push(c);
        }
      }
    }
  }
  for (const c of comps) host.appendChild(c);
  const set = figma.combineAsVariants(comps, host);
  set.name = 'Button';
  const labelKey = set.addComponentProperty('label', 'TEXT', 'Button');
  const iconKey = set.addComponentProperty('icon', 'INSTANCE_SWAP', icons['map-pin'].id);
  for (const c of comps) {
    const t = c.findOne((n) => n.type === 'TEXT'); if (t) t.componentPropertyReferences = { characters: labelKey };
    const ic = c.findOne((n) => n.type === 'INSTANCE'); if (ic) ic.componentPropertyReferences = { mainComponent: iconKey };
  }
  const cols = Object.keys(TYPES).flatMap((t) => STATES.map((st) => `${t}/${st}`));
  const rows = Object.keys(SIZES).flatMap((z) => CONTENTS.map((c) => `${z}/${c}`));
  const GAP = 24, CW = 200, RH = 56;
  for (const c of comps) {
    const p = Object.fromEntries(c.name.split(', ').map((x) => x.split('=')));
    c.x = cols.indexOf(`${p.Type}/${p.State}`) * (CW + GAP) + GAP;
    c.y = rows.indexOf(`${p.Size}/${p.Content}`) * (RH + GAP) + GAP;
  }
  set.resizeWithoutConstraints(cols.length * (CW + GAP) + GAP, rows.length * (RH + GAP) + GAP);
  if (old) { set.x = old.x + old.width + 80; set.y = old.y; }

  // 4. Replace draft buttons in layout frames
  const variant = (size, content, type) => set.children.find((c) => c.name === `Size=${size}, Content=${content}, Type=${type}, State=Default`);
  const makeButton = async ({ size = 'M', type, label, icon }) => {
    const content = label && icon ? 'Label+Icon' : icon ? 'Icon' : 'Label';
    const inst = variant(size, content, type).createInstance();
    const key = (prefix) => Object.keys(inst.componentProperties).find((k) => k.startsWith(prefix));
    const props = {};
    if (label) props[key('label')] = label;
    if (icon) props[key('icon')] = icons[icon].id;
    inst.setProperties(props);
    return inst;
  };
  const insideInstance = (n) => { for (let p = n.parent; p; p = p.parent) if (p.type === 'INSTANCE') return true; return false; };
  const swapIn = (d, inst) => {
    try {
      const parent = d.parent, idx = parent.children.indexOf(d);
      parent.insertChild(idx, inst);
      inst.x = d.x; inst.y = d.y;
      if ('layoutSizingHorizontal' in d && d.layoutSizingHorizontal === 'FILL') inst.layoutSizingHorizontal = 'FILL';
      d.remove();
      return true;
    } catch (e) {
      inst.remove();
      console.warn('Skipped', d.id, d.name, e.message);
      return false;
    }
  };
  const LABELS = { 'Read more': ['Secondary', null], 'Open in Google Maps': ['Secondary', 'map-pin'], 'View map': ['Primary', null] };
  const ICON_RULES = [[/location|map|pin/i, 'map-pin', 'Secondary'], [/close|x-|cross/i, 'close', 'Tertiary'],
    [/prev|back|left/i, 'arrow-left', 'Tertiary'], [/next|forward|right/i, 'arrow-right', 'Tertiary'], [/menu|burger/i, 'menu', 'Tertiary']];
  let replaced = 0;
  for (const p of figma.root.children) {
    if (p === iconsPage) continue;
    const layoutFrames = p.findAll((n) => n.type === 'FRAME' && n.layoutMode === 'HORIZONTAL' && n.height === 40 &&
      n.children.length === 1 && n.children[0].type === 'TEXT' && LABELS[n.children[0].characters]);
    for (const d of layoutFrames) {
      if (insideInstance(d)) continue;
      const label = d.children[0].characters;
      const [type, icon] = LABELS[label];
      if (swapIn(d, await makeButton({ type, label, icon }))) replaced++;
    }
    const compact = p.findAll((n) => n.type === 'FRAME' && n.width === 40 && n.height === 40 && n.children.length <= 2);
    for (const d of compact) {
      if (insideInstance(d)) continue;
      const rule = ICON_RULES.find(([re]) => re.test(d.name));
      if (!rule) continue;
      if (swapIn(d, await makeButton({ type: rule[2], icon: rule[1] }))) replaced++;
    }
  }
  figma.notify(`Icons: ${Object.keys(icons).length}, Button variants: ${comps.length}, drafts replaced: ${replaced}`);
})();
