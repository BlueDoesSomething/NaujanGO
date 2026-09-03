/**
 * Server-side message translations for API responses, emails, notifications, validation errors, etc.
 */

export const serverMessages = {
  en: {
    // Authentication & Authorization
    auth_success: 'Authentication successful',
    auth_failed: 'Authentication failed. Please check your credentials.',
    auth_required: 'Authentication required. Please log in.',
    permission_denied: 'You do not have permission to perform this action.',
    token_expired: 'Your session has expired. Please log in again.',
    token_invalid: 'Invalid authentication token.',
    
    // Registration & Account
    registration_success: 'Registration successful! You can now log in.',
    email_already_registered: 'This email is already registered.',
    username_already_taken: 'This username is already taken.',
    invalid_email: 'Invalid email address.',
    password_too_weak: 'Password must be at least 12 characters with uppercase, lowercase, number, and symbol.',
    account_created: 'Account created successfully.',
    account_updated: 'Account updated successfully.',
    account_deleted: 'Account deleted successfully.',
    
    // Validation Errors
    validation_error: 'Validation error. Please check your input.',
    field_required: '{field} is required.',
    field_invalid: '{field} is invalid.',
    field_too_short: '{field} must be at least {min} characters.',
    field_too_long: '{field} cannot exceed {max} characters.',
    value_out_of_range: '{field} must be between {min} and {max}.',
    
    // Booking & Reservations
    booking_created: 'Booking created successfully.',
    booking_updated: 'Booking updated successfully.',
    booking_cancelled: 'Booking cancelled successfully.',
    booking_confirmed: 'Booking confirmed.',
    booking_failed: 'Booking failed. Please try again.',
    no_rooms_available: 'No rooms available for the selected dates.',
    room_not_found: 'Room not found.',
    
    // Payments
    payment_processing: 'Processing your payment...',
    payment_successful: 'Payment successful! Your booking has been confirmed.',
    payment_failed: 'Payment failed. Please try again.',
    payment_cancelled: 'Payment cancelled.',
    payment_pending: 'Payment is pending. You will receive confirmation shortly.',
    refund_successful: 'Refund processed successfully.',
    refund_failed: 'Refund processing failed. Please contact support.',
    
    // Reviews & Ratings
    review_submitted: 'Review submitted successfully!',
    review_submitted_moderation: 'Review submitted and is pending moderation.',
    review_updated: 'Review updated successfully.',
    review_deleted: 'Review deleted successfully.',
    review_already_exists: 'You have already reviewed this item.',
    
    // Itineraries
    itinerary_created: 'Itinerary created successfully.',
    itinerary_updated: 'Itinerary updated successfully.',
    itinerary_deleted: 'Itinerary deleted successfully.',
    itinerary_saved: 'Itinerary saved successfully.',
    itinerary_shared: 'Itinerary shared successfully.',
    itinerary_not_found: 'Itinerary not found.',
    
    // Attractions & Hotels
    attraction_created: 'Attraction created successfully.',
    attraction_updated: 'Attraction updated successfully.',
    attraction_deleted: 'Attraction deleted successfully.',
    attraction_not_found: 'Attraction not found.',
    hotel_created: 'Hotel created successfully.',
    hotel_updated: 'Hotel updated successfully.',
    hotel_deleted: 'Hotel deleted successfully.',
    hotel_not_found: 'Hotel not found.',
    
    // Messages & Communication
    message_sent: 'Message sent successfully.',
    message_failed: 'Failed to send message. Please try again.',
    message_not_found: 'Message not found.',
    
    // General Errors
    internal_error: 'An internal server error occurred. Please try again later.',
    not_found: 'Resource not found.',
    bad_request: 'Invalid request.',
    server_error: 'Server error. Please try again later.',
    network_error: 'Network error. Please check your connection.',
    timeout_error: 'Request timed out. Please try again.',
    
    // File Operations
    file_upload_success: 'File uploaded successfully.',
    file_upload_failed: 'File upload failed. Please try again.',
    file_too_large: 'File is too large. Maximum size is {max}MB.',
    invalid_file_type: 'Invalid file type. Allowed types: {types}.',
    
    // Admin Actions
    admin_action_success: '{action} successful.',
    admin_action_failed: '{action} failed. Please try again.',
    user_created: 'User created successfully.',
    user_updated: 'User updated successfully.',
    user_deleted: 'User deleted successfully.',
    settings_updated: 'Settings updated successfully.',
    
    // Email Templates
    welcome_email_subject: 'Welcome to NaujanGO!',
    welcome_email_body: 'Thank you for registering with us. Your account has been created successfully.',
    reset_password_subject: 'Reset Your Password',
    reset_password_body: 'Click the link below to reset your password.',
    booking_confirmation_subject: 'Booking Confirmation',
    booking_confirmation_body: 'Your booking has been confirmed. Booking ID: {booking_id}',
    payment_receipt_subject: 'Payment Receipt',
    payment_receipt_body: 'Thank you for your payment. Amount: {amount}, Date: {date}',
    review_notification_subject: 'New Review',
    review_notification_body: '{reviewer} has reviewed your {item}.',
    
    // Success Messages
    success: 'Success!',
    operation_successful: 'Operation completed successfully.',
    changes_saved: 'Changes saved successfully.',
    no_changes: 'No changes were made.'
  },
  
  es: {
    // Authentication & Authorization
    auth_success: 'Autenticación exitosa',
    auth_failed: 'La autenticación falló. Por favor, compruebe sus credenciales.',
    auth_required: 'Se requiere autenticación. Por favor, inicie sesión.',
    permission_denied: 'No tiene permiso para realizar esta acción.',
    token_expired: 'Su sesión ha caducado. Por favor, inicie sesión de nuevo.',
    token_invalid: 'Token de autenticación inválido.',
    
    // Registration & Account
    registration_success: '¡Registro exitoso! Ahora puedes iniciar sesión.',
    email_already_registered: 'Este correo ya está registrado.',
    username_already_taken: 'Este nombre de usuario ya está ocupado.',
    invalid_email: 'Dirección de correo inválida.',
    password_too_weak: 'La contraseña debe tener al menos 12 caracteres con mayúsculas, minúsculas, número y símbolo.',
    account_created: 'Cuenta creada exitosamente.',
    account_updated: 'Cuenta actualizada exitosamente.',
    account_deleted: 'Cuenta eliminada exitosamente.',
    
    // Validation Errors
    validation_error: 'Error de validación. Por favor, compruebe su entrada.',
    field_required: '{field} es obligatorio.',
    field_invalid: '{field} es inválido.',
    field_too_short: '{field} debe tener al menos {min} caracteres.',
    field_too_long: '{field} no puede exceder {max} caracteres.',
    value_out_of_range: '{field} debe estar entre {min} y {max}.',
    
    // Booking & Reservations
    booking_created: 'Reserva creada exitosamente.',
    booking_updated: 'Reserva actualizada exitosamente.',
    booking_cancelled: 'Reserva cancelada exitosamente.',
    booking_confirmed: 'Reserva confirmada.',
    booking_failed: 'La reserva falló. Por favor, inténtelo de nuevo.',
    no_rooms_available: 'No hay habitaciones disponibles para las fechas seleccionadas.',
    room_not_found: 'Habitación no encontrada.',
    
    // Payments
    payment_processing: 'Procesando su pago...',
    payment_successful: '¡Pago exitoso! Su reserva ha sido confirmada.',
    payment_failed: 'El pago falló. Por favor, inténtelo de nuevo.',
    payment_cancelled: 'Pago cancelado.',
    payment_pending: 'El pago está pendiente. Recibirá confirmación pronto.',
    refund_successful: 'Reembolso procesado exitosamente.',
    refund_failed: 'El procesamiento del reembolso falló. Por favor, comuníquese con soporte.',
    
    // Reviews & Ratings
    review_submitted: '¡Reseña enviada exitosamente!',
    review_submitted_moderation: 'Reseña enviada y está pendiente de moderación.',
    review_updated: 'Reseña actualizada exitosamente.',
    review_deleted: 'Reseña eliminada exitosamente.',
    review_already_exists: 'Ya has reseñado este artículo.',
    
    // Itineraries
    itinerary_created: 'Itinerario creado exitosamente.',
    itinerary_updated: 'Itinerario actualizado exitosamente.',
    itinerary_deleted: 'Itinerario eliminado exitosamente.',
    itinerary_saved: 'Itinerario guardado exitosamente.',
    itinerary_shared: 'Itinerario compartido exitosamente.',
    itinerary_not_found: 'Itinerario no encontrado.',
    
    // Attractions & Hotels
    attraction_created: 'Atracción creada exitosamente.',
    attraction_updated: 'Atracción actualizada exitosamente.',
    attraction_deleted: 'Atracción eliminada exitosamente.',
    attraction_not_found: 'Atracción no encontrada.',
    hotel_created: 'Hotel creado exitosamente.',
    hotel_updated: 'Hotel actualizado exitosamente.',
    hotel_deleted: 'Hotel eliminado exitosamente.',
    hotel_not_found: 'Hotel no encontrado.',
    
    // Messages & Communication
    message_sent: 'Mensaje enviado exitosamente.',
    message_failed: 'Error al enviar el mensaje. Por favor, inténtelo de nuevo.',
    message_not_found: 'Mensaje no encontrado.',
    
    // General Errors
    internal_error: 'Ocurrió un error interno del servidor. Por favor, inténtelo más tarde.',
    not_found: 'Recurso no encontrado.',
    bad_request: 'Solicitud inválida.',
    server_error: 'Error del servidor. Por favor, inténtelo más tarde.',
    network_error: 'Error de red. Por favor, compruebe su conexión.',
    timeout_error: 'La solicitud agotó el tiempo. Por favor, inténtelo de nuevo.',
    
    // File Operations
    file_upload_success: 'Archivo cargado exitosamente.',
    file_upload_failed: 'Error en la carga del archivo. Por favor, inténtelo de nuevo.',
    file_too_large: 'El archivo es demasiado grande. El tamaño máximo es {max}MB.',
    invalid_file_type: 'Tipo de archivo inválido. Tipos permitidos: {types}.',
    
    // Admin Actions
    admin_action_success: '{action} exitoso.',
    admin_action_failed: '{action} falló. Por favor, inténtelo de nuevo.',
    user_created: 'Usuario creado exitosamente.',
    user_updated: 'Usuario actualizado exitosamente.',
    user_deleted: 'Usuario eliminado exitosamente.',
    settings_updated: 'Configuración actualizada exitosamente.',
    
    // Email Templates
    welcome_email_subject: '¡Bienvenido a NaujanGO!',
    welcome_email_body: 'Gracias por registrarte con nosotros. Tu cuenta ha sido creada exitosamente.',
    reset_password_subject: 'Restablecer tu Contraseña',
    reset_password_body: 'Haz clic en el enlace de abajo para restablecer tu contraseña.',
    booking_confirmation_subject: 'Confirmación de Reserva',
    booking_confirmation_body: 'Tu reserva ha sido confirmada. ID de Reserva: {booking_id}',
    payment_receipt_subject: 'Recibo de Pago',
    payment_receipt_body: 'Gracias por tu pago. Monto: {amount}, Fecha: {date}',
    review_notification_subject: 'Nueva Reseña',
    review_notification_body: '{reviewer} ha reseñado tu {item}.',
    
    // Success Messages
    success: '¡Éxito!',
    operation_successful: 'Operación completada exitosamente.',
    changes_saved: 'Cambios guardados exitosamente.',
    no_changes: 'No se realizaron cambios.'
  },
  
  tl: {
    // Authentication & Authorization
    auth_success: 'Matagumpay na authentication',
    auth_failed: 'Ang authentication ay nabigo. Mangyaring suriin ang inyong mga kredensyal.',
    auth_required: 'Kinakailangan ang authentication. Mangyaring mag-log in.',
    permission_denied: 'Wala kayong pahintulot na gawin ang aksyong ito.',
    token_expired: 'Ang inyong sesyon ay nag-expire na. Mangyaring mag-log in ulit.',
    token_invalid: 'Invalid na authentication token.',
    
    // Registration & Account
    registration_success: 'Matagumpay na pagpaparehistro! Maaari ka na ngayon mag-log in.',
    email_already_registered: 'Ang email na ito ay nakaregistro na.',
    username_already_taken: 'Ang username na ito ay napagsipan na.',
    invalid_email: 'Hindi wastong email address.',
    password_too_weak: 'Ang password ay dapat mayroong kahit 12 na karakter na may uppercase, lowercase, numero, at simbolo.',
    account_created: 'Ang account ay matagumpay na nalikha.',
    account_updated: 'Ang account ay matagumpay na na-update.',
    account_deleted: 'Ang account ay matagumpay na nabura.',
    
    // Validation Errors
    validation_error: 'Validation error. Mangyaring suriin ang inyong input.',
    field_required: '{field} ay kinakailangan.',
    field_invalid: '{field} ay hindi wasto.',
    field_too_short: '{field} ay dapat mayroong kahit {min} na karakter.',
    field_too_long: '{field} ay hindi dapat lumampas sa {max} na karakter.',
    value_out_of_range: '{field} ay dapat nasa pagitan ng {min} at {max}.',
    
    // Booking & Reservations
    booking_created: 'Ang booking ay matagumpay na nalikha.',
    booking_updated: 'Ang booking ay matagumpay na na-update.',
    booking_cancelled: 'Ang booking ay matagumpay na kinansela.',
    booking_confirmed: 'Ang booking ay kumpirmado.',
    booking_failed: 'Ang booking ay nabigo. Mangyaring subukan ulit.',
    no_rooms_available: 'Walang mga kuwarto na available para sa mga napiling petsa.',
    room_not_found: 'Hindi nahanap ang kuwarto.',
    
    // Payments
    payment_processing: 'Pinoproseso ang inyong pagbabayad...',
    payment_successful: 'Matagumpay na pagbabayad! Ang inyong booking ay nag-confirm na.',
    payment_failed: 'Ang pagbabayad ay nabigo. Mangyaring subukan ulit.',
    payment_cancelled: 'Ang pagbabayad ay kinansela.',
    payment_pending: 'Ang pagbabayad ay naghihintay. Makakatanggap kayo ng confirmation sa madaling panahon.',
    refund_successful: 'Ang refund ay matagumpay na naproseso.',
    refund_failed: 'Ang processing ng refund ay nabigo. Mangyaring makipag-ugnayan sa support.',
    
    // Reviews & Ratings
    review_submitted: 'Ang review ay matagumpay na isinumite!',
    review_submitted_moderation: 'Ang review ay isinumite at naghihintay ng moderation.',
    review_updated: 'Ang review ay matagumpay na na-update.',
    review_deleted: 'Ang review ay matagumpay na nabura.',
    review_already_exists: 'Nagreview ka na ng itemang ito.',
    
    // Itineraries
    itinerary_created: 'Ang itinerary ay matagumpay na nalikha.',
    itinerary_updated: 'Ang itinerary ay matagumpay na na-update.',
    itinerary_deleted: 'Ang itinerary ay matagumpay na nabura.',
    itinerary_saved: 'Ang itinerary ay matagumpay na nasave.',
    itinerary_shared: 'Ang itinerary ay matagumpay na nashare.',
    itinerary_not_found: 'Hindi nahanap ang itinerary.',
    
    // Attractions & Hotels
    attraction_created: 'Ang attraction ay matagumpay na nalikha.',
    attraction_updated: 'Ang attraction ay matagumpay na na-update.',
    attraction_deleted: 'Ang attraction ay matagumpay na nabura.',
    attraction_not_found: 'Hindi nahanap ang attraction.',
    hotel_created: 'Ang hotel ay matagumpay na nalikha.',
    hotel_updated: 'Ang hotel ay matagumpay na na-update.',
    hotel_deleted: 'Ang hotel ay matagumpay na nabura.',
    hotel_not_found: 'Hindi nahanap ang hotel.',
    
    // Messages & Communication
    message_sent: 'Ang mensahe ay matagumpay na ipinadala.',
    message_failed: 'Nabigo ang pagpadala ng mensahe. Mangyaring subukan ulit.',
    message_not_found: 'Hindi nahanap ang mensahe.',
    
    // General Errors
    internal_error: 'Ang internal server error ay naganap. Mangyaring subukan ulit mamaya.',
    not_found: 'Hindi nahanap ang resource.',
    bad_request: 'Hindi wastong request.',
    server_error: 'Server error. Mangyaring subukan ulit mamaya.',
    network_error: 'Network error. Mangyaring suriin ang inyong connection.',
    timeout_error: 'Ang request ay nag-timeout. Mangyaring subukan ulit.',
    
    // File Operations
    file_upload_success: 'Ang file ay matagumpay na nag-upload.',
    file_upload_failed: 'Ang file upload ay nabigo. Mangyaring subukan ulit.',
    file_too_large: 'Ang file ay masyadong malaki. Ang maximum size ay {max}MB.',
    invalid_file_type: 'Hindi wastong file type. Allowed types: {types}.',
    
    // Admin Actions
    admin_action_success: '{action} matagumpay.',
    admin_action_failed: '{action} nabigo. Mangyaring subukan ulit.',
    user_created: 'Ang user ay matagumpay na nalikha.',
    user_updated: 'Ang user ay matagumpay na na-update.',
    user_deleted: 'Ang user ay matagumpay na nabura.',
    settings_updated: 'Ang settings ay matagumpay na na-update.',
    
    // Email Templates
    welcome_email_subject: 'Maligayang pagdating sa NaujanGO!',
    welcome_email_body: 'Salamat sa pagrehistro sa amin. Ang inyong account ay matagumpay na nalikha.',
    reset_password_subject: 'I-reset ang Inyong Password',
    reset_password_body: 'Klikehen ang link sa ibaba upang i-reset ang inyong password.',
    booking_confirmation_subject: 'Booking Confirmation',
    booking_confirmation_body: 'Ang inyong booking ay kumpirmado. Booking ID: {booking_id}',
    payment_receipt_subject: 'Payment Receipt',
    payment_receipt_body: 'Salamat sa inyong pagbabayad. Halaga: {amount}, Petsa: {date}',
    review_notification_subject: 'Bagong Review',
    review_notification_body: '{reviewer} ay nagreview ng inyong {item}.',
    
    // Success Messages
    success: 'Tagumpay!',
    operation_successful: 'Ang operasyon ay matagumpay na nakumpleto.',
    changes_saved: 'Ang mga pagbabago ay matagumpay na nasave.',
    no_changes: 'Walang pagbabago na ginawa.'
  }
};

export const getServerMessage = (key, locale = 'en', variables = {}) => {
  const localeMessages = serverMessages[locale] || serverMessages['en'];
  let message = localeMessages[key] || serverMessages['en'][key] || key;
  
  // Replace variables: {var_name} => value
  Object.entries(variables).forEach(([k, v]) => {
    message = message.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  });
  
  return message;
};
