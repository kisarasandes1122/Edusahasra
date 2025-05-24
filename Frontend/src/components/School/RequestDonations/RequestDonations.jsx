import React, { useState } from 'react';
import { FaArrowLeft, FaPlus, FaMinus, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageSelector/LanguageContext';
import api from '../../../api';
import './RequestDonations.css';

const RequestDonations = () => {
    const navigate = useNavigate();
    const { translations } = useLanguage();

    const MINIMUM_THRESHOLD = 25;

    const availableCategories = [
         { id: 1,  nameSinhala: 'සටහන් පොත්',           nameEnglish: 'Notebooks' },
         { id: 2,  nameSinhala: 'පෑන්/පැන්සල්',         nameEnglish: 'Pens/Pencils' },
         { id: 3,  nameSinhala: 'පාට පෙට්ටි',           nameEnglish: 'Color Boxes (Crayons)' },
         { id: 4,  nameSinhala: 'අභ්‍යාස පොත්',         nameEnglish: 'Exercise Books' },
         { id: 5,  nameSinhala: 'මකනය',               nameEnglish: 'Erasers' },
         { id: 6,  nameSinhala: 'කඩාකරු',             nameEnglish: 'Pencil Sharpeners' },
         { id: 7,  nameSinhala: 'කතුර',               nameEnglish: 'Scissors' },
         { id: 8,  nameSinhala: 'ගලුව',               nameEnglish: 'Glue Sticks' },
         { id: 9,  nameSinhala: 'රූලර්',                nameEnglish: 'Rulers' },
         { id: 10, nameSinhala: 'ජ්‍යෝමැට්‍රි කට්ටලය',  nameEnglish: 'Geometry Sets' },
         { id: 11, nameSinhala: 'ප්‍රොට්රැක්ටරය',       nameEnglish: 'Protractors' },
         { id: 12, nameSinhala: 'සම්බියා (කොම්පස්)',    nameEnglish: 'Compasses' },
         { id: 13, nameSinhala: 'ගණිත උපකරණ',       nameEnglish: 'Counting Cubes/Abacus' },
         { id: 14, nameSinhala: 'චෝක්',                nameEnglish: 'Chalk' },
         { id: 15, nameSinhala: 'චෝක් බ්‍රෂ්',         nameEnglish: 'Chalkboard Brush' },
         { id: 16, nameSinhala: 'සුදුපුවරු',           nameEnglish: 'Whiteboard' },
         { id: 17, nameSinhala: 'සුදුපුවරු ලේඛක',     nameEnglish: 'Whiteboard Markers' },
         { id: 18, nameSinhala: 'පෝස්ටර්',             nameEnglish: 'Posters' },
         { id: 19, nameSinhala: 'සිතියම්',             nameEnglish: 'Maps' },
         { id: 20, nameSinhala: 'බ්‍රිස්ටල් කඩදාසි',   nameEnglish: 'Art Paper (Bristol Paper)' },
         { id: 21, nameSinhala: 'කථා පොත්',           nameEnglish: 'Story Books' },
         { id: 22, nameSinhala: 'පාඨ පොත්',           nameEnglish: 'Textbooks' },
         { id: 23, nameSinhala: 'පුස්තකාල පොත්',     nameEnglish: 'Library Books' },
         { id: 24, nameSinhala: 'අධ්‍යාපනමය ක්‍රීඩා', nameEnglish: 'Educational Games/Puzzles' },
         { id: 25, nameSinhala: 'උගත්කරු මාර්ගෝපදේශ', nameEnglish: 'Teacher’s Guides/Manuals' },
         { id: 26, nameSinhala: 'පරිගණක/ටැබ්ලට්',    nameEnglish: 'Computers/Tablets' },
         { id: 27, nameSinhala: 'ප්‍රින්ටර්',          nameEnglish: 'Printers' },
         { id: 28, nameSinhala: 'ප්‍රොජෙක්ටර්',       nameEnglish: 'Projectors' },
         { id: 29, nameSinhala: 'රවුටර්/අන්තර්ජාල උපාංග', nameEnglish: 'Routers/Internet Devices' },
         { id: 30, nameSinhala: 'සූර්ය ආලෝක යන්ත්‍ර',  nameEnglish: 'Solar Study Lamps' }
    ];

    const [selectedSupplies, setSelectedSupplies] = useState([
        { id: 1, categoryId: 1, quantity: 50 },
        { id: 2, categoryId: 2, quantity: 60 }
    ]);
    const [nextId, setNextId] = useState(3);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

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
        const numericValue = value.replace(/[^0-9]/g, '');
        let newQuantity = numericValue === '' ? MINIMUM_THRESHOLD : parseInt(numericValue, 10);
        newQuantity = Math.max(MINIMUM_THRESHOLD, newQuantity);
        setSelectedSupplies(selectedSupplies.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        ));
      };

      const handleAddItem = () => {
        const unusedCategories = availableCategories.filter(
          category => !selectedSupplies.some(supply => supply.categoryId === category.id)
        );
        if (unusedCategories.length === 0) {
          alert("All categories have been selected already.");
          return;
        }
        const defaultCategoryId = unusedCategories[0].id;
        const newItem = {
          id: nextId,
          categoryId: defaultCategoryId,
          quantity: MINIMUM_THRESHOLD
        };
        setSelectedSupplies([...selectedSupplies, newItem]);
        setNextId(nextId + 1);
      };

      const handleRemoveItem = (id) => {
        setSelectedSupplies(selectedSupplies.filter(item => item.id !== id));
      };

      const handleCategoryChange = (id, categoryId) => {
        const parsedCategoryId = parseInt(categoryId);
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

      const getAvailableCategoriesForItem = (itemId) => {
        const currentItem = selectedSupplies.find(item => item.id === itemId);
        const selectedCategoryIds = selectedSupplies
          .filter(supply => supply.id !== itemId)
          .map(supply => supply.categoryId);
        return availableCategories.filter(
          category => !selectedCategoryIds.includes(category.id) || category.id === currentItem.categoryId
        );
      };


    const handleSubmit = async () => {
        setError(null);
        setIsLoading(true);

        const requestedItemsPayload = selectedSupplies.map(item => {
            const categoryInfo = getCategoryById(item.categoryId);
            if (!categoryInfo) {
                console.error(`Category info not found for ID: ${item.categoryId}`);
                return null;
            }
            return {
                categoryId: item.categoryId,
                quantity: item.quantity,
                categoryNameEnglish: categoryInfo.nameEnglish,
                categoryNameSinhala: categoryInfo.nameSinhala,
            };
        }).filter(item => item !== null);

        if (requestedItemsPayload.length === 0) {
            setError("No valid items selected for the request.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.post('/api/requests/create', {
                requestedItems: requestedItemsPayload,
            });

            if (response.status === 201) {
                window.alert(translations.request_success_alert || 'Donation request created successfully!');
                navigate('/Dashboard');
            } else {
                setError(`Unexpected response status: ${response.status}`);
            }

        } catch (err) {
            console.error("Error creating donation request:", err);
            const message = err.response?.data?.message || err.message || 'Failed to create request. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="donations-container">
            <div className="donations-header">
                <h1>{translations.request_donations}</h1>
            </div>

            <div className="donations-content">
                <div className="back-button-container">
                    <button className="back-button" onClick={handleBack}>
                        <FaArrowLeft className="back-icon" />
                        <span className="back-text">{translations.back}</span>
                    </button>
                </div>

                <div className="donations-form-container">
                    <div className="form-header">
                       <h2 className="form-title">
                           {translations.request_supplies}
                       </h2>
                       <p className="form-subtitle">
                           {translations.please_select_supplies}
                       </p>
                       <p className="form-min-threshold" style={{ color: '#666', marginTop: '5px' }}>
                          {translations.minimum_quantity}
                       </p>
                    </div>

                    {error && <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>Error: {error}</div>}

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
                                      disabled={isLoading}
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
                                      disabled={supply.quantity <= MINIMUM_THRESHOLD || isLoading}
                                    >
                                      <FaMinus />
                                    </button>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      className="quantity-input"
                                      value={supply.quantity}
                                      onChange={(e) => handleQuantityChange(supply.id, e.target.value)}
                                      min={MINIMUM_THRESHOLD}
                                      disabled={isLoading}
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
                                      disabled={isLoading}
                                    >
                                      <FaPlus />
                                    </button>
                                    <button
                                      className="remove-item-button"
                                      onClick={() => handleRemoveItem(supply.id)}
                                      disabled={selectedSupplies.length <= 1 || isLoading}
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
                            disabled={selectedSupplies.length === availableCategories.length || isLoading}
                        >
                             <div className="add-button-icon">
                                <FaPlus className="plus-icon" />
                             </div>
                             <div className="add-text">
                                {translations.add_other_items}
                             </div>
                        </button>
                    </div>

                    <button
                        className="submit-button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? translations.sending_request : translations.send_request}
                    </button>
                </div>

                <div className="scl-contact-info">
                     <p>
                         <span>{translations.need_help_contact_us}</span>
                         <span className="contact-number">0789200730</span>
                     </p>
                </div>
            </div>
        </div>
    );
};

export default RequestDonations;