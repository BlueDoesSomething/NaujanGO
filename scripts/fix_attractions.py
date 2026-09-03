import re

filepath = r'c:\PROGRAMMING\CAPSTONE\frontend\src\pages\Attractions.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Original line count: {len(lines)}")

# === Step 1: Remove dead code (0-indexed 295..441 inclusive) ===
# Line 296 (1-indexed) = index 295 (0-indexed): '{/* Sparkle / AI icon */}'
# Line 442 (1-indexed) = index 441 (0-indexed): last line of dead code (    );)
lines = lines[:295] + lines[442:]
print(f"After dead code removal: {len(lines)} lines")

# Verify the junction looks correct
print("Junction at 292-300:")
for i in range(292, 300):
    print(f"  [{i+1}]: {repr(lines[i][:80])}")

# === Step 2: Insert Pagination component + style constants before 'const Attractions' ===
PAGINATION = '''\
const pagBtn = {
  padding: '0.5rem 1rem', border: '2px solid #e5e7eb', borderRadius: 8,
  background: 'white', cursor: 'pointer', fontWeight: 700,
  fontSize: '0.88rem', color: '#4a5568', transition: 'all 0.2s'
};
const pagBtnActive = {
  ...pagBtn, background: 'linear-gradient(135deg,#16a34a,#22c55e)',
  color: '#fff', borderColor: '#16a34a', boxShadow: '0 2px 8px rgba(22,163,74,0.3)'
};
const Pagination = ({ current, total, onChange }) => (
  <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'0.5rem', padding:'1.5rem 2rem', flexWrap:'wrap' }}>
    <button onClick={() => onChange(current - 1)} disabled={current === 1} style={pagBtn}>&#8592; Prev</button>
    {Array.from({ length: total }, (_, i) => i + 1).map(p => (
      <button key={p} onClick={() => onChange(p)} style={p === current ? pagBtnActive : pagBtn}>{p}</button>
    ))}
    <button onClick={() => onChange(current + 1)} disabled={current === total} style={pagBtn}>Next &#8594;</button>
  </div>
);

'''

# Find index of 'const Attractions = () => {'
attractions_idx = None
for i, l in enumerate(lines):
    if 'const Attractions = () => {' in l:
        attractions_idx = i
        break
print(f"Attractions component at index {attractions_idx} (1-indexed {attractions_idx+1})")

lines = lines[:attractions_idx] + [PAGINATION] + lines[attractions_idx:]
print(f"After Pagination insertion: {len(lines)} lines")

# === Step 3: Find the main return block to replace ===
main_return_0 = None
pageStyle_0 = None
for i, l in enumerate(lines):
    if l.strip() == 'return (' and i > 290:
        if main_return_0 is None:
            main_return_0 = i
    if 'const pageStyle = {' in l:
        pageStyle_0 = i
        break

comp_close_0 = pageStyle_0 - 2  # the '};\n' closing the Attractions component

print(f"main_return_0={main_return_0} (1-indexed {main_return_0+1})")
print(f"comp_close_0={comp_close_0} (1-indexed {comp_close_0+1}): {repr(lines[comp_close_0][:60])}")
print(f"pageStyle_0={pageStyle_0} (1-indexed {pageStyle_0+1})")

# Verify
print("\nContext around main return:")
for i in range(main_return_0-2, main_return_0+5):
    print(f"  [{i+1}]: {repr(lines[i][:80])}")
print("\nContext around comp close:")
for i in range(comp_close_0-2, comp_close_0+3):
    print(f"  [{i+1}]: {repr(lines[i][:80])}")
