#!/usr/bin/env node
/**
 * parse_market_chat.js
 * Extract buy/sell quotes for aerospace products from SimCompanies chat logs
 *
 * Usage:
 *   node scripts/parse_market_chat.js <input.txt> [output.json]
 *
 * Products tracked: SOR(re-91) BFR(re-94) JUM(re-95) LUX(re-96) SEP(re-97) SAT(re-99)
 * Output: JSON with raw quote list + aggregated summary per product/quality/direction
 */

'use strict';
const fs   = require('fs');
const path = require('path');

// ── Product definitions ───────────────────────────────────────────────────
const PRODUCT_CODES = {
  ':re-91:': 'SOR',
  ':re-94:': 'BFR',
  ':re-95:': 'JUM',
  ':re-96:': 'LUX',
  ':re-97:': 'SEP',
  ':re-99:': 'SAT',
};

// Alias → canonical name (uppercase keys, whole-word match)
const ALIASES = {
  SOR: 'SOR', SORS: 'SOR',
  BFR: 'BFR', BFRS: 'BFR',
  JUM: 'JUM', JUMS: 'JUM', JUMBO: 'JUM', JUMBOS: 'JUM',
  JUMBOJET: 'JUM', JUMBOJETS: 'JUM',
  LUX: 'LUX', LUXS: 'LUX', LUXJET: 'LUX', LUXJETS: 'LUX',
  SEP: 'SEP', SEPS: 'SEP',
  SAT: 'SAT', SATS: 'SAT', SATELLITE: 'SAT', SATELLITES: 'SAT',
};

// Alias word regex (whole word, case-insensitive)
const ALIAS_RE = /\b(SOR|SORS|BFR|BFRS|JUM|JUMS|JUMBO|JUMBOS|JUMBOJET|JUMBOJETS|LUX|LUXS|LUXJET|LUXJETS|SEP|SEPS|SAT|SATS|SATELLITE|SATELLITES)\b/gi;

// Timestamp suffix that ends each company name line
// Use restricted digit widths to avoid eating trailing digits of company names:
// - with 大约: up to 3 digits (covers up to ~999h, well beyond any display)
// - without 大约 (recent <1h): up to 2 digits (minutes 1-59 only)
const TS_RE = /(大约\d{1,3}(小时|分钟)之前|\d{1,2}分钟之前)$/;

// Lines mentioning rent/rental should not be treated as buy/sell quotes
const RENT_RE = /\brent(?:ing|al|s)?\b|for\s+rent/i;

// Direction detection (order: sell before buy to avoid "not selling / buying" ambiguity)
const SELL_RE = /\b(sell(?:ing)?|vend(?:ing|o)?|offer(?:ing)?|auction|verkauf|for\s+sale)\b/i;
const BUY_RE  = /\b(buy(?:i?n?g?)?|buyi[gn]+|acqui|want(?:ing|ed)?|need(?:ing)?|compra|looking\s+for|spending)\b/i;

// Quality: Q0-Q15, also Q3/Q4/Q5 slash lists, "q0+" treated as Q0
const QUAL_PART_RE = /[Qq](\d{1,2})/g;

// Price: optional @/$, number (1–4 digits before decimal), then k/K
// Must not be preceded by a slash (to avoid matching "/Q" context)
const PRICE_RE = /(?:[@$]|(?<!\/))\s*(\d{1,4}(?:[.,]\d+)?)\s*[kK](?![a-zA-Z/])/;

// Price after "at " keyword
const PRICE_AT_RE = /\bat\s+(\d{1,4}(?:[.,]\d+)?)\s*[kK](?![a-zA-Z/])/i;

// Delta per Q: "+1.5k/Q", "-2k/Q", "+/-2k" (user-notation), "+2k/q"
// Sign char may be +/- combination (+/-, -/+) meaning bidirectional
const DELTA_RE = /([+\-])\/?\-?\s*(\d+(?:[.,]\d+)?)\s*[kK]?\s*(?:\/\s*[qQ])?(?=$|[^a-zA-Z\d])/;

// Quality expansion range when +/- delta is given
const EXPAND_Q_MIN = 0;
const EXPAND_Q_MAX = 9;

