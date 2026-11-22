(() => {
  const {slots, labels, catalog, total, prices} = window.MissingCenturyGear;
  const glyphs = {weapon:'⚔',head:'◭',chest:'▣',hands:'✥',legs:'Ⅱ',feet:'▟',charm:'◆'};
  const statText = (values, signed = true) => Object.entries(values)
    .filter(([,value]) => value)
    .map(([id, value]) => (signed && value > 0 ? '+' : '') + value + (id === 'critical' ? '%' : '') + ' ' + labels[id])
    .join(' · ');

  function open(panel, {wallet, merchant, chapter, close, save, play}) {
    panel.className = 'gear-panel panel';
    panel.setAttribute('aria-label', merchant ? merchant.name : 'Equipment');
    let tab = merchant ? 'shop' : 'gear';
    let filter = merchant ? 'weapon' : 'all';
    let message = '';
    const stock = merchant ? prices(chapter) : [];

    function node(tag, text, cls) {
      const el = document.createElement(tag);
      if (text) el.textContent = text;
      if (cls) el.className = cls;
      return el;
    }

    function button(text, handler, cls) {
      const el = node('button',text,cls);
      el.type = 'button';
      el.addEventListener('click',handler);
      return el;
    }

    function equip(item) {
      wallet.loadout[item.slot] = item.id;
      message = item.name + ' equipped.';
    }

    function buy(item) {
      if (wallet.owned.includes(item.id) || wallet.gold < item.price) return;
      wallet.gold -= item.price;
      wallet.owned.push(item.id);
      if (!wallet.loadout[item.slot] || catalog[wallet.loadout[item.slot]].price === 0) equip(item);
      else message = item.name + ' added to your pack.';
      message = 'Bought for ' + item.price + ' gold. ' + message;
      save();
      play('relic');
      render('[data-item="' + item.id + '"] button');
    }

    function drawItem(item) {
      const row = node('article','','gear-item');
      row.dataset.item = item.id;
      const text = node('div');
      const stats = statText(item.stats);
      const slot = slots[item.slot];
      const equipped = wallet.loadout[item.slot] === item.id;
      const owned = wallet.owned.includes(item.id);
      text.append(node('h3',item.name),node('p',slot + (stats ? ' · ' + stats : ''),'gear-stats'));
      const current = catalog[wallet.loadout[item.slot]];
      if (!equipped && current) {
        const delta = {};
        for (const stat of Object.keys(labels)) delta[stat] = (item.stats[stat] || 0) - (current.stats[stat] || 0);
        const comparison = statText(delta);
        if (comparison) text.append(node('p','vs. ' + current.name + ': ' + comparison,'gear-compare'));
      }
      const action = equipped
        ? button('Equipped', () => {}, 'gear-equipped')
        : owned
          ? button('Equip', () => { equip(item); save(); play('select'); render('[data-item="' + item.id + '"] button'); })
          : button('Buy · ' + item.price + ' G', () => buy(item), 'gear-buy');
      action.disabled = equipped || !owned && wallet.gold < item.price;
      if (!owned) action.setAttribute('aria-label','Buy ' + item.name + ' for ' + item.price + ' gold');
      else if (!equipped) action.setAttribute('aria-label','Equip ' + item.name);
      row.append(node('span',glyphs[item.slot],'gear-icon'),text,action);
      return row;
    }

    function render(refocus) {
      const title = node('div','','gear-heading');
      const heading = node('div');
      heading.append(node('p',merchant ? 'Merchant' : 'Party loadout','eyebrow'),
        node('h2',merchant ? merchant.name : 'Equipment'));
      const currency = node('strong',wallet.gold + ' gold','gear-gold');
      const back = button('Close',close,'gear-close');
      title.append(heading,currency,back);
      const nav = node('div','','gear-nav');
      if (merchant) {
        for (const [id,label] of [['shop','Shop stock'],['gear','Your equipment']]) {
          const toggle = button(label,() => {
            tab = id;
            filter = id === 'shop' ? 'weapon' : 'all';
            render('[data-tab="' + id + '"]');
          });
          toggle.dataset.tab = id;
          toggle.setAttribute('aria-pressed',String(id === tab));
          nav.append(toggle);
        }
      }
      const summary = tab === 'gear'
        ? 'Party bonuses · ' + (statText(total(wallet.loadout), false) || 'Starting equipment')
        : merchant.greeting || 'Weapons and armor for the road ahead.';
      const subtitle = node('p',summary,'gear-summary');
      const filters = node('div','','gear-filters');
      for (const [id,label] of [['all','All'],...Object.entries(slots)]) {
        const filterButton = button(label,() => { filter = id; render('[data-slot="' + id + '"]'); });
        filterButton.dataset.slot = id;
        filterButton.setAttribute('aria-pressed',String(id === filter));
        filters.append(filterButton);
      }
      const list = node('div','','gear-list');
      const source = tab === 'shop' ? stock : wallet.owned.map(id => catalog[id])
        .sort((a,b) => Object.keys(slots).indexOf(a.slot)-Object.keys(slots).indexOf(b.slot) || b.price-a.price);
      const items = source.filter(item => filter === 'all' || item.slot === filter);
      if (items.length) items.forEach(item => list.append(drawItem(item)));
      else list.append(node('p','There’s nothing in this slot yet.','gear-empty'));
      const notice = node('p',message,'gear-notice');
      notice.setAttribute('role','status');
      panel.replaceChildren(title,nav,subtitle,filters,list,notice);
      if (refocus) {
        const target = panel.querySelector(refocus);
        if (target && !target.disabled) target.focus({preventScroll:true});
        else {
          const row = target?.closest('.gear-item');
          if (row) {
            row.tabIndex = -1;
            row.focus({preventScroll:true});
          } else back.focus({preventScroll:true});
        }
        target?.scrollIntoView({block:'nearest'});
      }
    }
    render();
  }

  window.MissingCenturyGearMenu = {open};
})();
