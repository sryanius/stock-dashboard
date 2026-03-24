import FinanceDataReader as fdr
import json
import traceback

try:
    df_krx = fdr.StockListing('KRX')
    stocks = []
    
    for idx, row in df_krx.iterrows():
        symbol = str(row['Code'])
        market = str(row['Market'])
        name = str(row['Name'])
        
        if market == 'KOSPI':
            suffix = '.KS'
            exchange = 'KSC'
        elif market == 'KOSDAQ':
            suffix = '.KQ'
            exchange = 'KOE'
        else:
            continue
            
        stocks.append({
            "symbol": f"{symbol}{suffix}",
            "shortname": name,
            "exchange": exchange,
            "typeDisp": "Equity"
        })
        
    with open('src/lib/korean-stocks.json', 'w', encoding='utf-8') as f:
        json.dump(stocks, f, ensure_ascii=False)
        
    print(f"Successfully wrote {len(stocks)} stocks to korean-stocks.json")
except Exception as e:
    traceback.print_exc()
