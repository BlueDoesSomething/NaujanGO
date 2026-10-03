import React, { useMemo, useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createHotelBooking, fetchHotels, processPayment, startPaymentCheckout } from '../api'
import Icons from '../components/Icons'
import HeroSlideshow from '../components/HeroSlideshow'
import { buildPolicyLines, POLICY_LINE_ICONS } from '../utils/bookingPolicy'
import './Hotels.css'

export default function Hotels() {
  const { t } = useLanguage()
  const { isLoggedIn, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [receiptData, setReceiptData] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null) // 'processing', 'success', 'failed'
  const [checkoutState, setCheckoutState] = useState(null)
  const [policyAgreed, setPolicyAgreed] = useState(false)
  const [searchQuery, setSearchQuery] = useState(location.state?.destination || '')
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [filterMinRating, setFilterMinRating] = useState(0)
  const [filterAmenity, setFilterAmenity] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [view, setView] = useState('grid')

  const getErrorMessage = (value) => {
    if (!value) return t('Booking_Failed') || 'Booking failed. Please try again.'
    if (typeof value === 'string') return value
    if (typeof value === 'object') {
      return value.error_description || value.error || JSON.stringify(value)
    }
    return String(value)
  }

  const handleImageError = (event) => {
    event.currentTarget.onerror = null
    event.currentTarget.src = '/placeholder-hotel.svg'
  }
  const [bookingForm, setBookingForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2,
    rooms: 1,
    paymentMethod: 'card',
    payNow: true,
    cardLast4: '',
    specialRequests: '',
    customerName: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || ''
  })

  const resetBookingForm = (hotel) => {
    setSelectedHotel(hotel)
    setBookingForm({
      checkIn: '',
      checkOut: '',
      guests: 2,
      rooms: 1,
      paymentMethod: 'card',
      payNow: true,
      cardLast4: '',
      specialRequests: '',
      customerName: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || '',
      customerEmail: user?.email || '',
      customerPhone: user?.phone || ''
    })
    setBookingError('')
    setReceiptData(null)
    setCheckoutState(null)
    setPolicyAgreed(false)
    setShowBookingModal(true)
  }

  // Fetch hotels from database
  useEffect(() => {
    const loadHotels = async () => {
      try {
        setLoading(true)
        const response = await fetchHotels()
        setHotels(Array.isArray(response.data?.data) ? response.data.data : [])
      } catch (error) {
        console.error('Failed to fetch hotels:', error)
        // Optionally show error message to user
      } finally {
        setLoading(false)
      }
    }
    loadHotels()
  }, [])

  useEffect(() => {
    if (location.state?.destination) {
      setSearchQuery(location.state.destination)
    }
    // Hydrate booking form from search state
    if (location.state?.checkIn) {
      setBookingForm(prev => ({ ...prev, checkIn: location.state.checkIn }))
    }
    if (location.state?.checkOut) {
      setBookingForm(prev => ({ ...prev, checkOut: location.state.checkOut }))
    }
    if (location.state?.guests) {
      setBookingForm(prev => ({ ...prev, guests: parseInt(location.state.guests) || 2 }))
    }
  }, [location.state])

  const amenityOptions = useMemo(() => {
    const set = new Set()
    hotels.forEach((h) => (Array.isArray(h.amenities) ? h.amenities.forEach((a) => set.add(a)) : null))
    return ['all', ...set]
  }, [hotels])

  const filteredHotels = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const list = hotels.filter((hotel) => {
      const amenitiesText = Array.isArray(hotel.amenities) ? hotel.amenities.join(' ') : ''
      const matchesSearch = !query ||
        `${hotel.name || ''} ${hotel.location || ''} ${hotel.description || ''} ${amenitiesText}`
          .toLowerCase()
          .includes(query)
      const matchesRating = filterMinRating <= 0 || (Number(hotel.rating) || 0) >= filterMinRating
      const matchesAmenity = filterAmenity === 'all' ||
        (Array.isArray(hotel.amenities) ? hotel.amenities : []).some((a) => a.toLowerCase() === filterAmenity.toLowerCase())
      return matchesSearch && matchesRating && matchesAmenity
    })
    const price = (h) => Number(h.pricePerNight) || 0
    const rating = (h) => Number(h.rating) || 0
    const reviews = (h) => Number(h.reviewCount) || 0
    return [...list].sort((a, b) => {
      if (sortBy === 'rating') return rating(b) - rating(a)
      if (sortBy === 'name') return String(a.name || '').localeCompare(String(b.name || ''))
      if (sortBy === 'price') return price(a) - price(b)
      if (sortBy === 'price_high') return price(b) - price(a)
      return reviews(b) - reviews(a)
    })
  }, [hotels, searchQuery, filterMinRating, filterAmenity, sortBy])

  const formatCurrency = (value, currency) => {
    try {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return `${currency === 'PHP' ? '₱' : '$'}0.00`;
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(numValue)
    } catch {
      return `${currency === 'PHP' ? '₱' : '$'}0.00`
    }
  }

  const nights = useMemo(() => {
    if (!bookingForm.checkIn || !bookingForm.checkOut) return 0
    const start = new Date(bookingForm.checkIn)
    const end = new Date(bookingForm.checkOut)
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }, [bookingForm.checkIn, bookingForm.checkOut])

  const totalAmount = useMemo(() => {
    if (!selectedHotel) return 0
    return Number((selectedHotel.pricePerNight * nights * bookingForm.rooms).toFixed(2))
  }, [selectedHotel, nights, bookingForm.rooms])

  const policyLines = useMemo(
    () => buildPolicyLines(selectedHotel, { checkIn: bookingForm.checkIn, showBalance: false, t }),
    [selectedHotel, bookingForm.checkIn, t]
  )

  const handleFormChange = (field, value) => {
    setBookingForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmitBooking = async () => {
    if (!selectedHotel) return
    if (!bookingForm.checkIn || !bookingForm.checkOut) {
      setBookingError(t('Booking_Dates_Required') || 'Please select check-in and check-out dates.')
      return
    }
    if (nights <= 0) {
      setBookingError(t('Booking_Dates_Invalid') || 'Check-out must be after check-in.')
      return
    }
    if (!bookingForm.customerName || !bookingForm.customerEmail) {
      setBookingError(t('Booking_Contact_Required') || 'Please provide your name and email.')
      return
    }
    if (bookingForm.payNow && bookingForm.paymentMethod === 'gcash' && !bookingForm.customerPhone) {
      setBookingError('Please provide your phone number.')
      return
    }
    if (!policyAgreed) {
      setBookingError(t('agree_policies_checkbox'))
      return
    }

    setIsSubmitting(true)
    setBookingError('')
    setPaymentStatus(bookingForm.payNow ? 'processing' : null)
    setCheckoutState(null)

    try {
      const isExternalCheckout = bookingForm.payNow && ['gcash', 'paypal', 'card', 'grabpay', 'qrph'].includes(bookingForm.paymentMethod)
      const payload = {
        hotel_id: selectedHotel.id,
        hotel_name: selectedHotel.name,
        hotel_location: selectedHotel.location,
        price_per_night: selectedHotel.pricePerNight,
        currency: selectedHotel.currency,
        check_in: bookingForm.checkIn,
        check_out: bookingForm.checkOut,
        guests: bookingForm.guests,
        rooms: bookingForm.rooms,
        special_requests: bookingForm.specialRequests,
        payment_method: bookingForm.paymentMethod,
        pay_now: isExternalCheckout ? false : bookingForm.payNow,
        policy_agreed: policyAgreed,
        customer_name: bookingForm.customerName,
        customer_email: bookingForm.customerEmail,
        customer_phone: bookingForm.customerPhone,
        card_last4: null
      }

      const response = await createHotelBooking(payload)
      const bookingData = response.data
      const bookingId = bookingData.booking?.booking_id

      if (isExternalCheckout && bookingData.booking?.booking_id) {
        const checkoutResponse = await startPaymentCheckout({
          booking_id: bookingData.booking.booking_id,
          payment_method: bookingForm.paymentMethod,
          amount: totalAmount,
          currency: selectedHotel.currency,
          customer_email: bookingForm.customerEmail,
          customer_phone: bookingForm.customerPhone
        })

        if (checkoutResponse.status >= 400) {
          setPaymentStatus('failed')
          setBookingError(getErrorMessage(checkoutResponse.data?.error || checkoutResponse.data))
          return
        }

        const checkoutUrl = checkoutResponse.data?.checkout_url
        if (checkoutUrl) {
          setCheckoutState({ url: checkoutUrl, method: bookingForm.paymentMethod })
          setPaymentStatus(null)
          window.location.assign(checkoutUrl)
        } else {
          setPaymentStatus('failed')
          setBookingError(t('checkout_url_error'))
        }
        return
      }

      setShowBookingModal(false)
      if (bookingId) {
        navigate(`/hotels/payment/${bookingId}`)
      } else {
        setReceiptData(bookingData.receipt)
        setShowReceiptModal(true)
      }
    } catch (error) {
      setPaymentStatus('failed')
      setBookingError(getErrorMessage(error.response?.data?.error || error.response?.data))
    } finally {
      setTimeout(() => {
        setIsSubmitting(false)
        if (paymentStatus !== 'success') {
          setPaymentStatus(null)
        }
      }, paymentStatus === 'success' ? 1500 : 0)
    }
  }

  const handleDownloadReceipt = () => {
    if (!receiptData) return
    const lines = [
      `Receipt: ${receiptData.receipt_number}`,
      `Status: ${receiptData.status}`,
      `Payment Status: ${receiptData.payment_status}`,
      `Hotel: ${receiptData.hotel_name}`,
      `Location: ${receiptData.hotel_location || ''}`,
      `Guest: ${receiptData.customer_name}`,
      `Email: ${receiptData.customer_email}`,
      `Phone: ${receiptData.customer_phone || ''}`,
      `Check-in: ${receiptData.check_in}`,
      `Check-out: ${receiptData.check_out}`,
      `Nights: ${receiptData.nights}`,
      `Rooms: ${receiptData.rooms}`,
      `Guests: ${receiptData.guests}`,
      `Total: ${formatCurrency(receiptData.total_amount, receiptData.currency)}`,
      `Payment Method: ${receiptData.payment_method}`,
      `Payment Ref: ${receiptData.payment_reference || ''}`,
      `Issued: ${new Date(receiptData.issued_at).toLocaleString()}`
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const linkEl = document.createElement('a')
    linkEl.href = url
    linkEl.download = `receipt-${receiptData.receipt_number}.txt`
    document.body.appendChild(linkEl)
    linkEl.click()
    document.body.removeChild(linkEl)
    URL.revokeObjectURL(url)
  }

  if (authLoading) {
    return (
      <div className="hotels-page" style={pageStyle}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>{t('loading') || 'Loading...'}</p>
        </div>
      </div>
    )
  }

  // Show login reminder for logged-out users
  if (!isLoggedIn) {
    return (
      <div className="hotels-page" style={pageStyle}>
        {/* Hero Header */}
        <HeroSlideshow 
          title={t('accommodation')}
          subtitle={t('discover_stays_naujan')}
          height="400px"
          showControls={false}
        />

        {/* Login Required Banner */}
        <div style={modernLoginBanner}>
          <div style={modernLoginContent}>
            <div style={modernLoginIconWrapper}>
              <Icons.Shield size={56} color="white" />
            </div>
            <div style={modernLoginText}>
              <h2 style={modernLoginTitle}>{t('login_to_book_hotels')}</h2>
              <p style={modernLoginMessage}>
                {t('login_prompt_hotels')}
              </p>
              <ul style={modernFeaturesList}>
                <li style={modernFeatureItem}>
                  <span style={modernFeatureIcon}><Icons.Check size={12} /></span>
                  <span>{t('feature_view_deals')}</span>
                </li>
                <li style={modernFeatureItem}>
                  <span style={modernFeatureIcon}><Icons.Check size={12} /></span>
                  <span>{t('feature_instant_booking')}</span>
                </li>
                <li style={modernFeatureItem}>
                  <span style={modernFeatureIcon}><Icons.Check size={12} /></span>
                  <span>{t('feature_booking_history')}</span>
                </li>
                <li style={modernFeatureItem}>
                  <span style={modernFeatureIcon}><Icons.Check size={12} /></span>
                  <span>{t('feature_recommendations')}</span>
                </li>
              </ul>
            </div>
          </div>
          <div style={modernLoginButtons}>
            <Link to="/login?redirect=/hotels" style={modernLoginBtn}>
              <Icons.User size={18} />
              {t('login_button') || 'Login'}
            </Link>
            <Link to="/register" style={modernRegisterBtn}>
              <Icons.Sparkles size={18} />
              {t('register') || 'Create Account'}
            </Link>
          </div>
          <Link to="/" style={modernBackHomeLink}>
            ← {t('back_to_home_alt')}
          </Link>
        </div>

        {/* Preview Cards (Blurred) */}
        <div style={previewSection}>
          <h3 style={previewTitle}>{t('preview_available_hotels')}</h3>
          <div style={previewGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={previewCard}>
                <div style={previewImageBlur}></div>
                <div style={previewCardBody}>
                  <div style={previewCardTitle}>{t('preview_placeholder_name')}</div>
                  <div style={previewCardLocation}>{t('preview_placeholder_location')}</div>
                  <div style={previewCardPrice}>{t('preview_placeholder_price')}</div>
                  <div style={previewCardRating}>{t('preview_placeholder_rating')}</div>
                </div>
                <div style={previewLock}><Icons.Shield size={64} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="hotels-page" style={pageStyle}>
      {/* Hero Header */}
      <HeroSlideshow 
        title={t('accommodation')}
        subtitle={t('discover_stays_naujan')}
        height="400px"
        showControls={false}
      />

      <div className="filters-wrapper">
        <div className="search-bar-wrap">
          <div className="search-bar-inner">
            <span className="search-bar-icon"><Icons.Search size={18} /></span>
            <input
              className="search-bar-input"
              placeholder={t('search_placeholder_hotels_page')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>}
          </div>
        </div>

        <div className="filters-control-row">
          <button className={`filter-toggle-btn${filterPanelOpen ? ' filter-toggle-btn--open' : ''}`} onClick={() => setFilterPanelOpen(v => !v)}>
            {t('filters_button')}
          </button>
          <div className="sort-inline-wrap">
            <label className="sort-inline-label">{t('sort')}:</label>
            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="popular">{t('sort_popular')}</option>
              <option value="rating">{t('sort_highest_rated')}</option>
              <option value="name">{t('sort_name_az')}</option>
              <option value="price">{t('sort_price_low')}</option>
              <option value="price_high">{t('sort_price_high')}</option>
            </select>
          </div>
        </div>

        {filterPanelOpen && (
          <div className="filter-panel">
            <div className="filter-panel-grid">
              <div className="filter-group">
                <label className="filter-label">{t('filter_amenities_label')}</label>
                <select className="filter-select" value={filterAmenity} onChange={(e) => setFilterAmenity(e.target.value)}>
                  {amenityOptions.map((a) => <option key={a} value={a}>{a === 'all' ? t('filter_all_amenities') : a}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">{t('filter_minimum_rating_label')}</label>
                <div className="rating-filter-stars">
                  {[0, 1, 2, 3, 4, 5].map(r => (
                    <button key={r} type="button" className={`rating-star-btn${filterMinRating === r ? ' rating-star-btn--active' : ''}`} onClick={() => setFilterMinRating(r)}>
                      {r === 0 ? t('filter_rating_any') : `${r}${t('filter_stars_suffix')}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button className="clear-all-filters-btn" onClick={() => {
              setFilterAmenity('all');
              setFilterMinRating(0);
              setSearchQuery('');
            }}>{t('clear_all_filters_button')}</button>
          </div>
        )}

        <div className="active-chips">
          {searchQuery && <span className="filter-chip">{searchQuery} <button onClick={() => setSearchQuery('')}>✕</button></span>}
          {filterAmenity !== 'all' && <span className="filter-chip">{filterAmenity} <button onClick={() => setFilterAmenity('all')}>✕</button></span>}
          {filterMinRating > 0 && <span className="filter-chip">{filterMinRating}{t('filter_stars_suffix')} <button onClick={() => setFilterMinRating(0)}>✕</button></span>}
        </div>
      </div>

      {!loading && (
        <div className="attr-toolbar">
          <div className="attr-view-toggle">
            <button className={`attr-view-btn${view === 'grid' ? ' attr-view-btn--active' : ''}`} onClick={() => setView('grid')}>{t('view_grid')}</button>
            <button className={`attr-view-btn${view === 'list' ? ' attr-view-btn--active' : ''}`} onClick={() => setView('list')}>{t('view_list')}</button>
          </div>
          <div className="attr-results"><strong>{filteredHotels.length}</strong>{t('hotels_found_count')}</div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>{t('loading_hotels')}</p>
        </div>
      ) : filteredHotels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>{t('no_hotels_found')}</p>
        </div>
      ) : view === 'grid' ? (
        <section style={contentSection}>
          <div style={cardsGrid}>
            {filteredHotels.map((hotel) => {
              const rating = (Number(hotel.rating) || 0).toFixed(1)
              const rooms = Number(hotel.rooms_available)
              const hasRooms = Number.isFinite(rooms)
              const soldOut = hasRooms && rooms <= 0
              const availText = !hasRooms
                ? t('availability_check_availability')
                : soldOut
                  ? t('availability_sold_out')
                  : t('availability_rooms_pattern').replace('{count}', String(rooms))
              const amenities = Array.isArray(hotel.amenities) ? hotel.amenities.slice(0, 3) : []
              const extraAmenities = Array.isArray(hotel.amenities) && hotel.amenities.length > 3 ? hotel.amenities.length - 3 : 0
              return (
            <article key={hotel.id} className="attr-card hotel-card" onClick={() => navigate(`/hotels/${hotel.id}`)}>
              <img
                src={hotel.image || '/placeholder-hotel.svg'}
                alt={hotel.name}
                className="attr-card-img"
                onError={handleImageError}
              />
              <div className="attr-card-shade" />
              {hotel.map ? (
                <a href={hotel.map} className="hotel-map-chip" aria-label={t('button_map')} onClick={(e) => e.stopPropagation()}>
                  <Icons.Location size={13} />
                </a>
              ) : null}
              <div className="attr-card-content">
                <div>
                  <h3 className="attr-card-title">{hotel.name}</h3>
                  <p className="attr-card-location"><Icons.Location size={12} /> {hotel.location}</p>
                </div>
                {hotel.legitimacy && (hotel.legitimacy.business_permit || hotel.legitimacy.dot || hotel.legitimacy.philgeps) ? (
                  <div className="hotel-card-badges">
                    {hotel.legitimacy.business_permit && (
                      <span className="hotel-legit-chip hotel-legit-chip--permit">
                        <Icons.Shield size={11} /> {t('badge_business_permit')}
                      </span>
                    )}
                    {hotel.legitimacy.dot && (
                      <span className="hotel-legit-chip hotel-legit-chip--dot">
                        <Icons.ShieldCheck size={11} /> {t('badge_dot')}
                      </span>
                    )}
                    {hotel.legitimacy.philgeps && (
                      <span className="hotel-legit-chip hotel-legit-chip--ph">
                        <Icons.Document size={11} /> {t('badge_philgeps')}
                      </span>
                    )}
                  </div>
                ) : null}
                <span className="attr-rating-badge">
                  <span className="attr-rating-star">★</span>
                  <span>{rating} ({hotel.reviewCount || 0})</span>
                </span>
                <div className="hotel-card-extra">
                  <div className="hotel-card-meta">
                    <span className="hotel-card-price">
                      <span className="h">{t('price_from')}</span>
                      <b>{formatCurrency(hotel.pricePerNight, hotel.currency)}</b>
                      <span className="n">{t('price_per_night')}</span>
                    </span>
                    <button
                      type="button"
                      className={`hotel-card-avail${soldOut ? ' hotel-card-avail--out' : ''}${!hasRooms ? ' hotel-card-avail--check' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/hotels/${hotel.id}?calendar=1`)
                      }}
                    >
                      {availText}
                    </button>
                  </div>
                  {amenities.length > 0 && (
                    <div className="hotel-card-amenities">
                      {amenities.map((item) => (
                        <span key={item} className="hotel-card-amenity">{item}</span>
                      ))}
                      {extraAmenities > 0 && <span className="hotel-card-amenity">+{extraAmenities}</span>}
                    </div>
                  )}
                </div>
                <span className="attr-glass-btn">
                  <span className="attr-glass-label">{t('view_details')}</span>
                  <span className="attr-glass-chevron"><Icons.ChevronRight size={13} /></span>
                </span>
              </div>
            </article>
              );
            })}
          </div>
        </section>
      ) : (
        <section style={contentSection}>
          <div className="attr-list">
            {filteredHotels.map((hotel, index) => {
              const rating = (Number(hotel.rating) || 0).toFixed(1)
              const rooms = Number(hotel.rooms_available)
              const hasRooms = Number.isFinite(rooms)
              const soldOut = hasRooms && rooms <= 0
              const availText = !hasRooms
                ? t('availability_check_availability')
                : soldOut
                  ? t('availability_sold_out')
                  : t('availability_rooms_pattern').replace('{count}', String(rooms))
              const amenities = Array.isArray(hotel.amenities) ? hotel.amenities.slice(0, 4) : []
              const extraAmenities = Array.isArray(hotel.amenities) && hotel.amenities.length > 4 ? hotel.amenities.length - 4 : 0
              return (
                <div key={hotel.id} className="attr-list-card" onClick={() => navigate(`/hotels/${hotel.id}`)}>
                  <div className="attr-list-rank">#{index + 1}</div>
                  <div className="attr-list-media">
                    <img
                      src={hotel.image || '/placeholder-hotel.svg'}
                      alt={hotel.name}
                      onError={handleImageError}
                    />
                  </div>
                  <div className="attr-list-body">
                    <h3 className="attr-list-title">{hotel.name}</h3>
                    <p className="attr-list-location"><Icons.Location size={13} /> {hotel.location}</p>
                    <p className="attr-list-desc">{hotel.description?.substring(0, 180)}{hotel.description?.length > 180 ? '...' : ''}</p>
                    <div className="attr-list-meta">
                      <span className="attr-list-chip"><span className="attr-rating-star">★</span> {rating} ({hotel.reviewCount || 0})</span>
                      <span className="attr-list-chip">{formatCurrency(hotel.pricePerNight, hotel.currency)}</span>
                      <button
                        type="button"
                        className={`hotel-card-avail${soldOut ? ' hotel-card-avail--out' : ''}${!hasRooms ? ' hotel-card-avail--check' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/hotels/${hotel.id}?calendar=1`)
                        }}
                      >
                        {availText}
                      </button>
                    </div>
                    {hotel.legitimacy && (hotel.legitimacy.business_permit || hotel.legitimacy.dot || hotel.legitimacy.philgeps) ? (
                      <div className="hotel-card-badges" style={{ marginBottom: 6 }}>
                        {hotel.legitimacy.business_permit && (
                          <span className="hotel-legit-chip hotel-legit-chip--permit">
                            <Icons.Shield size={11} /> {t('badge_business_permit')}
                          </span>
                        )}
                        {hotel.legitimacy.dot && (
                          <span className="hotel-legit-chip hotel-legit-chip--dot">
                            <Icons.ShieldCheck size={11} /> {t('badge_dot')}
                          </span>
                        )}
                        {hotel.legitimacy.philgeps && (
                          <span className="hotel-legit-chip hotel-legit-chip--ph">
                            <Icons.Document size={11} /> {t('badge_philgeps')}
                          </span>
                        )}
                      </div>
                    ) : null}
                    {amenities.length > 0 && (
                      <div className="hotel-card-amenities" style={{ marginBottom: 8 }}>
                        {amenities.map((item) => (
                          <span key={item} className="hotel-card-amenity">{item}</span>
                        ))}
                        {extraAmenities > 0 && <span className="hotel-card-amenity">+{extraAmenities}</span>}
                      </div>
                    )}
                    <span className="attr-glass-btn attr-glass-btn--sm">
                      <span className="attr-glass-label">{t('view_details')}</span>
                      <span className="attr-glass-chevron"><Icons.ChevronRight size={13} /></span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {showBookingModal && selectedHotel && (
        <div style={modalBackdrop}>
          <div style={modalCard}>
            <div style={modalHeader}>
              <div>
                <h2 style={modalTitle}>{t('confirm_booking')}</h2>
                <p style={modalSubtitle}>{selectedHotel.name}</p>
              </div>
              <button style={modalClose} onClick={() => setShowBookingModal(false)}><Icons.X size={20} /></button>
            </div>
            <div style={modalBody}>
              <div style={modalGrid}>
                <div>
                  <label style={inputLabel}>{t('form_check_in')}</label>
                  <input
                    type="date"
                    value={bookingForm.checkIn}
                    onChange={(e) => handleFormChange('checkIn', e.target.value)}
                    style={inputField}
                  />
                </div>
                <div>
                  <label style={inputLabel}>{t('form_check_out')}</label>
                  <input
                    type="date"
                    value={bookingForm.checkOut}
                    onChange={(e) => handleFormChange('checkOut', e.target.value)}
                    style={inputField}
                  />
                </div>
                <div>
                  <label style={inputLabel}>{t('form_guests')}</label>
                  <input
                    type="number"
                    min="1"
                    value={bookingForm.guests}
                    onChange={(e) => handleFormChange('guests', Number(e.target.value))}
                    style={inputField}
                  />
                </div>
                <div>
                  <label style={inputLabel}>{t('form_rooms')}</label>
                  <input
                    type="number"
                    min="1"
                    value={bookingForm.rooms}
                    onChange={(e) => handleFormChange('rooms', Number(e.target.value))}
                    style={inputField}
                  />
                </div>
              </div>

              <div style={modalGrid}>
                <div>
                  <label style={inputLabel}>{t('form_full_name')}</label>
                  <input
                    type="text"
                    value={bookingForm.customerName}
                    onChange={(e) => handleFormChange('customerName', e.target.value)}
                    style={inputField}
                  />
                </div>
                <div>
                  <label style={inputLabel}>{t('email')}</label>
                  <input
                    type="email"
                    value={bookingForm.customerEmail}
                    onChange={(e) => handleFormChange('customerEmail', e.target.value)}
                    style={inputField}
                  />
                </div>
                <div>
                  <label style={inputLabel}>{t('phone')}</label>
                  <input
                    type="text"
                    value={bookingForm.customerPhone}
                    onChange={(e) => handleFormChange('customerPhone', e.target.value)}
                    style={inputField}
                  />
                </div>
              </div>

              <div style={modalGrid}>
                <div>
                  <label style={inputLabel}>{t('form_payment_method')}</label>
                  <select
                    value={bookingForm.paymentMethod}
                    onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                    style={inputField}
                  >
                    <option value="gcash">{t('payment_method_gcash')}</option>
                    <option value="paypal">{t('payment_method_paypal')}</option>
                      <option value="bank_transfer">{t('payment_method_bank')}</option>
                    <option value="pay_at_property">{t('payment_method_onsite')}</option>
                  </select>
                </div>

                <div style={checkboxRow}>
                  <input
                    type="checkbox"
                    checked={bookingForm.payNow}
                    onChange={(e) => handleFormChange('payNow', e.target.checked)}
                  />
                  <span>{t('checkbox_pay_now_description')}</span>
                </div>
              </div>

              <div>
                  <label style={inputLabel}>{t('form_special_requests')}</label>
                <textarea
                  rows="3"
                  value={bookingForm.specialRequests}
                  onChange={(e) => handleFormChange('specialRequests', e.target.value)}
                  style={textArea}
                />
              </div>

              {/* Booking policies — shown before payment confirmation */}
              <div>
                <label style={inputLabel}>{t('booking_policies_title')}</label>
                <div style={{ border: '1.5px solid #c8e6c9', borderRadius: '10px', background: '#f8fdf7', padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  {policyLines.map((line, idx) => {
                    const IconComp = Icons[POLICY_LINE_ICONS[line.icon] || 'Info']
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', fontSize: '0.86rem', color: '#374151', lineHeight: 1.5 }}>
                        <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: '#e8f5e9', color: '#2E7D32', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconComp size={14} />
                        </span>
                        <span>{line.text}</span>
                      </div>
                    )
                  })}
                  <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginTop: '0.35rem', paddingTop: '0.85rem', borderTop: '1px dashed #c8e6c9', cursor: 'pointer', fontSize: '0.88rem', color: '#1B5E20', fontWeight: 600, lineHeight: 1.45 }}>
                    <input
                      type="checkbox"
                      checked={policyAgreed}
                      onChange={(e) => setPolicyAgreed(e.target.checked)}
                      style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#2E7D32', flexShrink: 0 }}
                    />
                    <span>{t('agree_policies_checkbox')}</span>
                  </label>
                </div>
              </div>

              <div style={summaryCard}>
                <div style={summaryRow}>
                  <span>{t('nights') || 'Nights'}</span>
                  <strong>{nights || '-'}</strong>
                </div>
                <div style={summaryRow}>
                  <span>{t('rooms') || 'Rooms'}</span>
                  <strong>{bookingForm.rooms}</strong>
                </div>
                <div style={summaryRow}>
                  <span>{t('total_price')}</span>
                  <strong>{formatCurrency(totalAmount, selectedHotel.currency)}</strong>
                </div>
              </div>

              {paymentStatus && (
                <div style={paymentStatus === 'processing' ? paymentProcessingBanner : 
                           paymentStatus === 'success' ? paymentSuccessBanner : 
                           paymentStatus === 'failed' ? paymentFailedBanner : {}}>
                  {paymentStatus === 'processing' && (
                    <>
                      <div style={paymentSpinner}></div>
                      <div>
                        <strong>{t('payment_status_processing')}</strong>
                        <p style={{margin: '0.25rem 0 0 0', fontSize: '0.9rem'}}>
                          {t('payment_processing_msg') || `Processing ${bookingForm.paymentMethod === 'gcash' ? 'GCash' : bookingForm.paymentMethod === 'paypal' ? 'PayPal' : bookingForm.paymentMethod} payment...`}
                        </p>
                      </div>
                    </>
                  )}
                  {paymentStatus === 'success' && (
                    <>
                      <span style={{fontSize: '2rem'}}><Icons.Check size={32} /></span>
                      <div>
                        <strong>{t('payment_successful') || 'Payment Successful!'}</strong>
                        <p style={{margin: '0.25rem 0 0 0', fontSize: '0.9rem'}}>
                          {t('payment_success_msg') || 'Your booking has been confirmed.'}
                        </p>
                      </div>
                    </>
                  )}
                  {paymentStatus === 'failed' && (
                    <>
                      <span style={{fontSize: '2rem'}}><Icons.X size={32} /></span>
                      <div>
                        <strong>{t('payment_failed') || 'Payment Failed'}</strong>
                        <p style={{margin: '0.25rem 0 0 0', fontSize: '0.9rem'}}>
                          {t('payment_failed_msg') || 'Please check your payment details and try again.'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {checkoutState && (
                <div style={checkoutBanner}>
                  <div style={checkoutText}>
                    <strong>{checkoutState.method === 'gcash' ? 'GCash' : 'PayPal'} {t('checkout_ready')}</strong>
                    <p style={{ margin: '0.25rem 0 0 0' }}>{t('checkout_finish_message')}</p>
                  </div>
                  <button
                    type="button"
                    style={checkoutButton}
                    onClick={() => window.open(checkoutState.url, '_blank', 'noopener,noreferrer')}
                  >
                    {t('open_payment')} {checkoutState.method === 'gcash' ? 'GCash' : 'PayPal'}
                  </button>
                </div>
              )}

              {bookingError && <div style={errorBanner}>{getErrorMessage(bookingError)}</div>}
            </div>
            <div style={modalFooter}>
              <button style={ghostButton} onClick={() => setShowBookingModal(false)} disabled={isSubmitting}>
                {t('cancel')}
              </button>
              <button style={primaryButton} onClick={handleSubmitBooking} disabled={isSubmitting || !!checkoutState || !policyAgreed}>
                {isSubmitting ? t('processing') : t('confirm_booking')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceiptModal && receiptData && (
        <div style={modalBackdrop}>
          <div style={modalCard}>
            <div style={modalHeader}>
              <div>
                <h2 style={modalTitle}>{t('modal_booking_receipt')}</h2>
                <p style={modalSubtitle}>{receiptData.receipt_number}</p>
              </div>
              <button style={modalClose} onClick={() => setShowReceiptModal(false)}><Icons.X size={20} /></button>
            </div>
            <div style={modalBody}>
              <div style={receiptGrid}>
                <div>
                  <div style={receiptLabel}>{t('hotel')}</div>
                  <div style={receiptValue}>{receiptData.hotel_name}</div>
                </div>
                <div>
                  <div style={receiptLabel}>{t('location')}</div>
                  <div style={receiptValue}>{receiptData.hotel_location || '-'}</div>
                </div>
                <div>
                  <div style={receiptLabel}>{t('guest')}</div>
                  <div style={receiptValue}>{receiptData.customer_name}</div>
                </div>
                <div>
                  <div style={receiptLabel}>{t('email')}</div>
                  <div style={receiptValue}>{receiptData.customer_email}</div>
                </div>
                <div>
                  <div style={receiptLabel}>{t('form_check_in')}</div>
                  <div style={receiptValue}>{receiptData.check_in}</div>
                </div>
                <div>
                  <div style={receiptLabel}>{t('form_check_out')}</div>
                  <div style={receiptValue}>{receiptData.check_out}</div>
                </div>
                <div>
                  <div style={receiptLabel}>{t('nights') || 'Nights'}</div>
                  <div style={receiptValue}>{receiptData.nights}</div>
                </div>
                <div>
                  <div style={receiptLabel}>{t('total_price')}</div>
                  <div style={receiptValue}>{formatCurrency(receiptData.total_amount, receiptData.currency)}</div>
                </div>
                <div>
                  <div style={receiptLabel}>{t('payment_status') || 'Payment status'}</div>
                  <div style={receiptValue}>{receiptData.payment_status}</div>
                </div>
                <div>
                  <div style={receiptLabel}>{t('form_payment_method')}</div>
                  <div style={receiptValue}>{receiptData.payment_method}</div>
                </div>
                {receiptData.card_last4 && (
                  <div>
                    <div style={receiptLabel}>{t('card_last4') || 'Card ending in'}</div>
                    <div style={receiptValue}>****{receiptData.card_last4}</div>
                  </div>
                )}
                <div>
                  <div style={receiptLabel}>{t('reference') || 'Reference'}</div>
                  <div style={receiptValue}>{receiptData.payment_reference || '-'}</div>
                </div>
              </div>
            </div>
            <div style={modalFooter}>
              <button style={ghostButton} onClick={handleDownloadReceipt}>{t('download_receipt')}</button>
              <button style={primaryButton} onClick={() => setShowReceiptModal(false)}>{t('done')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const pageStyle = {
  minHeight: '100vh',
  paddingBottom: '2rem'
}

const headerSection = {
  background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
  color: 'white',
  padding: '3rem 2rem',
  textAlign: 'center',
  boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
}

const pageTitle = {
  fontSize: '3.5rem',
  fontWeight: '800',
  margin: '0 0 1rem 0',
  textShadow: '0 2px 8px rgba(0,0,0,0.2)'
}

const pageSubtitle = {
  fontSize: '1.2rem',
  opacity: 0.9,
  margin: 0
}

const contentSection = {
  padding: 0
}

const cardsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))',
  gap: '2rem',
  padding: '2rem',
  maxWidth: '1600px',
  margin: '0 auto'
}

const paymentMethodsSection = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  paddingTop: '1rem',
  borderTop: '1px solid #e0e0e0'
}

const paymentMethodsLabel = {
  fontWeight: 700,
  fontSize: '0.95rem',
  color: '#333',
  marginBottom: '0.25rem'
}

const paymentMethodsGrid = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem'
}

const paymentMethodBadge = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  background: 'linear-gradient(135deg, #f5f5f5, #ffffff)',
  border: '1.5px solid #e0e0e0',
  borderRadius: '8px',
  padding: '0.4rem 0.7rem',
  fontSize: '0.8rem',
  fontWeight: '600',
  color: '#555',
  transition: 'all 0.3s ease',
  cursor: 'default',
  ':hover': {
    background: 'linear-gradient(135deg, #e3f2fd, #f5f5f5)',
    borderColor: '#2196f3',
    transform: 'translateY(-2px)',
    boxShadow: '0 2px 8px rgba(33,150,243,0.2)'
  }
}

const paymentMethodIcon = {
  fontSize: '1rem',
  lineHeight: 1
}

const paymentMethodText = {
  fontSize: '0.8rem',
  whiteSpace: 'nowrap'
}

const primaryButton = {
  background: 'linear-gradient(135deg, #16a34a, #059669)',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  padding: '1rem 1.5rem',
  fontWeight: '700',
  cursor: 'pointer',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(22, 163, 74, 0.3)',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 25px rgba(22, 163, 74, 0.4)'
  },
  ':active': {
    transform: 'translateY(0)'
  }
}

const ghostButton = {
  background: 'transparent',
  color: '#16a34a',
  border: 'none',
  padding: '0',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '0.9rem',
  transition: 'all 0.2s ease',
  textDecoration: 'none'
}

const divider = {
  color: '#d1d5db',
  fontSize: '0.8rem'
}

// Modern Login Required Styles
const loginHeroSection = {
  background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
  color: 'white',
  padding: '3rem 2rem',
  textAlign: 'center',
  boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
}

const loginHeroContent = {
  maxWidth: '800px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 1
}

const loginHeroIcon = {
  fontSize: '4rem',
  marginBottom: '1rem',
  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
}

const loginHeroTitle = {
  fontSize: '3.5rem',
  fontWeight: '800',
  margin: '0 0 1rem 0',
  textShadow: '0 2px 10px rgba(0,0,0,0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem'
}

const loginHeroSubtitle = {
  fontSize: '1.3rem',
  opacity: 0.95,
  margin: 0
}

const modernLoginBanner = {
  maxWidth: '900px',
  margin: '3rem auto',
  padding: '0 1.5rem'
}

const modernLoginContent = {
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  borderRadius: '24px',
  padding: 'clamp(1.25rem, 4vw, 3rem)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
  border: '3px solid #16a34a',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1.5rem',
  alignItems: 'flex-start',
  marginBottom: '2rem'
}

const modernLoginIconWrapper = {
  background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
  borderRadius: '20px',
  padding: '1.5rem',
  boxShadow: '0 10px 30px rgba(255, 107, 107, 0.3)',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const modernLoginIcon = {
  fontSize: '3.5rem',
  display: 'block',
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
}

const modernLoginText = {
  flex: '1 1 320px',
  minWidth: 0
}

const modernLoginTitle = {
  fontSize: '2rem',
  fontWeight: '800',
  color: '#15803d',
  margin: '0 0 1rem 0'
}

const modernLoginMessage = {
  fontSize: '1.1rem',
  color: '#555',
  lineHeight: '1.7',
  marginBottom: '1.5rem'
}

const modernFeaturesList = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
}

const modernFeatureItem = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  fontSize: '1rem',
  color: '#333'
}

const modernFeatureIcon = {
  background: '#4caf50',
  color: 'white',
  borderRadius: '50%',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '0.85rem',
  flexShrink: 0
}

const modernLoginButtons = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
  marginBottom: '1.5rem',
  flexWrap: 'wrap'
}

const modernLoginBtn = {
  background: 'linear-gradient(135deg, #16a34a, #059669)',
  color: 'white',
  padding: '1rem 2.5rem',
  borderRadius: '12px',
  textDecoration: 'none',
  fontWeight: '700',
  fontSize: '1.1rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.3s ease',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 6px 20px rgba(22, 163, 74, 0.3)'
}

const modernRegisterBtn = {
  background: 'white',
  color: '#16a34a',
  padding: '1rem 2.5rem',
  borderRadius: '12px',
  textDecoration: 'none',
  fontWeight: '700',
  fontSize: '1.1rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.3s ease',
  border: '3px solid #16a34a',
  cursor: 'pointer',
  boxShadow: '0 6px 20px rgba(22, 163, 74, 0.15)'
}

const modernBackHomeLink = {
  color: '#666',
  textDecoration: 'none',
  fontSize: '1rem',
  display: 'block',
  textAlign: 'center',
  transition: 'color 0.3s ease',
  fontWeight: '600'
}

const previewSection = {
  maxWidth: '1200px',
  margin: '4rem auto',
  padding: '0 1.5rem'
}

const previewTitle = {
  fontSize: '2rem',
  fontWeight: '800',
  color: '#15803d',
  marginBottom: '2rem',
  textAlign: 'center'
}

const previewGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
  gap: '2rem',
  opacity: 0.6
}

const previewCard = {
  background: 'white',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  position: 'relative',
  filter: 'blur(3px)'
}

const previewImageBlur = {
  background: 'linear-gradient(135deg, #e0e0e0, #bdbdbd)',
  height: '200px'
}

const previewCardBody = {
  padding: '1.5rem'
}

const previewCardTitle = {
  fontSize: '1.2rem',
  fontWeight: '700',
  marginBottom: '0.5rem',
  color: '#333'
}

const previewCardLocation = {
  fontSize: '0.95rem',
  color: '#666',
  marginBottom: '0.5rem'
}

const previewCardPrice = {
  fontSize: '1.1rem',
  fontWeight: '700',
  color: '#16a34a',
  marginBottom: '0.5rem'
}

const previewCardRating = {
  fontSize: '0.95rem',
  color: '#ff9800'
}

const previewLock = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontSize: '4rem',
  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
}

const backHomeLink = {
  color: '#666',
  textDecoration: 'none',
  fontSize: '0.95rem',
  display: 'inline-block',
  marginTop: '1rem',
  transition: 'color 0.3s ease'
}

const reminderBanner = {
  backgroundColor: '#fff3cd',
  borderLeft: '4px solid #ffc107',
  margin: '2rem auto',
  maxWidth: '1200px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
}

const reminderContent = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  padding: '1.5rem 2rem',
  flexWrap: 'wrap'
}

const reminderIcon = {
  fontSize: '2.5rem',
  flexShrink: 0
}

const reminderText = {
  flex: '1 1 300px',
  minWidth: '250px'
}

const reminderTitle = {
  margin: '0 0 0.5rem 0',
  color: '#c62828',
  fontSize: '1.3rem',
  fontWeight: 'bold'
}

const reminderMessage = {
  margin: 0,
  color: '#c62828',
  fontSize: '1rem',
  lineHeight: '1.5'
}

const reminderActions = {
  display: 'flex',
  gap: '1rem',
  flexShrink: 0,
  flexWrap: 'wrap'
}

const loginButton = {
  backgroundColor: '#2e7d32',
  color: 'white',
  padding: '0.75rem 2rem',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: '700',
  fontSize: '1rem',
  display: 'inline-block',
  transition: 'background-color 0.3s ease',
  border: 'none'
}

const registerButton = {
  backgroundColor: 'white',
  color: '#2e7d32',
  padding: '0.75rem 2rem',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: '700',
  fontSize: '1rem',
  display: 'inline-block',
  transition: 'all 0.3s ease',
  border: '2px solid #2e7d32'
}

const modalBackdrop = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
  zIndex: 1000
}

const modalCard = {
  backgroundColor: 'white',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '720px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
}

const modalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.5rem 2rem',
  borderBottom: '1px solid #eee'
}

const modalTitle = {
  margin: 0,
  fontSize: '1.5rem',
  fontWeight: 700
}

const modalSubtitle = {
  margin: '0.25rem 0 0 0',
  color: '#666'
}

const modalClose = {
  border: 'none',
  background: 'transparent',
  fontSize: '1.2rem',
  cursor: 'pointer'
}

const modalBody = {
  padding: '1.5rem 2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem'
}

const modalFooter = {
  padding: '1.25rem 2rem',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem',
  borderTop: '1px solid #eee'
}

const modalGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '1rem'
}

const inputLabel = {
  fontSize: '0.85rem',
  fontWeight: 700,
  marginBottom: '0.35rem',
  display: 'block'
}

const inputField = {
  width: '100%',
  padding: '0.65rem 0.75rem',
  borderRadius: '10px',
  border: '1px solid #ddd'
}

const textArea = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '10px',
  border: '1px solid #ddd'
}

const checkboxRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginTop: '1.5rem'
}

const summaryCard = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
}

const summaryRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.95rem'
}

const errorBanner = {
  backgroundColor: '#ffebee',
  color: '#c62828',
  padding: '0.75rem 1rem',
  borderRadius: '10px',
  fontWeight: 600
}

const paymentProcessingBanner = {
  backgroundColor: '#e3f2fd',
  color: '#1565c0',
  padding: '1rem 1.25rem',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  border: '2px solid #90caf9',
  animation: 'pulse 1.5s ease-in-out infinite'
}

const paymentSuccessBanner = {
  backgroundColor: '#e8f5e9',
  color: '#2e7d32',
  padding: '1rem 1.25rem',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  border: '2px solid #81c784',
  animation: 'slideIn 0.3s ease-out'
}

const paymentFailedBanner = {
  backgroundColor: '#ffebee',
  color: '#c62828',
  padding: '1rem 1.25rem',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  border: '2px solid #ef5350'
}

const checkoutBanner = {
  backgroundColor: '#f1f8e9',
  color: '#2e7d32',
  padding: '1rem 1.25rem',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  border: '2px dashed #81c784'
}

const checkoutText = {
  flex: 1
}

const checkoutButton = {
  background: 'linear-gradient(135deg, #16a34a, #059669)',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  padding: '0.7rem 1rem',
  fontWeight: '700',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
}

const paymentSpinner = {
  width: '2rem',
  height: '2rem',
  border: '3px solid rgba(21, 101, 192, 0.2)',
  borderTop: '3px solid #1565c0',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
}

const receiptGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem'
}

const receiptLabel = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#777',
  marginBottom: '0.3rem'
}

const receiptValue = {
  fontWeight: 600
}

// Add hover effects and animations
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    /* Link hover effects */
    a[style*="color: #16a34a"]:hover {
      color: #15803d !important;
      text-decoration: underline !important;
    }
    
    /* Button hover effects */
    button[style*="background: transparent"]:hover {
      color: #15803d !important;
      text-decoration: underline !important;
    }
    
    button[style*="linear-gradient(135deg, #16a34a"]:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4) !important;
    }
    
    /* Login button hover effects */
    a[style*="modernLoginBtn"]:hover,
    a[href="/login"]:hover {
      transform: translateY(-3px) !important;
      box-shadow: 0 8px 25px rgba(22, 163, 74, 0.4) !important;
    }
    
    a[style*="modernRegisterBtn"]:hover,
    a[href="/register"]:hover {
      transform: translateY(-3px) !important;
      background: #f1f8f4 !important;
      box-shadow: 0 8px 25px rgba(22, 163, 74, 0.25) !important;
    }
    
    a[style*="modernBackHomeLink"]:hover {
      color: #16a34a !important;
    }

    /* Spinner animation */
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Pulse animation */
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.85; }
    }

    /* Slide in animation */
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  if (!document.head.querySelector('style[data-hotels-page]')) {
    styleSheet.setAttribute('data-hotels-page', 'true');
    document.head.appendChild(styleSheet);
  }
}
