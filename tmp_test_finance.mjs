import YahooFinance from 'yahoo-finance2';
import fs from 'fs';

const yahooFinance = new YahooFinance();

async function test() {
  try {
    const res = await yahooFinance.quoteSummary('005930.KS', { modules: ['financialData', 'recommendationTrend', 'price'] });
    fs.writeFileSync('c:/antigravity/game/stock-dashboard/tmp_out.json', JSON.stringify(res, null, 2));
    console.log("Success 삼성전자");
    
    // Also try a smaller stock like 카카오게임즈 (293490.KQ)
    const res2 = await yahooFinance.quoteSummary('293490.KQ', { modules: ['financialData', 'recommendationTrend', 'price'] });
    fs.writeFileSync('c:/antigravity/game/stock-dashboard/tmp_out2.json', JSON.stringify(res2, null, 2));
    console.log("Success 카카오게임즈");
  } catch (err) {
    console.error(err.message);
  }
}

test();
