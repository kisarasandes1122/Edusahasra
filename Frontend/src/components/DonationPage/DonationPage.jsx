// DonationPage.jsx
import React, { useState } from 'react';
import { FaMapMarkerAlt, FaTruck, FaWalking, FaBoxOpen, FaPencilAlt, FaShoppingBag, FaPlus, FaMinus } from 'react-icons/fa';
import './DonationPage.css';
import DonationConfirmationPopup from './DonationConfirmationPopup';

const DonationPage = () => {
  // Item quantities
  const [notebooksQuantity, setNotebooksQuantity] = useState(0);
  const [pencilsQuantity, setPencilsQuantity] = useState(0);
  
  // Delivery options
  const [selectedDelivery, setSelectedDelivery] = useState('partner');
  const [address, setAddress] = useState("No 50 Galle Road, Walana, Panadura, 12500");
  
  // Popup state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [donationId, setDonationId] = useState('');
  
  // Remaining quantities based on the data
  const remainingNotebooks = 20;
  const remainingPencils = 20;

  const handleQuantityChange = (setter, currentValue, maxValue, increment) => {
    const newValue = currentValue + increment;
    if (newValue >= 0 && newValue <= maxValue) {
      setter(newValue);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const donationData = {
      items: {
        notebooks: notebooksQuantity,
        pencils: pencilsQuantity
      },
      delivery: {
        method: selectedDelivery,
        address: selectedDelivery === 'partner' ? address : null
      },
      totalItems: notebooksQuantity + pencilsQuantity
    };
    
    console.log('Submitting donation form', donationData);
    // Generate a donation ID - in a real app, this would come from the server
    setDonationId('D13GD36');
    setShowConfirmation(true);
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    // Reset form
    setNotebooksQuantity(0);
    setPencilsQuantity(0);
  };

  return (
    <>
      <form className="donate__container" onSubmit={handleSubmit}>
        <h1 className="donate__title">Galle Central College</h1>

        <div className="donate__card">
          <div className="donate__cardHeader">
            <h2 className="donate__cardTitle">Selected Items</h2>
          </div>

          <div className="donate__itemRow">
            <div className="donate__itemInfo">
              <div className="donate__itemName">
                <FaBoxOpen className="donate__itemIcon" />
                Notebooks
              </div>
              <div className="donate__itemStats">
                Requested: 100 | Received: 60 | Remaining: {remainingNotebooks}
              </div>
            </div>
            <div className="donate__itemAction">
              <div className="donate__quantityStepper">
                <button 
                  type="button"
                  className="donate__stepperBtn donate__stepperDecrease" 
                  onClick={() => handleQuantityChange(setNotebooksQuantity, notebooksQuantity, remainingNotebooks, -1)}
                  disabled={notebooksQuantity <= 0}
                >
                  <FaMinus />
                </button>
                <input 
                  type="number" 
                  className="donate__stepperInput" 
                  value={notebooksQuantity} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    if (val >= 0 && val <= remainingNotebooks) {
                      setNotebooksQuantity(val);
                    }
                  }}
                  min="0"
                  max={remainingNotebooks}
                />
                <button 
                  type="button"
                  className="donate__stepperBtn donate__stepperIncrease" 
                  onClick={() => handleQuantityChange(setNotebooksQuantity, notebooksQuantity, remainingNotebooks, 1)}
                  disabled={notebooksQuantity >= remainingNotebooks}
                >
                  <FaPlus />
                </button>
              </div>
            </div>
          </div>

          <div className="donate__itemRow">
            <div className="donate__itemInfo">
              <div className="donate__itemName">
                <FaPencilAlt className="donate__itemIcon" />
                Pen/Pencils
              </div>
              <div className="donate__itemStats">
                Requested: 100 | Received: 60 | Remaining: {remainingPencils}
              </div>
            </div>
            <div className="donate__itemAction">
              <div className="donate__quantityStepper">
                <button 
                  type="button"
                  className="donate__stepperBtn donate__stepperDecrease" 
                  onClick={() => handleQuantityChange(setPencilsQuantity, pencilsQuantity, remainingPencils, -1)}
                  disabled={pencilsQuantity <= 0}
                >
                  <FaMinus />
                </button>
                <input 
                  type="number" 
                  className="donate__stepperInput" 
                  value={pencilsQuantity} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    if (val >= 0 && val <= remainingPencils) {
                      setPencilsQuantity(val);
                    }
                  }}
                  min="0"
                  max={remainingPencils}
                />
                <button 
                  type="button"
                  className="donate__stepperBtn donate__stepperIncrease" 
                  onClick={() => handleQuantityChange(setPencilsQuantity, pencilsQuantity, remainingPencils, 1)}
                  disabled={pencilsQuantity >= remainingPencils}
                >
                  <FaPlus />
                </button>
              </div>
            </div>
          </div>

          <div className="donate__itemRow">
            <div className="donate__itemInfo">
              <div className="donate__itemName">
                <FaShoppingBag className="donate__itemIcon" />
                School Bags
              </div>
              <div className="donate__itemStats">
                Requested: 100 | Received: 100 (FullFilled)
              </div>
            </div>
            <div className="donate__itemAction">
              <button className="donate__fulfilledBtn" disabled>
                Fulfilled
              </button>
            </div>
          </div>
        </div>

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
                checked={selectedDelivery === 'partner'}
                onChange={() => setSelectedDelivery('partner')}
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
                checked={selectedDelivery === 'self'}
                onChange={() => setSelectedDelivery('self')}
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
                <label className="donate__locationLabel">Delivery Address</label>
                <div className="donate__locationInput">
                  <FaMapMarkerAlt className="donate__locationIcon" />
                  <input
                    type="text"
                    className="donate__addressInput"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your full delivery address"
                    required={selectedDelivery === 'partner'}
                  />
                </div>
              </div>

              <div className="donate__shippingCost">
                <p>Estimate Shipping cost: LKR 1500 (to be paid upon pickup)</p>
              </div>
            </>
          )}
        </div>

        <div className="donate__card">
          <div className="donate__cardHeader">
            <h2 className="donate__cardTitle">Donation Summary</h2>
          </div>

          <div className="donate__summaryTable">
            <div className="donate__summaryRow">
              <div className="donate__summaryItem">Notebooks</div>
              <div className="donate__summaryQty">{notebooksQuantity} Units</div>
            </div>
            <div className="donate__summaryRow">
              <div className="donate__summaryItem">Pen/Pencils</div>
              <div className="donate__summaryQty">{pencilsQuantity} Units</div>
            </div>
            <div className="donate__summaryDivider"></div>
            <div className="donate__summaryRow donate__summaryTotal">
              <div className="donate__summaryItem">Total Items</div>
              <div className="donate__summaryQty">{notebooksQuantity + pencilsQuantity} Items</div>
            </div>
            
            {selectedDelivery === 'partner' && (
              <div className="donate__summaryRow donate__summaryDelivery">
                <div className="donate__summaryItem">Delivery Method</div>
                <div className="donate__summaryQty">Partner Logistics</div>
              </div>
            )}
            
            {selectedDelivery === 'self' && (
              <div className="donate__summaryRow donate__summaryDelivery">
                <div className="donate__summaryItem">Delivery Method</div>
                <div className="donate__summaryQty">Self Delivery</div>
              </div>
            )}
          </div>

          <div className="donate__disclaimer">
            <p>
              By clicking 'Donate Now,' you confirm that you will arrange the donation for the selected items. 
              {selectedDelivery === 'partner' && ' Shipping costs must be paid upon pickup.'}
              {selectedDelivery === 'self' && ' Please deliver the donation within 1-2 weeks.'}
            </p>
          </div>

          <button 
            type="submit" 
            className="donate__submitBtn"
            disabled={notebooksQuantity + pencilsQuantity === 0}
          >
            Donate Now
          </button>
        </div>
      </form>

      {/* Confirmation Popup */}
      <DonationConfirmationPopup 
        isVisible={showConfirmation}
        onClose={handleCloseConfirmation}
        deliveryMode={selectedDelivery}
        donationId={donationId}
        items={{
          notebooks: notebooksQuantity,
          pencils: pencilsQuantity
        }}
      />
    </>
  );
};

export default DonationPage;