filepath = r'c:\PROGRAMMING\CAPSTONE\frontend\src\pages\Attractions.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Original line count: {len(lines)}")

# === Step 1: Remove dead code (0-indexed 295..441 inclusive) ===
lines = lines[:295] + lines[442:]
print(f"After dead code removal: {len(lines)} lines")

# === Step 2: Insert Pagination component before 'const Attractions = () => {' ===
PAGINATION_LINES = '''\
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
    <button onClick={() => onChange(current - 1)} disabled={current === 1} style={current === 1 ? {...pagBtn, opacity:0.4, cursor:'default'} : pagBtn}>\u2190 Prev</button>
    {Array.from({ length: total }, (_, i) => i + 1).map(p => (
      <button key={p} onClick={() => onChange(p)} style={p === current ? pagBtnActive : pagBtn}>{p}</button>
    ))}
    <button onClick={() => onChange(current + 1)} disabled={current === total} style={current === total ? {...pagBtn, opacity:0.4, cursor:'default'} : pagBtn}>Next \u2192</button>
  </div>
);

'''
for i, l in enumerate(lines):
    if 'const Attractions = () => {' in l:
        attractions_idx = i
        break

lines = lines[:attractions_idx] + [PAGINATION_LINES] + lines[attractions_idx:]
print(f"After Pagination insertion: {len(lines)} lines")

# === Step 3: Find the main return block ===
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

# === Step 4: Build the new return block ===
NEW_RETURN = '''\
  return (
    <div style={pageStyle}>
      {/* Hero */}
      <HeroSlideshow
        title={t('discover_naujan')}
        subtitle={`${attractions.length} ${t('attractions')} ${t('in_oriental_mindoro')}`}
        height="450px"
        showControls={false}
      />

      {/* Filters */}
      <div style={filtersSection}>
        <div style={searchContainer}>
          <input
            type="text"
            placeholder={t('search_attractions')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInput}
          />
          <div style={searchIcon}><Icons.Search size={20} /></div>
        </div>
        <div style={filtersRow}>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
            <option value="name">{t('sort_by')} {t('name')}</option>
            <option value="location">{t('sort_by')} {t('location')}</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={selectStyle}>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? t('filter_by_category') : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* View Toggle */}
      <div style={viewToggleSection}>
        <div style={viewToggleContainer}>
          <button
            onClick={() => { setView('grid'); setCurrentPage(1); }}
            style={view === 'grid' ? activeViewButton : viewButton}
          >
            <span style={viewIcon}>\u229e</span> {t('grid')}
          </button>
          <button
            onClick={() => { setView('list'); setCurrentPage(1); }}
            style={view === 'list' ? activeViewButton : viewButton}
          >
            <span style={viewIcon}>\u2630</span> {t('list')}
          </button>
          <button
            onClick={() => { setView('map'); setCurrentPage(1); }}
            style={view === 'map' ? activeViewButton : viewButton}
          >
            <span style={viewIcon}>\u25ce</span> Map
          </button>
        </div>
        <div style={resultsCount}>
          {filteredAttractions.length} {t('attractions')} {t('found')}
        </div>
      </div>

      {/* Two-column browse layout */}
      <div style={browseLayout}>
        {/* Left: main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {filteredAttractions.length === 0 ? (
            <div style={noResultsContainer}>
              <div style={noResultsIcon}><Icons.Search size={48} /></div>
              <h3>{t('no_attractions_found')}</h3>
              <p>{t('try_adjusting_filters')}</p>
              <button style={clearFiltersButton} onClick={() => { setSearchQuery(''); setFilterCategory('all'); }}>{t('clear')}</button>
            </div>
          ) : (
            <>
              {view === 'grid' && (() => {
                const totalPages = Math.ceil(filteredAttractions.length / GRID_PER_PAGE);
                const paged = filteredAttractions.slice((currentPage - 1) * GRID_PER_PAGE, currentPage * GRID_PER_PAGE);
                return (
                  <>
                    <div style={gridStyle}>
                      {paged.map(attraction => (
                        <div
                          key={attraction.id}
                          style={modernCardStyle}
                          className="modern-card"
                          onClick={() => navigate(`/attractions/${attraction.id}`, { state: { attraction } })}
                        >
                          <div style={cardImageContainer}>
                            <img
                              src={attraction.image_url}
                              alt={attraction.name}
                              style={cardImageStyle}
                              className="card-image"
                              loading="lazy"
                            />
                          </div>
                          <div style={cardContent}>
                            <h3 style={cardTitle}>{attraction.name}</h3>
                            <p style={cardLocation}><Icons.Location size={16} /> {attraction.location}</p>
                            {weatherData[attraction.id] && (
                              <div style={weatherBadge}>
                                <span style={weatherIconSmall}>
                                  {weatherData[attraction.id].condition === 'Clear' ? <Icons.Sun size={16} /> :
                                   weatherData[attraction.id].condition === 'Rain' ? <Icons.Cloud size={16} /> :
                                   weatherData[attraction.id].condition === 'Clouds' ? <Icons.Cloud size={16} /> : <Icons.Sun size={16} />}
                                </span>
                                <span style={weatherTemp}>{weatherData[attraction.id].temperature}&deg;C</span>
                                <span style={{fontSize: '0.85rem', color: '#555', marginLeft: '0.3rem'}}>{weatherData[attraction.id].condition}</span>
                              </div>
                            )}
                            <p style={cardDescription}>{attraction.description?.substring(0, 100)}...</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {totalPages > 1 && <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />}
                  </>
                );
              })()}

              {view === 'list' && (() => {
                const totalPages = Math.ceil(filteredAttractions.length / LIST_PER_PAGE);
                const paged = filteredAttractions.slice((currentPage - 1) * LIST_PER_PAGE, currentPage * LIST_PER_PAGE);
                return (
                  <>
                    <div style={listViewStyle}>
                      {paged.map((attraction, index) => (
                        <div
                          key={attraction.id}
                          style={listCardStyle}
                          className="list-card"
                          onClick={() => navigate(`/attractions/${attraction.id}`, { state: { attraction } })}
                        >
                          {/* Rank badge */}
                          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2,
                                         background: 'rgba(22,163,74,0.92)', color: '#fff',
                                         borderRadius: 8, padding: '2px 9px', fontSize: '0.75rem', fontWeight: 800,
                                         letterSpacing: '0.03em', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>
                            #{(currentPage - 1) * LIST_PER_PAGE + index + 1}
                          </div>
                          {/* Image block */}
                          <div style={{ position: 'relative', flexShrink: 0, width: 240, minHeight: 185, overflow: 'hidden', borderRadius: '10px 0 0 10px', background: '#e8f5e9' }}>
                            <img
                              src={attraction.image_url}
                              alt={attraction.name}
                              style={listImageStyle}
                              loading="lazy"
                              onError={e => { e.target.src = 'https://placehold.co/240x185/e8f5e9/2e7d32?text=No+Image'; }}
                            />
                            {attraction.category && (
                              <span style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: '#fff',
                                              borderRadius: 20, padding: '2px 9px', fontSize: '0.7rem', fontWeight: 700,
                                              backdropFilter: 'blur(4px)', textTransform: 'capitalize' }}>
                                {attraction.category}
                              </span>
                            )}
                          </div>
                          {/* Content */}
                          <div style={listContentStyle}>
                            <div style={{ flex: 1 }}>
                              <h3 style={listTitleStyle}>{attraction.name}</h3>
                              <p style={listLocationStyle}>
                                <Icons.Location size={13} style={{ flexShrink: 0 }} />
                                {attraction.location}
                              </p>
                              <p style={listDescriptionStyle}>
                                {attraction.description?.substring(0, 170)}{attraction.description?.length > 170 ? '\u2026' : ''}
                              </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                              {weatherData[attraction.id] ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                                               background: '#e0f2fe', color: '#0369a1', borderRadius: 20,
                                               padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600 }}>
                                  <span>{weatherData[attraction.id].temperature}&deg;C</span>
                                  <span style={{ color: '#0284c7', fontWeight: 400 }}>{weatherData[attraction.id].condition}</span>
                                </div>
                              ) : <div />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {totalPages > 1 && <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />}
                  </>
                );
              })()}

              {view === 'map' && (
                <div style={{ padding: '1.5rem' }}>
                  <LeafletMap center={mapCenter} zoom={12} markers={markers} style={{ height: '600px', borderRadius: 16 }} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: sticky smart suggestions sidebar */}
        {view !== 'map' && recommendations.length > 0 && (
          <div style={recSidebarWrapper}>
            {renderRecommendations()}
          </div>
        )}
      </div>
    </div>
  );
};
'''

