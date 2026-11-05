import React, { useId } from 'react';
import { ARRIVAL_CATEGORIES, arrivalTotals } from '../utils/tourismArrivals';
import './TourismArrivalReports.css';

export default function TourismArrivalCounts({ values, onChange, errors = {}, readOnly = false }) {
  const id = useId(), totals = arrivalTotals(values);
  return <div className="tourism-table-wrap"><table className="tourism-counts">
    <caption>Guest arrivals by visitor category and sex</caption>
    <thead><tr><th scope="col">Visitor category</th><th scope="col">Male</th><th scope="col">Female</th><th scope="col">Total</th></tr></thead>
    <tbody>{ARRIVAL_CATEGORIES.map(category => <tr key={category.key}>
      <th scope="row">{category.label}<small>{category.definition}</small></th>
      {['male', 'female'].map(sex => { const field = `${category.key}_${sex}`; return <td key={sex}>{readOnly ? values[field] ?? '—' : <>
        <input type="number" min="0" max="2147483647" step="1" aria-label={`${category.label} ${sex} arrivals`} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `${id}-${field}` : undefined} value={values[field]} onChange={event => onChange(field, event.target.value)} />
        {errors[field] && <small className="tourism-field-error" id={`${id}-${field}`}>{errors[field]}</small>}
      </>}</td>; })}
      <td>{totals[category.key] ?? '—'}</td>
    </tr>)}</tbody>
    <tfoot><tr><th scope="row">Total arrivals</th><td>{totals.male ?? '—'}</td><td>{totals.female ?? '—'}</td><td>{totals.total ?? '—'}</td></tr></tfoot>
  </table></div>;
}
