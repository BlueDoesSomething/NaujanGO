import express from 'express';
import { listArrivalReports, arrivalReportDetails, saveArrivalDraft, submitArrivalReport, reviewArrivalReport, arrivalCoverage, arrivalSummary, exportArrivalReports, respondArrivalError } from '../services/tourismArrivalReports.js';

// Mounted only after the parent dashboard's authentication and role checks.
const route = handler => async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method) && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) return res.status(400).json({ error: 'Send the report fields as a JSON object.' });
  try { res.json(await handler(req)); }
  catch (error) { respondArrivalError(res, error); }
};
export const ownerArrivalReports = express.Router();
ownerArrivalReports.get('/', route(req => listArrivalReports(req.user, req.query)));
ownerArrivalReports.get('/coverage', route(req => arrivalCoverage(req.user, req.query)));
ownerArrivalReports.get('/:id', route(req => arrivalReportDetails(req.user, req.params.id)));
ownerArrivalReports.post('/', route(req => saveArrivalDraft(req.user, null, req.body)));
ownerArrivalReports.put('/:id', route(req => saveArrivalDraft(req.user, req.params.id, req.body)));
ownerArrivalReports.post('/:id/submit', route(req => submitArrivalReport(req.user, req.params.id, req.body)));

export const adminArrivalReports = express.Router();
adminArrivalReports.get('/', route(req => listArrivalReports(req.user, req.query, true)));
adminArrivalReports.get('/coverage', route(req => arrivalCoverage(req.user, req.query, true)));
adminArrivalReports.get('/summary', route(req => arrivalSummary(req.query)));
adminArrivalReports.get('/export', route(req => exportArrivalReports(req.query)));
adminArrivalReports.get('/:id', route(req => arrivalReportDetails(req.user, req.params.id, true)));
adminArrivalReports.post('/:id/review', route(req => reviewArrivalReport(req.user, req.params.id, req.body)));