// ── Entry point ───────────────────────────────────────────────────────────
function main() {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage: node parse_market_chat.js <input.txt> [output.json]');
    process.exit(1);
  }

  const text    = fs.readFileSync(inputFile, 'utf8');
  const blocks  = splitBlocks(text);
  const quotes  = [];

  for (const block of blocks) {
    quotes.push(...parseBlock(block));
  }

  const summary = buildSummary(quotes);
  const output  = {
    source_file: path.basename(inputFile),
    parsed_at:   new Date().toISOString(),
    total_quotes: quotes.length,
    quotes,
    summary,
  };

  const outFile = process.argv[3]
    || inputFile.replace(/\.(txt|log)$/i, '_parsed.json');
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\nParsed ${quotes.length} quotes from ${blocks.length} messages`);
  console.log(`Output → ${outFile}\n`);
  printSummary(summary);
}

// ── Split raw text into per-company message blocks ─────────────────────────
function splitBlocks(text) {
  const blocks = [];
  let cur = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (TS_RE.test(line)) {
      if (cur) blocks.push(cur);
      cur = { company: line.replace(TS_RE, '').trim(), lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  if (cur) blocks.push(cur);
  return blocks;
}

// ── Parse one company's block ─────────────────────────────────────────────
function parseBlock(block) {
  const results = [];
  let blockDir  = null; // direction carried across lines within this block

  for (const line of block.lines) {
    const lineDir = detectDir(line);
    if (lineDir) blockDir = lineDir;
    const dir = lineDir || blockDir;
    if (!dir) continue;

    // Skip rental lines — they are pricing for renting buildings, not trading aircraft
    if (RENT_RE.test(line)) continue;

    const lineResults = parseLineProducts(line, block.company, dir);
    results.push(...lineResults);
  }
  return results;
}

// ── Detect buy/sell direction from a line ─────────────────────────────────
function detectDir(line) {
  const hasSell = SELL_RE.test(line);
  const hasBuy  = BUY_RE.test(line);
  if (hasSell && !hasBuy) return 'sell';
  if (hasBuy  && !hasSell) return 'buy';
  // Both → use whichever appears first
  if (hasSell && hasBuy) {
    const si = line.toLowerCase().search(SELL_RE);
    const bi = line.toLowerCase().search(BUY_RE);
    return si < bi ? 'sell' : 'buy';
  }
  return null;
}

// ── Find all :re-XX: and alias matches, return sorted by position ──────────
function findAllMentions(line) {
  const mentions = [];

  // :re-XX: codes
  for (const [code, prod] of Object.entries(PRODUCT_CODES)) {
    let idx = line.indexOf(code);
    while (idx !== -1) {
      mentions.push({ product: prod, start: idx, end: idx + code.length });
      idx = line.indexOf(code, idx + 1);
    }
  }

  // Alias words
  let m;
  const re = new RegExp(ALIAS_RE.source, 'gi');
  while ((m = re.exec(line)) !== null) {
    const prod = ALIASES[m[0].toUpperCase()];
    // Deduplicate: skip if a :re-XX: already occupies this position
    const overlaps = mentions.some(x => x.start <= m.index && m.index < x.end);
    if (!overlaps) {
      mentions.push({ product: prod, start: m.index, end: m.index + m[0].length });
    }
  }

  mentions.sort((a, b) => a.start - b.start);
  return mentions;
}

// ── Group consecutive mentions of the same product ────────────────────────
// Returns [{product, spans:[{start,end}]}]
function groupMentions(mentions) {
  if (mentions.length === 0) return [];
  const groups = [];
  let cur = { product: mentions[0].product, spans: [{ start: mentions[0].start, end: mentions[0].end }] };

  for (let i = 1; i < mentions.length; i++) {
    const m = mentions[i];
    // Merge if same product AND this mention is adjacent/overlapping the current group
    const lastEnd = cur.spans[cur.spans.length - 1].end;
    const gap     = m.start - lastEnd;
    if (m.product === cur.product && gap <= 12) {
      // Same product, close together → merge
      cur.spans.push({ start: m.start, end: m.end });
    } else {
      groups.push(cur);
      cur = { product: m.product, spans: [{ start: m.start, end: m.end }] };
    }
  }
  groups.push(cur);
  return groups;
}

// ── Extract quotes for each product group in a line ───────────────────────
function parseLineProducts(line, company, dir) {
  const mentions = findAllMentions(line);
  if (mentions.length === 0) return [];

  const groups  = groupMentions(mentions);
  const results = [];

  // Boundaries of each group: used to carve pre/post text
  const groupBounds = groups.map(g => ({
    start: g.spans[0].start,
    end:   g.spans[g.spans.length - 1].end,
  }));

  for (let i = 0; i < groups.length; i++) {
    const g         = groups[i];
    const gStart    = groupBounds[i].start;
    const gEnd      = groupBounds[i].end;

    // preText: from end of previous group (or line start) up to this group's first span
    const preFrom   = i === 0 ? 0 : groupBounds[i - 1].end;
    const preText   = line.slice(preFrom, gStart);

    // postText: from this group's last span end to start of next group (or line end)
    const postTo    = i < groups.length - 1 ? groupBounds[i + 1].start : line.length;
    const postText  = line.slice(gEnd, postTo);

    // Text spanning the whole group (between its own spans)
    const intraText = line.slice(gStart, gEnd);

    // Quality: search preText + intraText + postText
    const qualContext = (preText + ' ' + intraText + ' ' + postText);
    const qualities   = extractQualities(qualContext);

    // Price + delta: search postText only (price always after product in this market)
    const { price, delta } = extractPriceAndDelta(postText);

    // Emit quotes
    if (qualities.length === 0) {
      // No quality specified
      results.push(makeQuote(company, dir, g.product, null, price, null, false, line));
    } else {
      for (const q of qualities) {
        if (delta !== null && price !== null) {
          // Expand delta across Q0–Q9
          const baseQ = parseInt(q.slice(1));
          for (let qn = EXPAND_Q_MIN; qn <= EXPAND_Q_MAX; qn++) {
            const expandedPrice = Math.round(price + delta * (qn - baseQ));
            results.push(makeQuote(company, dir, g.product, `Q${qn}`, expandedPrice,
              delta, true, line, q, price));
          }
        } else {
          results.push(makeQuote(company, dir, g.product, q, price, null, false, line));
        }
      }
    }
  }

  return results;
}

function makeQuote(company, direction, product, quality, price, delta, fromDelta, raw, baseQuality, basePrice) {
  const q = {
    company,
    direction,
    product,
    quality,    // e.g. "Q4", or null = unspecified
    price,      // in dollars, or null
    from_delta: fromDelta,
    raw: raw.trim(),
  };
  if (fromDelta) {
    q.base_quality    = baseQuality;
    q.base_price      = basePrice;
    q.delta_per_q     = delta;
  }
  return q;
}

// ── Extract quality levels from text ─────────────────────────────────────
function extractQualities(text) {
  const seen = new Set();
  let m;
  const re = new RegExp(QUAL_PART_RE.source, 'gi');
  while ((m = re.exec(text)) !== null) {
    seen.add(`Q${parseInt(m[1])}`);
  }
  return [...seen].sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
}

// ── Extract price (in dollars) and delta from text ────────────────────────
function extractPriceAndDelta(text) {
  // Normalize European decimal commas in numbers: 39,5 → 39.5
  const t = text.replace(/(\d),(\d)/g, '$1.$2');

  // Delta detection
  let delta = null;
  const dm = DELTA_RE.exec(t);
  if (dm) {
    // dm[2] is the numeric part
    const val = parseFloat(dm[2]);
    // If val < 100, treat as already in k; if ≥ 100, in full dollars
    const valDollars = val < 100 ? val * 1000 : val;
    // Check if the k suffix is present after the number
    const kMatch = t.slice(dm.index + dm[0].length - 1).match(/^[kK]/);
    const finalVal = kMatch ? val * 1000 : valDollars;
    delta = dm[1] === '-' ? -finalVal : finalVal;
  }

  // Price detection — prefer @/$ prefix
  let price = null;
  let m;

  // Try "at XXk" first
  m = PRICE_AT_RE.exec(t);
  if (m) {
    price = Math.round(parseFloat(m[1]) * 1000);
  }

  if (price === null) {
    // Try @XXk or $XXk
    m = /[@$]\s*(\d{1,4}(?:\.\d+)?)\s*[kK](?![a-zA-Z/])/.exec(t);
    if (m) price = Math.round(parseFloat(m[1]) * 1000);
  }

  if (price === null) {
    // Try standalone XXk (2+ digits before k, not preceded by /)
    // Exclude the delta match region to avoid double-counting
    const tClean = delta !== null ? t.replace(DELTA_RE, '') : t;
    m = /(?<![/\d])(\d{2,4}(?:\.\d+)?)\s*[kK](?![a-zA-Z/])/.exec(tClean);
    if (m) price = Math.round(parseFloat(m[1]) * 1000);
  }

  return { price, delta };
}

// ── Build summary: group by product → quality → direction → price ─────────
function buildSummary(quotes) {
  const tree = {};

  for (const q of quotes) {
    const prod  = q.product;
    const qual  = q.quality || 'unspecified';
    const dir   = q.direction;
    const price = q.price;

    if (!tree[prod])             tree[prod] = {};
    if (!tree[prod][qual])       tree[prod][qual] = { buy: {}, sell: {} };
    const bucket = tree[prod][qual][dir];

    const key = price !== null ? String(price) : 'no_price';
    if (!bucket[key]) bucket[key] = new Set();
    bucket[key].add(q.company);
  }

  // Serialize Sets → arrays + counts
  const result = {};
  for (const [prod, quals] of Object.entries(tree)) {
    result[prod] = {};
    const qualOrder = Object.keys(quals).sort((a, b) => {
      if (a === 'unspecified') return 1;
      if (b === 'unspecified') return -1;
      return parseInt(a.slice(1)) - parseInt(b.slice(1));
    });
    for (const qual of qualOrder) {
      result[prod][qual] = {};
      for (const dir of ['buy', 'sell']) {
        if (!quals[qual][dir]) continue;
        result[prod][qual][dir] = Object.entries(quals[qual][dir])
          .map(([priceKey, companies]) => ({
            price:     priceKey === 'no_price' ? null : parseInt(priceKey),
            count:     companies.size,
            companies: [...companies].sort(),
          }))
          .sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      }
    }
  }
  return result;
}

// ── Console summary ───────────────────────────────────────────────────────
function printSummary(summary) {
  const ORDER = ['SOR', 'BFR', 'JUM', 'LUX', 'SEP', 'SAT'];
  const CODE  = { SOR: 're-91', BFR: 're-94', JUM: 're-95', LUX: 're-96', SEP: 're-97', SAT: 're-99' };

  for (const prod of ORDER) {
    if (!summary[prod]) continue;
    console.log(`\n════ ${prod} (${CODE[prod]}) ════`);

    for (const [qual, dirs] of Object.entries(summary[prod])) {
      let printed = false;
      for (const dir of ['buy', 'sell']) {
        const entries = (dirs[dir] || []).filter(e => e.price !== null);
        if (entries.length === 0) continue;
        if (!printed) {
          console.log(`  ── ${qual} ──`);
          printed = true;
        }
        console.log(`    ${dir.toUpperCase()}:`);
        for (const e of entries) {
          const ps = (e.price / 1000).toFixed(1) + 'k';
          const cs = e.companies.length <= 3
            ? e.companies.join(', ')
            : e.companies.slice(0, 3).join(', ') + ` … +${e.companies.length - 3}`;
          console.log(`      ${ps.padEnd(8)} ×${e.count}  ${cs}`);
        }
      }
      // No-price entries
      for (const dir of ['buy', 'sell']) {
        const np = (dirs[dir] || []).find(e => e.price === null);
        if (np && np.count > 0) {
          console.log(`  ── ${qual} (no price) ──`);
          console.log(`    ${dir.toUpperCase()}: ×${np.count}  ${
            np.companies.length <= 4 ? np.companies.join(', ')
            : np.companies.slice(0, 4).join(', ') + ` … +${np.companies.length - 4}`
          }`);
        }
      }
    }
  }
  console.log('');
}

main();
