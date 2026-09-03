import re

path = r"c:\PROGRAMMING\CAPSTONE\frontend\src\pages\OwnerDashboard.jsx"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()
original = src

# 1. h1 page titles
h1_rx = re.compile(r'<h1\s+style=\{\{[^}]*fontSize\s*:\s*[\'"]2\.2rem[\'"][^}]*\}\}>', re.DOTALL)
count_h1 = len(h1_rx.findall(src))
src = h1_rx.sub('<h1 className="gov-page-title">', src)

# 2. Table wrappers
overflow_key = "<div style={{ overflowX: 'auto' }}>"
count_ov = src.count(overflow_key)
src = src.replace(overflow_key, '<div className="gov-table-wrap">')

# 3. Tables
tbl_rx = re.compile(r"<table\s+style=\{\{\s*\n?\s*width:\s*'100%',\s*\n?\s*borderCollapse:\s*'collapse',\s*\n?\s*fontSize:\s*'0\.9rem'\s*\n?\s*\}\}>", re.DOTALL)
count_tbl = len(tbl_rx.findall(src))
src = tbl_rx.sub('<table className="gov-table">', src)

# 4. THEAD TR
src = src.replace("<tr style={{ borderBottom: '2px solid #c8e6c9', background: '#f8fdf7' }}>", "<tr>")

# 5. TH
th_rx = re.compile(r"<th style=\{\{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: '#2E7D32' \}\}>")
count_th = len(th_rx.findall(src))
src = th_rx.sub("<th>", src)

# 6. TR hover
tr_rx = re.compile(r"<tr key=\{([^}]+)\} style=\{\{ borderBottom: '1px solid #e8f5e9', transition: 'background 0\.2s' \}\}\s*\n\s*onMouseOver=\{\(e\) => e\.currentTarget\.style\.background = '#f8fdf7'\}\s*\n\s*onMouseOut=\{\(e\) => e\.currentTarget\.style\.background = 'transparent'\}>", re.DOTALL)
count_tr = len(tr_rx.findall(src))
src = tr_rx.sub(r'<tr key={\1}>', src)

# 7. TD
td_list = [
    "<td style={{ padding: '1rem', color: '#2d3748', fontWeight: 700 }}>",
    "<td style={{ padding: '1rem', color: '#2d3748' }}>",
    "<td style={{ padding: '1rem', color: '#2E7D32', fontWeight: 700 }}>",
    "<td style={{ padding: '1rem', color: '#2d3748', fontSize: '0.85rem' }}>",
    "<td style={{ padding: '1rem' }}>",
]
count_td = sum(src.count(x) for x in td_list)
for x in td_list:
    src = src.replace(x, "<td>")

# 8. Status badges - booking
badge_bk = re.compile(
    r"<span style=\{\{\s*\n?\s*display: 'inline-block',\s*\n?\s*padding: '0\.4rem 0\.8rem',\s*\n?\s*borderRadius: '6px',\s*\n?\s*fontSize: '0\.8rem',\s*\n?\s*fontWeight: 700,\s*\n?\s*background: booking\.status[^\n]*,\s*\n?\s*color: booking\.status[^\n]*\s*\}\}>",
    re.DOTALL
)
count_bk = len(badge_bk.findall(src))
src = badge_bk.sub('<span className={`gov-badge-status gov-badge-status--${booking.status}`}>', src)

# 8b. Status badges - payment
badge_py = re.compile(
    r"<span style=\{\{\s*\n?\s*display: 'inline-block',\s*\n?\s*padding: '0\.4rem 0\.8rem',\s*\n?\s*borderRadius: '6px',\s*\n?\s*fontSize: '0\.8rem',\s*\n?\s*fontWeight: 700,\s*\n?\s*background: payment\.status[^\n]*,\s*\n?\s*color: payment\.status[^\n]*\s*\}\}>",
    re.DOTALL
)
count_py = len(badge_py.findall(src))
src = badge_py.sub('<span className={`gov-badge-status gov-badge-status--${payment.status}`}>', src)

# 8c. selectedPayment badges
badge_sp = re.compile(
    r"<span style=\{\{\s*\n?\s*display: 'inline-block',\s*\n?\s*padding: '0\.5rem 1rem',\s*\n?\s*borderRadius: '6px',\s*\n?\s*fontSize: '0\.9rem',\s*\n?\s*fontWeight: 700,\s*\n?\s*background: selectedPayment\.status[^\n]*,\s*\n?\s*color: selectedPayment\.status[^\n]*\s*\}\}>",
    re.DOTALL
)
src = badge_sp.sub('<span className={`gov-badge-status gov-badge-status--${selectedPayment.status}`}>', src)

# 8d. archive grey badges
badge_ar = re.compile(
    r"<span style=\{\{\s*\n?\s*display: 'inline-block',\s*\n?\s*padding: '0\.4rem 0\.8rem',\s*\n?\s*borderRadius: '6px',\s*\n?\s*fontSize: '0\.8rem',\s*\n?\s*fontWeight: 700,\s*\n?\s*background: '#e0e0e0',\s*\n?\s*color: '#616161'\s*\n?\s*\}\}>",
    re.DOTALL
)
count_ar = len(badge_ar.findall(src))
src = badge_ar.sub('<span className="gov-badge-status gov-badge-status--cancelled">', src)

# 9. Empty divs
for e in ["<div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>",
          "<div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', border: '1px solid #c8e6c9' }}>"]:
    src = src.replace(e, '<div className="gov-empty">')

# 10. White card containers (regex approach for multiple variants)
card_rx = re.compile(
    r"<div\s+style=\{\{\s*\n\s+background:\s*'white',\s*\n\s+borderRadius:\s*'12px',\s*\n\s+border:\s*'1px solid #c8e6c9',\s*\n\s+padding:\s*'(?:1\.5|2)rem',\s*\n\s+(?:marginBottom:[^,\n]+,\s*\n\s+)?boxShadow:\s*'0 4px 12px rgba\(46, 125, 50, 0\.08\)'\s*\n\s+\}\}>",
    re.DOTALL
)
count_card = len(card_rx.findall(src))
src = card_rx.sub('<div className="gov-glass-panel">', src)

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print(f"h1 titles:       {count_h1}")
print(f"table-wrap:      {count_ov}")
print(f"gov-table:       {count_tbl}")
print(f"th stripped:     {count_th}")
print(f"tr hover rm:     {count_tr}")
print(f"td stripped:     {count_td}")
print(f"booking badges:  {count_bk}")
print(f"payment badges:  {count_py}")
print(f"archive badges:  {count_ar}")
print(f"glass panels:    {count_card}")
print(f"Lines: {src.count(chr(10))}")
print("DONE")
