// Paste into Figma (Plugins > Development > Open console, or a Run-code plugin) with the 13monks file open.
(async () => {
  // Node ids from the canvas selection (several frames share the name "Frame").
  const ID_MAP = {
    '149:1536': 'search', '149:1537': 'menu', '149:1541': 'arrow-right', '149:1543': 'arrow-left',
    '149:1546': 'cross', '149:1548': 'close',
  };
  // Old T-shaped cross (149:1545) and empty frame (149:1549) are deleted.
  const REMOVE_IDS = ['149:1545', '149:1549'];
  const SKIP_IDS = new Set(REMOVE_IDS);
  const COLOR_VAR_NAMES = ['primary', 'color/text/primary'];
  const BUTTON_LABELS = ['Read more', 'Open in Google Maps', 'View map'];
  const MAPS_LABEL = 'Open in Google Maps';
  const DEFAULT_ICON = 'map-pin';
  const MAP_PIN_PATH = 'M12 21C12 21 5 15 5 10C5 6.13 8.13 3 12 3C15.87 3 19 6.13 19 10C19 15 12 21 12 21Z';
  const CROSS_PATH = 'M12 3.5V20.5M6 11.5L12 8.5L18 11.5';

  await figma.loadAllPagesAsync();
  const iconsPage = figma.root.children.find((p) => p.name === 'icons');
  await figma.setCurrentPageAsync(iconsPage);

  const colorVars = await figma.variables.getLocalVariablesAsync('COLOR');
  const primary = COLOR_VAR_NAMES.map((n) => colorVars.find((v) => v.name === n)).find(Boolean);
  if (!primary) throw new Error('Color variable "primary" not found');
  const bind = (node) => {
    node.strokes = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', primary)];
  };

  const detachAll = (node) => {
    let cur = node;
    if (cur.type === 'INSTANCE') cur = cur.detachInstance();
    if ('children' in cur) for (const c of [...cur.children]) detachAll(c);
    return cur;
  };
  const isGraphic = (n) => ['VECTOR', 'LINE', 'ELLIPSE', 'RECTANGLE', 'POLYGON', 'STAR', 'BOOLEAN_OPERATION'].includes(n.type);
  const walk = (n, fn) => { if (isGraphic(n)) fn(n); if ('children' in n) n.children.forEach((c) => walk(c, fn)); };
  const snap = (v) => Math.round(v * 2) / 2;

  // 1. Detach, 2. 24x24 container, 3. stroke/colour
  const src = iconsPage.findOne((n) => n.name === 'Icons for ai test');
  const section = figma.createSection();
  section.name = 'Icons';
  const icons = [];
  for (const id of REMOVE_IDS) (await figma.getNodeByIdAsync(id))?.remove();
  for (const child of [...src.children]) {
    if (SKIP_IDS.has(child.id) || !['FRAME', 'INSTANCE', 'COMPONENT'].includes(child.type)) continue;
    const name = ID_MAP[child.id];
    if (!name) { console.warn('Unmapped icon id:', child.id, child.name); continue; }
    const frame = detachAll(child);
    frame.layoutMode = 'NONE';
    frame.resize(24, 24);
    frame.clipsContent = false;
    frame.fills = [];

    if (name === 'cross') {
      const vecs = [];
      walk(frame, (n) => vecs.push(n));
      const vec = vecs.find((n) => n.type === 'VECTOR') || vecs[0];
      vecs.filter((n) => n !== vec).forEach((n) => n.remove());
      vec.vectorPaths = [{ windingRule: 'NONE', data: CROSS_PATH }];
      vec.x = 6; vec.y = 3.5;
    } else {
      const items = frame.children.filter((c) => isGraphic(c) || 'children' in c);
      const b = (n) => n.absoluteBoundingBox;
      const fb = frame.absoluteBoundingBox;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      items.forEach((n) => {
        minX = Math.min(minX, b(n).x - fb.x); minY = Math.min(minY, b(n).y - fb.y);
        maxX = Math.max(maxX, b(n).x - fb.x + b(n).width); maxY = Math.max(maxY, b(n).y - fb.y + b(n).height);
      });
      const side = Math.max(maxX - minX, maxY - minY);
      const k = side > 18 || side < 16 ? 17 / side : 1; // target ~17px live area
      items.forEach((n) => {
        if (k !== 1) { const ox = n.x, oy = n.y; n.rescale(k); n.x = minX + (ox - minX) * k; n.y = minY + (oy - minY) * k; }
      });
      const w = (maxX - minX) * k, h = (maxY - minY) * k;
      items.forEach((n) => { n.x = snap(n.x - minX + (24 - w) / 2); n.y = snap(n.y - minY + (24 - h) / 2); });
    }

    walk(frame, (n) => {
      n.fills = [];
      n.strokeWeight = 2;
      n.strokeCap = 'SQUARE';
      n.strokeJoin = 'MITER';
      bind(n);
      n.name = name;
    });

    // 5. rename + convert to local component
    frame.name = name;
    const comp = figma.createComponentFromNode(frame);
    comp.name = name;
    section.appendChild(comp);
    icons.push(comp);
  }
  // map-pin: 24x24, 2px stroke, square cap, stroke bound to primary
  {
    const pin = figma.createFrame();
    pin.resize(24, 24); pin.clipsContent = false; pin.fills = [];
    const body = figma.createVector();
    body.vectorPaths = [{ windingRule: 'NONE', data: MAP_PIN_PATH }];
    pin.appendChild(body); body.x = 5; body.y = 3;
    const dot = figma.createEllipse();
    dot.resize(5, 5); pin.appendChild(dot); dot.x = 9.5; dot.y = 7.5;
    for (const n of [body, dot]) {
      n.fills = []; n.strokeWeight = 2; n.strokeCap = 'SQUARE'; n.strokeJoin = 'MITER'; n.strokeAlign = 'CENTER'; bind(n);
    }
    body.name = 'map-pin'; dot.name = 'map-pin-dot';
    const comp = figma.createComponentFromNode(pin);
    comp.name = 'map-pin';
    section.appendChild(comp);
    icons.push(comp);
  }
  icons.forEach((c, i) => { c.x = 24 + i * 64; c.y = 24; });
  section.resizeWithoutConstraints(Math.max(200, icons.length * 64 + 24), 96);
  section.x = src.x; section.y = src.y + src.height + 80;

  // 6. Button: variants Type=Text|Icon-Only, leadingIcon / trailingIcon
  const numVars = await figma.variables.getLocalVariablesAsync('FLOAT');
  const nv = (n) => numVars.find((v) => v.name === n);
  const bindNum = (node, field, name) => { const v = nv(name); if (v) node.setBoundVariable(field, v); };
  let set = null;
  for (const p of figma.root.children) { set = p.findOne((n) => n.type === 'COMPONENT_SET' && n.name === 'Button'); if (set) break; }
  if (!set) throw new Error('Button component set not found');
  const iconDefault = icons.find((c) => c.name === DEFAULT_ICON) || icons[0];
  const textVariants = [...set.children];
  const textVariantByState = {};
  for (const v of textVariants) {
    const state = v.name.match(/State=(\w+)/)[1];
    v.name = `State=${state}, Type=Text`;
    v.layoutMode = 'HORIZONTAL';
    v.primaryAxisAlignItems = 'CENTER'; v.counterAxisAlignItems = 'CENTER';
    bindNum(v, 'itemSpacing', 'space/8');
    bindNum(v, 'paddingLeft', 'space/16'); bindNum(v, 'paddingRight', 'space/16');
    bindNum(v, 'paddingTop', 'space/8'); bindNum(v, 'paddingBottom', 'space/8');
    const lead = iconDefault.createInstance(); const trail = iconDefault.createInstance();
    v.insertChild(0, lead); v.appendChild(trail);
    lead.name = 'leadingIcon'; trail.name = 'trailingIcon';
    textVariantByState[state] = v;
  }
  const leadKey = set.addComponentProperty('leadingIcon', 'BOOLEAN', false);
  const trailKey = set.addComponentProperty('trailingIcon', 'BOOLEAN', false);
  const leadSwap = set.addComponentProperty('leadingIconSwap', 'INSTANCE_SWAP', iconDefault.id);
  const trailSwap = set.addComponentProperty('trailingIconSwap', 'INSTANCE_SWAP', iconDefault.id);
  for (const v of textVariants) {
    const [lead, trail] = [v.findOne((n) => n.name === 'leadingIcon'), v.findOne((n) => n.name === 'trailingIcon')];
    lead.componentPropertyReferences = { visible: leadKey, mainComponent: leadSwap };
    trail.componentPropertyReferences = { visible: trailKey, mainComponent: trailSwap };
  }
  for (const [state, v] of Object.entries(textVariantByState)) {
    const io = v.clone(); set.appendChild(io);
    io.name = `State=${state}, Type=Icon-Only`;
    io.findAll((n) => n.type === 'TEXT').forEach((t) => (t.visible = false));
    io.layoutSizingHorizontal = 'FIXED'; io.resize(40, 40);
    ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'].forEach((f) => bindNum(io, f, 'space/8'));
  }

  // Replace draft buttons with Button instances: text (large) and Icon-Only (compact)
  const iconOnlyDefault = set.children.find((c) => c.name === 'State=Default, Type=Icon-Only');
  const master = textVariantByState.Default;
  const makeButton = async (variant, { label, icon }) => {
    const inst = variant.createInstance();
    const t = inst.findOne((n) => n.type === 'TEXT');
    if (label && t) { await figma.loadFontAsync(t.fontName); t.characters = label; }
    const pick = (prefix, type) => Object.keys(inst.componentProperties).find((k) => k.startsWith(prefix) && inst.componentProperties[k].type === type);
    const props = {};
    if (icon) {
      props[pick('leadingIcon', 'BOOLEAN')] = true;
      props[pick('leadingIconSwap', 'INSTANCE_SWAP')] = icons.find((c) => c.name === icon).id;
    }
    inst.setProperties(props);
    return inst;
  };
  const swapIn = (d, inst) => {
    const parent = d.parent, idx = parent.children.indexOf(d);
    parent.insertChild(idx, inst);
    inst.x = d.x; inst.y = d.y;
    if ('layoutSizingHorizontal' in d && d.layoutSizingHorizontal === 'FILL') inst.layoutSizingHorizontal = 'FILL';
    d.remove();
  };
  const pages = figma.root.children;
  const drafts = pages.flatMap((p) => p.findAll((n) => n.type === 'FRAME' && n.height === 40 && n.layoutMode === 'HORIZONTAL' &&
    n.children.length === 1 && n.children[0].type === 'TEXT' && BUTTON_LABELS.includes(n.children[0].characters)));
  for (const d of drafts) {
    const label = d.children[0].characters;
    swapIn(d, await makeButton(master, { label, icon: label === MAPS_LABEL ? 'map-pin' : null }));
  }
  // Compact Google Maps buttons: 40x40 frames named like location/map/pin
  const compact = pages.flatMap((p) => p.findAll((n) => n.type === 'FRAME' && n.width === 40 && n.height === 40 && /location|map|pin/i.test(n.name)));
  for (const d of compact) swapIn(d, await makeButton(iconOnlyDefault, { icon: 'map-pin' }));
  figma.notify(`Icons: ${icons.length}, buttons replaced: ${drafts.length + compact.length}`);
})();
