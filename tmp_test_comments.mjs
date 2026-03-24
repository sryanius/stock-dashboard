import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function test() {
  try {
    const res = await yahooFinance.quoteSummary('AAPL', { modules: ['upgradeDowngradeHistory', 'recommendationTrend'] });
    console.log(JSON.stringify(res.upgradeDowngradeHistory?.history.slice(0, 3) || 'No upgrade history', null, 2));
    
    // Also try Korean stock
    const res2 = await yahooFinance.quoteSummary('005930.KS', { modules: ['upgradeDowngradeHistory', 'recommendationTrend'] }).catch(() => null);
    console.log(JSON.stringify(res2?.upgradeDowngradeHistory?.history.slice(0, 3) || 'No upgrade history for KS', null, 2));

  } catch (err) {
    console.error(err.message);
  }
}

test();
