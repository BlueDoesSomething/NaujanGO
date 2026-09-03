import React from 'react';
import './LegalPages.css';

const Terms = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using NaujanGO ("the Service"), you accept and agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use our Service.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            NaujanGO is a tourism platform that provides information about attractions, accommodations, and dining options 
            in Naujan, Oriental Mindoro. Our Service includes:
          </p>
          <ul>
            <li>Attraction listings and detailed information</li>
            <li>Hotel booking and reservation services</li>
            <li>Itinerary planning tools</li>
            <li>Interactive maps and location services</li>
            <li>AI-powered chatbot assistance</li>
            <li>User reviews and ratings</li>
          </ul>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <h3>3.1 Registration</h3>
          <p>
            To access certain features, you may need to create an account. You agree to provide accurate, current, 
            and complete information during registration and to keep your account information updated.
          </p>
          
          <h3>3.2 Account Security</h3>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities 
            that occur under your account. Notify us immediately of any unauthorized use of your account.
          </p>
          
          <h3>3.3 Account Types</h3>
          <ul>
            <li><strong>Tourist:</strong> General users browsing attractions and making bookings</li>
            <li><strong>Owner:</strong> Accommodation owners managing their listings</li>
            <li><strong>Admin:</strong> Platform administrators with full access</li>
          </ul>
        </section>

        <section>
          <h2>4. Bookings and Payments</h2>
          <h3>4.1 Booking Process</h3>
          <p>
            When you make a booking through our Service, you enter into a contract directly with the accommodation provider. 
            NaujanGO acts as a facilitator of the booking process.
          </p>
          
          <h3>4.2 Payment Processing</h3>
          <p>
            Payments are processed through secure third-party payment providers (PayMongo). We do not store your full 
            payment card details on our servers.
          </p>
          
          <h3>4.3 Cancellation Policy</h3>
          <p>
            Cancellation policies vary by accommodation. Please review the specific cancellation policy before completing 
            your booking. Cancellations must be made according to the accommodation's stated policy.
          </p>
        </section>

        <section>
          <h2>5. User Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose</li>
            <li>Post false, misleading, or fraudulent information</li>
            <li>Impersonate any person or entity</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Interfere with the Service's operation or security</li>
            <li>Scrape, copy, or duplicate content without permission</li>
            <li>Post inappropriate, offensive, or harmful content</li>
          </ul>
        </section>

        <section>
          <h2>6. Content and Reviews</h2>
          <h3>6.1 User-Generated Content</h3>
          <p>
            By posting reviews, comments, or other content, you grant NaujanGO a non-exclusive, worldwide, royalty-free 
            license to use, display, and distribute your content on our platform.
          </p>
          
          <h3>6.2 Content Standards</h3>
          <p>
            All reviews and content must be honest, relevant, and respectful. We reserve the right to remove content 
            that violates our guidelines or these Terms.
          </p>
        </section>

        <section>
          <h2>7. Intellectual Property</h2>
          <p>
            All content on NaujanGO, including text, graphics, logos, images, and software, is the property of NaujanGO 
            or its content suppliers and is protected by copyright and intellectual property laws.
          </p>
        </section>

        <section>
          <h2>8. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied. 
            We do not guarantee the accuracy, completeness, or reliability of information provided by third-party 
            accommodation providers.
          </p>
        </section>

        <section>
          <h2>9. Limitation of Liability</h2>
          <p>
            NaujanGO shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
            resulting from your use of the Service. Our total liability for any claims shall not exceed the amount 
            you paid to us in the past 12 months.
          </p>
        </section>

        <section>
          <h2>10. Modifications to Service</h2>
          <p>
            We reserve the right to modify, suspend, or discontinue any part of the Service at any time without notice. 
            We are not liable to you or any third party for any modifications or discontinuations.
          </p>
        </section>

        <section>
          <h2>11. Termination</h2>
          <p>
            We may terminate or suspend your account and access to the Service immediately, without prior notice, 
            if you breach these Terms or engage in fraudulent or illegal activities.
          </p>
        </section>

        <section>
          <h2>12. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the Republic of the Philippines. Any disputes shall be resolved 
            in the courts of Oriental Mindoro, Philippines.
          </p>
        </section>

        <section>
          <h2>13. Contact Information</h2>
          <p>
            If you have questions about these Terms, please contact us at:
          </p>
          <ul>
            <li><strong>Email:</strong> support@naujango.com</li>
            <li><strong>Address:</strong> Naujan, Oriental Mindoro, Philippines</li>
          </ul>
        </section>

        <section>
          <h2>14. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of significant changes by posting the 
            new Terms on this page and updating the "Last Updated" date. Your continued use of the Service after 
            changes constitutes acceptance of the new Terms.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
