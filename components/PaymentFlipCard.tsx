import React from 'react';
import { MastercardIcon } from './icons/Icons';

const PaymentFlipCard: React.FC = () => {
    return (
        <div className="flip-card">
            <div className="flip-card-inner">
                <div className="flip-card-front">
                    <p className="heading_8">MASTERCARD</p>
                    <MastercardIcon className="logo" width="40" height="40" />
                    <div className="chip"></div>
                    <p className="number">1234 5678 9876 5432</p>
                    <p className="valid_thru">VALID THRU</p>
                    <p className="date_8">12/28</p>
                    <p className="name">YOUR NAME</p>
                </div>
                <div className="flip-card-back">
                    <div className="strip"></div>
                    <div className="mstrip"></div>
                    <div className="sstrip">
                        <p className="code">***</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentFlipCard;