# Replace main return block
lines = lines[:main_return_0] + [NEW_RETURN] + lines[comp_close_0 + 1:]
print(f"After return replacement: {len(lines)} lines")

# === Step 5: Add new style constants after pageStyle ===
NEW_STYLES = '''\

const browseLayout = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '1.5rem',
  padding: '1.5rem 2rem',
  maxWidth: '1600px',
  margin: '0 auto'
};

const recSidebarWrapper = {
  width: 320,
  flexShrink: 0,
  position: 'sticky',
  top: '1.5rem',
  height: 'fit-content',
  alignSelf: 'flex-start'
};

const recSidebar = {
  background: 'rgba(255,255,255,0.82)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: 18,
  border: '1.5px solid rgba(22,163,74,0.15)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  padding: '1.25rem',
  overflow: 'hidden'
};

const recSidebarHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  marginBottom: '1rem',
  paddingBottom: '0.85rem',
  borderBottom: '2px solid #dcfce7',
  flexWrap: 'wrap'
};

const recSidebarTitle = {
  margin: 0,
  color: '#15803d',
  fontSize: '1rem',
  fontWeight: 800
};

const recSidebarSubtitle = {
  margin: 0,
  color: '#6b7280',
  fontSize: '0.75rem',
  fontWeight: 500
};

const recMiniCard = {
  display: 'flex',
  gap: '0.7rem',
  padding: '0.7rem',
  borderRadius: 12,
  background: 'rgba(255,255,255,0.9)',
  border: '1px solid #f0fdf4',
  cursor: 'pointer',
  transition: 'all 0.2s',
  alignItems: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
};

'''

# Find pageStyle definition end
for i, l in enumerate(lines):
    if 'const pageStyle = {' in l:
        pageStyle_start = i
        break

pageStyle_end = None
for i in range(pageStyle_start + 1, pageStyle_start + 15):
    if lines[i].strip() == '};':
        pageStyle_end = i
        break

print(f"pageStyle_start=1-indexed {pageStyle_start+1}, pageStyle_end=1-indexed {pageStyle_end+1}")
lines = lines[:pageStyle_end + 1] + [NEW_STYLES] + lines[pageStyle_end + 1:]

print(f"Final line count: {len(lines)}")

# Write back
with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("SUCCESS: File written.")
