import React, { useState } from 'react';
import { FaArrowLeft, FaPlus, FaMinus, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './RequestDonations.css';

const RequestDonations = () => {
  const navigate = useNavigate();
  
  // Minimum threshold for all donations
  const MINIMUM_THRESHOLD = 25;

  // Available categories for the dropdown
  const availableCategories = [
    { id: 1, nameSinhala: 'සටහන් පොත්', nameEnglish: 'Notebooks' },
    { id: 2, nameSinhala: 'පෑන්/පැන්සල්', nameEnglish: 'Pens/Pencils' },
    { id: 3, nameSinhala: 'පාට පෙට්ටි', nameEnglish: 'Color Boxes' },
    { id: 4, nameSinhala: 'අභ්‍යාස පොත්', nameEnglish: 'Exercise Books' },
    { id: 5, nameSinhala: 'ගණිත උපකරණ', nameEnglish: 'Math Tools' }
  ];

  // Selected supplies - initialize with minimum threshold
  const [selectedSupplies, setSelectedSupplies] = useState([
    { id: 1, categoryId: 1, quantity: 50 },
    { id: 2, categoryId: 2, quantity: 60 }
  ]);

  // For generating unique IDs for new items
  const [nextId, setNextId] = useState(3);

  const handleBack = () => {
    navigate('/Dashboard');
  };

  const getCategoryById = (categoryId) => {
    return availableCategories.find(category => category.id === categoryId);
  };

  const incrementQuantity = (id) => {
    setSelectedSupplies(selectedSupplies.map(item => 
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const decrementQuantity = (id) => {
    setSelectedSupplies(selectedSupplies.map(item => 
      item.id === id ? 
        { ...item, quantity: Math.max(MINIMUM_THRESHOLD, item.quantity - 1) } : 
        item
    ));
  };

  const handleQuantityChange = (id, value) => {
    // Allow only numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Convert to number or default to minimum threshold if empty
    let newQuantity = numericValue === '' ? MINIMUM_THRESHOLD : parseInt(numericValue, 10);
    
    // Ensure the quantity is not below the minimum threshold
    newQuantity = Math.max(MINIMUM_THRESHOLD, newQuantity);
    
    setSelectedSupplies(selectedSupplies.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleAddItem = () => {
    // Find first category ID that isn't already selected, or default to first
    const unusedCategories = availableCategories.filter(
      category => !selectedSupplies.some(supply => supply.categoryId === category.id)
    );
    
    // If there are no unused categories, don't add a new item
    if (unusedCategories.length === 0) {
      alert("All categories have been selected already.");
      return;
    }
    
    const defaultCategoryId = unusedCategories[0].id;
    
    const newItem = {
      id: nextId,
      categoryId: defaultCategoryId,
      quantity: MINIMUM_THRESHOLD // Start with minimum threshold
    };
    
    setSelectedSupplies([...selectedSupplies, newItem]);
    setNextId(nextId + 1);
  };

  const handleRemoveItem = (id) => {
    setSelectedSupplies(selectedSupplies.filter(item => item.id !== id));
  };

  const handleCategoryChange = (id, categoryId) => {
    const parsedCategoryId = parseInt(categoryId);
    
    // Check if the category is already selected by another item
    const isAlreadySelected = selectedSupplies.some(
      item => item.id !== id && item.categoryId === parsedCategoryId
    );
    
    if (isAlreadySelected) {
      alert("This category is already selected for another item.");
      return;
    }
    
    setSelectedSupplies(selectedSupplies.map(item => 
      item.id === id ? { ...item, categoryId: parsedCategoryId } : item
    ));
  };

  const renderCategoryOption = (category) => {
    return `${category.nameSinhala} | ${category.nameEnglish}`;
  };

  // Function to get available categories for a specific supply item
  const getAvailableCategoriesForItem = (itemId) => {
    const currentItem = selectedSupplies.find(item => item.id === itemId);
    
    // Get all category IDs that are already selected by other items
    const selectedCategoryIds = selectedSupplies
      .filter(supply => supply.id !== itemId)
      .map(supply => supply.categoryId);
    
    // Filter out categories that are already selected by other items
    // Include the category that is currently selected by this item
    return availableCategories.filter(
      category => !selectedCategoryIds.includes(category.id) || category.id === currentItem.categoryId
    );
  };

  return (
    <div className="donations-container">
      <div className="donations-header">
        <h1>සැපයුම් ඉල්ලන්න Request Donations</h1>
      </div>

      <div className="donations-content">
        <div className="back-button-container">
          <button className="back-button" onClick={handleBack}>
            <FaArrowLeft className="back-icon" />
            <span className="back-text">ආපසු</span>
          </button>
        </div>

        <div className="donations-form-container">
          <div className="form-header">
            <h2 className="form-title">
              සැපයුම් ඉල්ලන්න | Ask for Supplies
            </h2>
            <p className="form-subtitle">
              කරුණාකර ඔබගේ අවශ්‍ය සියලුම සැපයුම් තෝරන්න
            </p>
            <p className="form-subtitle-english">
              Please select all the supplies for your school
            </p>
            <p className="form-min-threshold" style={{ color: '#666', marginTop: '5px' }}>
              <span className="min-threshold-sinhala">අවම ප්‍රමාණය: </span>
              <span className="min-threshold-english">Minimum quantity: {MINIMUM_THRESHOLD}</span>
            </p>
          </div>

          <div className="supplies-list">
            {selectedSupplies.map(supply => {
              const category = getCategoryById(supply.categoryId);
              const availableCategoriesForItem = getAvailableCategoriesForItem(supply.id);
              
              return (
                <div key={supply.id} className="supply-item">
                  <div className="supply-dropdown-container">
                    <select 
                      className="category-dropdown"
                      value={supply.categoryId}
                      onChange={(e) => handleCategoryChange(supply.id, e.target.value)}
                    >
                      {availableCategoriesForItem.map(category => (
                        <option key={category.id} value={category.id}>
                          {renderCategoryOption(category)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="supply-controls">
                    <button 
                      className="quantity-button decrease" 
                      onClick={() => decrementQuantity(supply.id)}
                      disabled={supply.quantity <= MINIMUM_THRESHOLD}
                    >
                      <FaMinus />
                    </button>
                    <input
                      type="text"
                      className="quantity-input"
                      value={supply.quantity}
                      onChange={(e) => handleQuantityChange(supply.id, e.target.value)}
                      min={MINIMUM_THRESHOLD}
                      style={{
                        width: '50px',
                        textAlign: 'center',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '4px'
                      }}
                    />
                    <button 
                      className="quantity-button increase" 
                      onClick={() => incrementQuantity(supply.id)}
                    >
                      <FaPlus />
                    </button>
                    <button 
                      className="remove-item-button"
                      onClick={() => handleRemoveItem(supply.id)}
                      disabled={selectedSupplies.length <= 1}
                      title={selectedSupplies.length <= 1 ? "At least one item is required" : ""}
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              );
            })}

            <button 
              className="add-item-button" 
              onClick={handleAddItem}
              disabled={selectedSupplies.length === availableCategories.length}
            >
              <div className="add-button-icon">
                <FaPlus className="plus-icon" />
              </div>
              <div className="add-text">
                <span className="add-text-sinhala">වෙනත් අයිතම එකතු කරන්න</span>
                <span className="add-text-english">Add Other Items</span>
              </div>
            </button>
          </div>

          <button className="submit-button">
            <span className="submit-text-sinhala">ඉල්ලීම යවන්න</span>
            <span className="submit-text-english">Send Request</span>
          </button>
        </div>

        <div className="scl-contact-info">
          <p>
            <span className="contact-text-sinhala">උදව් අවශ්‍යද? අපිට කථා කරන්න : </span>
            <span className="contact-number">0789200730</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RequestDonations;