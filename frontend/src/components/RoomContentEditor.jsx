import React from 'react';
import Icons from './Icons';
import { ROOM_CONTENT_SECTIONS } from '../utils/roomContent';

const RoomContentEditor = ({ room, onChange, disabled = false }) => (
  <>
    {ROOM_CONTENT_SECTIONS.map(section => {
      const entries = room[section.key] || [];
      const updateEntry = (index, key, value) => onChange(section.key,
        entries.map((entry, i) => i === index ? { ...entry, [key]: value } : entry));
      return (
        <div className="rm-form-sec" key={section.key}>
          <p className="hd-rm-sec-title">{section.title}</p>
          <small className="rm-hint">
            Optional. Add only accurate information for this room. Leave empty to hide this section from guests.
          </small>
          {entries.map((entry, index) => (
            <fieldset className="rm-content-entry" key={index} disabled={disabled}>
              <legend>{section.itemLabel} {index + 1}</legend>
              {section.fields.map(field => (
                <label className="rm-field" key={field.key}>
                  <span className="rm-label">
                    {field.label} {field.required && <span className="req">*</span>}
                  </span>
                  {field.multiline ? (
                    <textarea
                      className="rm-input"
                      rows={3}
                      maxLength={field.maxLength}
                      value={entry[field.key] || ''}
                      onChange={event => updateEntry(index, field.key, event.target.value)}
                    />
                  ) : (
                    <input
                      type="text"
                      className="rm-input"
                      maxLength={field.maxLength}
                      value={entry[field.key] || ''}
                      onChange={event => updateEntry(index, field.key, event.target.value)}
                    />
                  )}
                </label>
              ))}
              <button
                type="button"
                className="rm-btn rm-btn-danger"
                aria-label={`Remove ${section.itemLabel.toLowerCase()} ${index + 1}`}
                onClick={() => onChange(section.key, entries.filter((_, i) => i !== index))}
              >
                <Icons.X size={14} /> Remove
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            className="rm-btn rm-btn-ghost rm-content-add"
            disabled={disabled || entries.length >= section.maxItems}
            onClick={() => onChange(section.key, [...entries,
              Object.fromEntries(section.fields.map(field => [field.key, '']))])}
          >
            <Icons.Plus size={14} /> {section.addLabel} ({entries.length}/{section.maxItems})
          </button>
        </div>
      );
    })}
  </>
);

export default RoomContentEditor;
