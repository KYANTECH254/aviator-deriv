// import React, { useState, useRef } from 'react';

// export default function Rain({ onClose }: any) {
//     const [inputValues, setInputValues] = useState({ input1: 10.00, input2: 5.00 });
//     const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

//     const popupRef = useRef(null);

//     // Calculate total whenever input values change
//     const total = (inputValues.input1 * inputValues.input2).toFixed(2);

//     // Handle increment/decrement with continuous adjustment on hold
//     const startAdjustingValue = (input: 'input1' | 'input2', change: number) => {
//         setInputValues(prev => ({
//             ...prev,
//             [input]: Math.max(0, prev[input] + change)
//         }));
//         const id = setInterval(() => {
//             setInputValues(prev => ({
//                 ...prev,
//                 [input]: Math.max(0, prev[input] + change)
//             }));
//         }, 100);
//         setIntervalId(id);
//     };

//     const stopAdjustingValue = () => {
//         if (intervalId) {
//             clearInterval(intervalId);
//             setIntervalId(null);
//         }
//     };

//     const handleInputChange = (e: any) => {
//         const { value, id } = e.target;
//         setInputValues((prevValues) => ({
//             ...prevValues,
//             [id]: parseFloat(value) || 0,
//         }));
//     };

//     return (
//         <div ref={popupRef} className="aviator-emojis-popup">
//             <div className="aviator-popup-header">
//                 <div className="aviator-popup-header-left">RAIN</div>
//                 <div onClick={onClose} id="aviator-gamelimits-popup-close" className="aviator-popup-header-right">
//                     <i className="fa fa-times" aria-hidden="true"></i>
//                 </div>
//             </div>

//             <div className="aviator-popup-emojis-body">
//                 <div className="aviator-popup-emojis-body-top-text mb3">
//                     This feature will give a selected amount to random users in chat.
//                 </div>

//                 <div className="aviator-rain-input-container column">
//                     <div className="aviator-rain-input-label">Amount per player KES</div>
//                     <div className="aviator-bet-container">
//                         <div
//                             className="minus-btn"
//                             id="minus-input3"
//                             onMouseDown={() => startAdjustingValue('input1', -1)}
//                             onMouseUp={stopAdjustingValue}
//                             onMouseLeave={stopAdjustingValue}
//                         >-</div>
//                         <input
//                             type="number"
//                             className="rain-bet-input"
//                             id="input1"
//                             onChange={handleInputChange}
//                             value={inputValues.input1.toFixed(2)}
//                         />
//                         <div
//                             className="plus-btn"
//                             id="plus-input3"
//                             onMouseDown={() => startAdjustingValue('input1', 1)}
//                             onMouseUp={stopAdjustingValue}
//                             onMouseLeave={stopAdjustingValue}
//                         >+</div>
//                     </div>
//                 </div>
//                 <div className="aviator-rain-input-container column">
//                     <div className="aviator-rain-input-label">Number of players</div>
//                     <div className="aviator-bet-container">
//                         <div
//                             className="minus-btn"
//                             id="minus-input4"
//                             onMouseDown={() => startAdjustingValue('input2', -1)}
//                             onMouseUp={stopAdjustingValue}
//                             onMouseLeave={stopAdjustingValue}
//                         >-</div>
//                         <input
//                             type="number"
//                             className="rain-bet-input"
//                             id="input2"
//                             onChange={handleInputChange}
//                             value={inputValues.input2.toFixed(2)}
//                         />
//                         <div
//                             className="plus-btn"
//                             id="plus-input4"
//                             onMouseDown={() => startAdjustingValue('input2', 1)}
//                             onMouseUp={stopAdjustingValue}
//                             onMouseLeave={stopAdjustingValue}
//                         >+</div>
//                     </div>
//                 </div>
//                 <div className="column">
//                     <div className="aviator-rain-input-label">Total, KES</div>
//                     <div className="rain-total-text">{total}</div>
//                 </div>

//                 <button className="aviator-rain-btns success-btn">RAIN {total} KES</button>
//             </div>
//         </div>
//     );
// }
