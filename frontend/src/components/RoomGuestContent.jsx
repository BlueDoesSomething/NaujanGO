import React from 'react';
import Icons from './Icons';
import { getRoomContentItems } from '../utils/roomContent';

export const RoomPerfectFor = ({ items }) => {
  const entries = getRoomContentItems(items, 'perfect_for');
  if (!entries.length) return null;
  return (
    <div className="hd-rm-sec">
      <p className="hd-rm-sec-title">Perfect for</p>
      <div className="hd-rm-grid2">
        {entries.map((item, index) => (
          <div className="hd-rm-perfect" key={index}>
            <Icons.Users size={14} />
            <p className="hd-rm-perfect-l">{item.label}</p>
            {item.detail && <p className="hd-rm-perfect-d">{item.detail}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export const RoomCommonQuestions = ({ items }) => {
  const entries = getRoomContentItems(items, 'common_questions');
  if (!entries.length) return null;
  return (
    <div className="hd-rm-sec">
      <p className="hd-rm-sec-title">Common questions</p>
      <div className="hd-rm-faq">
        {entries.map((item, index) => (
          <details className="hd-rm-faq-item" key={index}>
            <summary>
              <span><Icons.Info size={13} /> {item.question}</span>
              <span className="hd-rm-chev"><Icons.ChevronDown size={14} /></span>
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
};
