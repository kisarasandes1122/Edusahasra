// frontend/src/components/Donor/DonationPage/DonationPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaTruck, FaWalking, FaBoxOpen, FaPencilAlt, /* Add other relevant icons */ FaMinus, FaPlus } from 'react-icons/fa';
import api from '../../../api'; // Assuming api.js is setup
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import DonationConfirmationPopup from './DonationConfirmationPopup';
import './DonationPage.css';

const DonationPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [requestDetails, setRequestDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [donatedQuantities, setDonatedQuantities] = useState({}); // { categoryId: quantity }
  const [selectedDelivery, setSelectedDelivery] = useState('partner'); // 'partner' or 'self'
  const [address, setAddress] = useState("No 50 Galle Road, Walana, Panadura, 12500"); // Default/fetch user address later
  const [donorRemarks, setDonorRemarks] = useState(''); // Optional remarks
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [createdDonationId, setCreatedDonationId] = useState('');

  // Fetch Request Details
  useEffect(() => {
    const fetchRequest = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`DonationPage: Fetching request details for ID: ${requestId}`);
        const response = await api.get(`/api/requests/${requestId}`);
        console.log("DonationPage: API Response:", response.data);
        if (!response.data || !response.data.school || !response.data.requestedItems) {
           throw new Error("Incomplete request data received from API.");
        }
        setRequestDetails(response.data);
        // Initialize donatedQuantities state
        const initialQuantities = {};
        response.data.requestedItems.forEach(item => {
          initialQuantities[item.categoryId] = 0; // Start with 0 for donation
        });
        setDonatedQuantities(initialQuantities);

      } catch (err) {
        console.error("Error fetching request details for donation:", err);
        const message = err.response?.data?.message || err.message || 'Failed to load request details.';
        setError(message);
        setRequestDetails(null);
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchRequest();
    } else {
      setError("Request ID is missing.");
      setLoading(false);
    }
  }, [requestId]);

  // Handle Quantity Changes
  const handleQuantityChange = (categoryId, increment) => {
    const currentItem = requestDetails.requestedItems.find(item => item.categoryId === categoryId);
    if (!currentItem) return;

    const remaining = (currentItem.quantity || 0) - (currentItem.quantityReceived || 0);
    const currentValue = donatedQuantities[categoryId] || 0;
    const newValue = currentValue + increment;

    if (newValue >= 0 && newValue <= remaining) {
      setDonatedQuantities(prev => ({
        ...prev,
        [categoryId]: newValue
      }));
    }
  };

   // Handle direct input change
   const handleQuantityInputChange = (categoryId, value) => {
      const currentItem = requestDetails.requestedItems.find(item => item.categoryId === categoryId);
      if (!currentItem) return;

      const remaining = (currentItem.quantity || 0) - (currentItem.quantityReceived || 0);
      let numericValue = parseInt(value, 10);

      // Handle empty input or non-numeric input gracefully
      if (isNaN(numericValue)) {
        numericValue = 0; // Or keep the previous value, depending on desired UX
      }

      // Clamp the value between 0 and remaining
      const clampedValue = Math.max(0, Math.min(numericValue, remaining));

      setDonatedQuantities(prev => ({
          ...prev,
          [categoryId]: clampedValue
      }));
  };


  // Calculate total items being donated
  const totalItemsDonating = Object.values(donatedQuantities).reduce((sum, qty) => sum + (qty || 0), 0);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalItemsDonating === 0) {
      alert('Please select a quantity for at least one item to donate.');
      return;
    }
    if (selectedDelivery === 'partner' && !address.trim()) {
        alert('Please provide your address for courier pickup.');
        return;
    }

    setSubmitting(true);
    setError(null); // Clear previous errors

    const itemsToDonate = requestDetails.requestedItems
      .filter(item => donatedQuantities[item.categoryId] > 0)
      .map(item => ({
        categoryId: item.categoryId,
        quantityDonated: donatedQuantities[item.categoryId],
        categoryNameEnglish: item.categoryNameEnglish, // Include names
        categoryNameSinhala: item.categoryNameSinhala
      }));

    const donationData = {
      donationRequestId: requestId,
      itemsDonated: itemsToDonate,
      deliveryMethod: selectedDelivery === 'partner' ? 'Courier' : 'Self-Delivery', // Match backend enum
      donorAddress: selectedDelivery === 'partner' ? address : undefined,
      donorRemarks: donorRemarks || undefined,
      // shippingCostEstimate: selectedDelivery === 'partner' ? 1500 : undefined // Example, get this dynamically later
    };

    try {
      console.log('Submitting Donation Data:', donationData);
      const response = await api.post('/api/donations', donationData); // Use the correct endpoint
      console.log('Donation Creation Response:', response.data);

      if (response.status === 201 && response.data.donation) {
          setCreatedDonationId(response.data.donation._id); // Get ID from response
          setShowConfirmation(true);
      } else {
          throw new Error(response.data.message || 'Failed to submit donation.');
      }
    } catch (err) {
      console.error("Error submitting donation:", err);
      const message = err.response?.data?.message || err.message || 'An error occurred during donation submission.';
      setError(message);
      setShowConfirmation(false); // Ensure confirmation isn't shown on error
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    // Optionally navigate away or reset form further
    navigate('/my-donations'); // Or navigate('/')
  };

  // --- Render Logic ---
  if (loading) {
    return <div className="donate__container"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="donate__container"><p className="error-message" style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p></div>;
  }

  if (!requestDetails) {
    return <div className="donate__container"><p>Could not load donation details.</p></div>;
  }

  return (
    <>
      <form className="donate__container" onSubmit={handleSubmit}>
        <h1 className="donate__title">Donate to: {requestDetails.school?.schoolName || 'School'}</h1>
        <p style={{ textAlign: 'left', marginBottom: '20px', color: '#555' }}>Request ID: {requestId}</p>

        {/* Items Section */}
        <div className="donate__card">
          <div className="donate__cardHeader">
            <h2 className="donate__cardTitle">Select Items to Donate</h2>
          </div>

          {requestDetails.requestedItems && requestDetails.requestedItems.length > 0 ? (
            requestDetails.requestedItems.map(item => {
              const remaining = (item.quantity || 0) - (item.quantityReceived || 0);
              const currentDonationQty = donatedQuantities[item.categoryId] || 0;

              // Simple way to get an icon - replace with better logic if needed
              const Icon = item.categoryNameEnglish?.toLowerCase().includes('book') || item.categoryNameEnglish?.toLowerCase().includes('note') ? FaBoxOpen : FaPencilAlt;

              return (
                <div className="donate__itemRow" key={item.categoryId}>
                  <div className="donate__itemInfo">
                    <div className="donate__itemName">
                      <Icon className="donate__itemIcon" />
                      {item.categoryNameEnglish} ({item.categoryNameSinhala})
                    </div>
                    <div className="donate__itemStats">
                      Requested: {item.quantity} | Received: {item.quantityReceived} | Remaining: {remaining}
                    </div>
                  </div>
                  <div className="donate__itemAction">
                    {remaining > 0 ? (
                      <div className="donate__quantityStepper">
                        <button
                          type="button"
                          className="donate__stepperBtn donate__stepperDecrease"
                          onClick={() => handleQuantityChange(item.categoryId, -1)}
                          disabled={currentDonationQty <= 0}
                        >
                          <FaMinus />
                        </button>
                        <input
                          type="number"
                          className="donate__stepperInput"
                          value={currentDonationQty}
                           onChange={(e) => handleQuantityInputChange(item.categoryId, e.target.value)}
                          min="0"
                          max={remaining}
                          aria-label={`Quantity for ${item.categoryNameEnglish}`}
                        />
                        <button
                          type="button"
                          className="donate__stepperBtn donate__stepperIncrease"
                          onClick={() => handleQuantityChange(item.categoryId, 1)}
                          disabled={currentDonationQty >= remaining}
                        >
                          <FaPlus />
                        </button>
                      </div>
                    ) : (
                      <button className="donate__fulfilledBtn" disabled>
                        Fulfilled
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p>No items found for this request.</p>
          )}
        </div>

        {/* Shipping Section */}
        <div className="donate__card">
          <div className="donate__cardHeader">
            <h2 className="donate__cardTitle">Shipping & Logistics</h2>
          </div>

          <div className="donate__deliveryOptions">
            <div className="donate__deliveryOption">
              <input
                type="radio"
                id="partner"
                name="delivery"
                value="partner"
                checked={selectedDelivery === 'partner'}
                onChange={(e) => setSelectedDelivery(e.target.value)}
                className="donate__deliveryRadio"
              />
              <label htmlFor="partner" className="donate__deliveryLabel">
                <FaTruck className="donate__deliveryIcon" />
                Partner Logistic (Koombiyo Courier Service)
              </label>
            </div>
            <div className="donate__deliveryOption">
              <input
                type="radio"
                id="self"
                name="delivery"
                value="self"
                checked={selectedDelivery === 'self'}
                onChange={(e) => setSelectedDelivery(e.target.value)}
                className="donate__deliveryRadio"
              />
              <label htmlFor="self" className="donate__deliveryLabel">
                <FaWalking className="donate__deliveryIcon" />
                Self Delivery
              </label>
            </div>
          </div>

          {selectedDelivery === 'partner' && (
            <>
              <div className="donate__locationSection">
                <label htmlFor="donorAddress" className="donate__locationLabel">Pickup Address</label>
                <div className="donate__locationInput">
                  <FaMapMarkerAlt className="donate__locationIcon" />
                  <input
                    type="text"
                    id="donorAddress"
                    className="donate__addressInput"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your full pickup address"
                    required={selectedDelivery === 'partner'}
                  />
                </div>
              </div>
              <div className="donate__shippingCost">
                <p>Estimate Shipping cost: LKR 1500 (to be paid upon pickup)</p>
              </div>
            </>
          )}

           {/* Optional Donor Remarks */}
           <div className="donate__locationSection" style={{marginTop: '20px'}}>
              <label htmlFor="donorRemarks" className="donate__locationLabel">Optional Remarks</label>
              <textarea
                  id="donorRemarks"
                  className="donate__addressInput" // Reuse styling or create new
                  value={donorRemarks}
                  onChange={(e) => setDonorRemarks(e.target.value)}
                  placeholder="Any specific notes for the school or courier?"
                  rows="3"
                  style={{ padding: '12px' }} // Adjust padding for textarea
              />
          </div>
        </div>

        {/* Summary Section */}
        <div className="donate__card">
          <div className="donate__cardHeader">
            <h2 className="donate__cardTitle">Donation Summary</h2>
          </div>
          <div className="donate__summaryTable">
            {requestDetails.requestedItems
              .filter(item => donatedQuantities[item.categoryId] > 0)
              .map(item => (
                <div className="donate__summaryRow" key={item.categoryId}>
                  <div className="donate__summaryItem">{item.categoryNameEnglish}</div>
                  <div className="donate__summaryQty">{donatedQuantities[item.categoryId]} Units</div>
                </div>
              ))
            }
            {totalItemsDonating > 0 && <div className="donate__summaryDivider"></div>}
            <div className="donate__summaryRow donate__summaryTotal">
              <div className="donate__summaryItem">Total Items</div>
              <div className="donate__summaryQty">{totalItemsDonating} Items</div>
            </div>
            <div className="donate__summaryRow donate__summaryDelivery">
              <div className="donate__summaryItem">Delivery Method</div>
              <div className="donate__summaryQty">{selectedDelivery === 'partner' ? 'Partner Logistics' : 'Self Delivery'}</div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="donate__disclaimer">
             <p>
              By clicking 'Confirm Donation,' you commit to providing the selected items.
              {selectedDelivery === 'partner' && ' The courier will contact you for pickup, and shipping costs must be paid upon pickup.'}
              {selectedDelivery === 'self' && ' Please arrange delivery to the school within 1-2 weeks.'}
              The school will be notified of your commitment.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="donate__submitBtn"
            disabled={totalItemsDonating === 0 || submitting || loading}
          >
            {submitting ? 'Submitting...' : 'Confirm Donation'}
          </button>
            {error && <p style={{ color: 'red', marginTop: '15px', textAlign: 'center' }}>Error: {error}</p>}
        </div>
      </form>

      {/* Confirmation Popup */}
      <DonationConfirmationPopup
        isVisible={showConfirmation}
        onClose={handleCloseConfirmation}
        deliveryMode={selectedDelivery}
        donationId={createdDonationId} // Pass the ID received from backend
        items={donatedQuantities} // Pass the final quantities
      />
    </>
  );
};

export default DonationPage;