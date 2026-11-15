export const estimateDailyCosts = ({ days, itemsByDay, fareForDay, foodForDay, otherForDay, spendingLimit = null }) => {
  const limit = spendingLimit === '' || spendingLimit == null ? null : Number(spendingLimit);
  const dayBudget = Number.isFinite(limit) && limit >= 0 ? limit / days.length : null;
  return days.map(day => {
    const attractionCost = (itemsByDay[day] || []).reduce((sum, item) => sum + (Number(item.estimated_cost) || 0), 0);
    const fareCost = Number(fareForDay(day)) || 0;
    const foodCost = Number(foodForDay(day)) || 0;
    const otherCost = Number(otherForDay(day)) || 0;
    const estimatedNeed = attractionCost + fareCost + foodCost + otherCost;
    const balance = dayBudget === null ? null : dayBudget - estimatedNeed;
    return { day, dayBudget, attractionCost, fareCost, foodCost, otherCost, estimatedNeed, balance, fits: balance === null ? null : balance >= 0 };
  });
};
